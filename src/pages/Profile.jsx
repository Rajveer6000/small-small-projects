import { useEffect, useState } from "react";
import { useUserContext } from "../context/UserContext";
import { useUIContext } from "../context/UIContext";
import { API_BASE } from "../utils/leanConfig";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "—";

const Profile = () => {
  const { userId, hasUser } = useUserContext();
  const { setStatus, setError } = useUIContext();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUserDetails = async () => {
    if (!hasUser) {
      setError("Set a user id first.");
      return;
    }
    setLoading(true);
    setError("");
    setStatus("Loading profile...");
    try {
      const res = await fetch(
        `${API_BASE}/api/lean/UserDetails?userId=${encodeURIComponent(userId)}`
      );
      if (!res.ok) throw new Error("User details fetch failed");
      const data = await res.json();
      setProfile(data.payload);
      setStatus("Profile loaded successfully.");
    } catch (err) {
      setError(err.message || "Unable to load profile");
    } finally {
      setLoading(false);
    }
  };

  const documents = profile?.documents || [];
  const addresses = profile?.addresses || [];
  const employment = profile?.employment;
  const derived = profile
    ? {
        fullName: profile.full_name || profile.name || "Unknown customer",
        dob: profile.date_of_birth || profile.birth_date,
        nationality: profile.nationality || profile.country || "-",
        gender: profile.gender || profile.sex || "-",
        email: profile.email || profile.email_address || "-",
        phone:
          profile.phone ||
          profile.phone_number ||
          profile.mobile_number ||
          "-",
        emiratesId:
          profile.emirates_id ||
          profile.national_id ||
          profile.national_identity_number ||
          "-",
        status: profile.status || "UNKNOWN",
        address:
          profile.address ||
          profile.address_line ||
          profile.address_line_1 ||
          "",
      }
    : null;

  useEffect(() => {
    if (hasUser) {
      fetchUserDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUser, userId]);

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Profile</h3>
            <p className="text-sm text-slate-500">
              Pull the latest Lean UserDetails for this customer.
            </p>
          </div>
          <button
            onClick={fetchUserDetails}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:bg-slate-400"
          >
            {loading ? "Loading..." : "Load Profile"}
          </button>
        </div>
        {!hasUser && (
          <p className="text-sm text-rose-600">
            Add a user id from the top bar to fetch profile data.
          </p>
        )}
      </section>

      {profile && (
        <>
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase text-slate-500">Full name</p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {derived?.fullName}
                </h2>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <span>
                  DOB:{" "}
                  <strong className="text-slate-900">
                    {formatDate(derived?.dob)}
                  </strong>
                </span>
                <span>
                  Nationality:{" "}
                  <strong className="text-slate-900">
                    {derived?.nationality || "-"}
                  </strong>
                </span>
                <span>
                  Gender:{" "}
                  <strong className="text-slate-900">
                    {derived?.gender || "-"}
                  </strong>
                </span>
              </div>
            </div>
            {derived?.address && (
              <p className="text-sm text-slate-500 mt-3">
                Address: <span className="text-slate-900">{derived.address}</span>
              </p>
            )}
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">
                Contact
              </h4>
              <div className="text-sm text-slate-600 space-y-2">
                <p>
                  Email:{" "}
                  <span className="font-semibold text-slate-900">
                    {derived?.email}
                  </span>
                </p>
                <p>
                  Phone:{" "}
                  <span className="font-semibold text-slate-900">
                    {derived?.phone}
                  </span>
                </p>
              </div>
            </section>
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">
                Compliance
              </h4>
              <div className="text-sm text-slate-600 space-y-2">
                <p>
                  Emirates ID:{" "}
                  <span className="font-semibold text-slate-900">
                    {derived?.emiratesId}
                  </span>
                </p>
                <p>
                  Status:{" "}
                  <span className="font-semibold text-slate-900">
                    {derived?.status || "-"}
                  </span>
                </p>
              </div>
            </section>
          </div>

          {documents.length > 0 && (
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">
                Documents
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600">
                {documents.map((doc, idx) => (
                  <div
                    key={`${doc.type}-${idx}`}
                    className="border border-slate-100 rounded-lg p-3 bg-slate-50"
                  >
                    <div className="text-xs uppercase text-slate-500">
                      {doc.type || "Document"}
                    </div>
                    <div className="font-semibold text-slate-900">
                      {doc.number || doc.masked_number || "—"}
                    </div>
                    <div className="text-xs text-slate-500">
                      Issued {formatDate(doc.issue_date)} · Expires{" "}
                      {formatDate(doc.expiry_date)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {addresses.length > 0 && (
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">
                Addresses
              </h4>
              <div className="space-y-3 text-sm text-slate-600">
                {addresses.map((address, idx) => (
                  <div
                    key={`${address.type}-${idx}`}
                    className="border border-slate-100 rounded-lg p-3 bg-slate-50"
                  >
                    <div className="text-xs uppercase text-slate-500">
                      {address.type || "Address"}
                    </div>
                    <p className="font-semibold text-slate-900">
                      {address.address_line_1}
                    </p>
                    <p>
                      {[address.city, address.country]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {employment && (
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">
                Employment
              </h4>
              <div className="text-sm text-slate-600 space-y-2">
                <p>
                  Employer:{" "}
                  <span className="font-semibold text-slate-900">
                    {employment.employer || "—"}
                  </span>
                </p>
                <p>
                  Role:{" "}
                  <span className="font-semibold text-slate-900">
                    {employment.role || employment.position || "—"}
                  </span>
                </p>
                <p>
                  Salary:{" "}
                  <span className="font-semibold text-slate-900">
                    {employment.salary
                      ? `${employment.salary.amount} ${employment.salary.currency}`
                      : "—"}
                  </span>
                </p>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;
