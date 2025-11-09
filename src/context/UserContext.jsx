import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_BASE } from "../utils/leanConfig";

const TOKEN_REFRESH_INTERVAL = 300_000; // 5 minutes

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState("");
  const [leanTokens, setLeanTokens] = useState(null);
  const [tokensRefreshing, setTokensRefreshing] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [lastTokenRefresh, setLastTokenRefresh] = useState(null);

  const refreshLeanTokens = useCallback(async () => {
    if (!userId) {
      setLeanTokens(null);
      return null;
    }
    setTokensRefreshing(true);
    setTokenError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/lean/connect?userId=${encodeURIComponent(userId)}`
      );
      if (!res.ok) throw new Error("Token fetch failed");
      const data = await res.json();
      setLeanTokens(data);
      setLastTokenRefresh(Date.now());
      return data;
    } catch (err) {
      setTokenError(err.message || "Unable to refresh Lean tokens");
      throw err;
    } finally {
      setTokensRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLeanTokens(null);
      return;
    }
    let cancelled = false;
    let timerId;

    const cycle = async () => {
      try {
        await refreshLeanTokens();
      } catch (err) {
        console.error("Lean token refresh failed", err);
      }
      if (!cancelled) {
        timerId = setTimeout(cycle, TOKEN_REFRESH_INTERVAL);
      }
    };

    cycle();

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [userId, refreshLeanTokens]);

  const value = useMemo(
    () => ({
      userId,
      setUserId,
      hasUser: Boolean(userId?.trim()),
      leanTokens,
      refreshLeanTokens,
      tokensRefreshing,
      tokenError,
      lastTokenRefresh,
    }),
    [
      userId,
      leanTokens,
      refreshLeanTokens,
      tokensRefreshing,
      tokenError,
      lastTokenRefresh,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
