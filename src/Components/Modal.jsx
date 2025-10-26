import { useEffect } from "react";
import { LuX } from "react-icons/lu";

export const Modal = ({ title = "Note", children, onClose }) => {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              aria-label="Close"
              title="Close"
            >
              <LuX size={20} />
            </button>
          </div>
          <div className="px-4 sm:px-5 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
};
