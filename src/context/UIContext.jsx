import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const UIContext = createContext(null);
const TOAST_DURATION = 4000;

const toastVariantClasses = {
  error: "bg-rose-50 border-rose-200 text-rose-700",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  info: "bg-blue-50 border-blue-200 text-blue-700",
  warning: "bg-amber-50 border-amber-200 text-amber-700",
};

const toneToVariant = (tone) => {
  if (tone === "error") return "error";
  if (tone === "warning") return "warning";
  if (tone === "info") return "info";
  return "success";
};

export const UIProvider = ({ children }) => {
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState("success");
  const [errorMessage, setErrorMessage] = useState("");
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const toastTimeouts = useRef({});

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    if (toastTimeouts.current[id]) {
      clearTimeout(toastTimeouts.current[id]);
      delete toastTimeouts.current[id];
    }
  }, []);

  const pushToast = useCallback(
    (variant, message, options = {}) => {
      if (!message) return null;
      const duration = options.duration ?? TOAST_DURATION;
      const id = toastIdRef.current++;
      setToasts((prev) => [...prev, { id, variant, message }]);
      toastTimeouts.current[id] = setTimeout(() => {
        dismissToast(id);
      }, duration);
      return id;
    },
    [dismissToast]
  );

  useEffect(
    () => () => {
      Object.values(toastTimeouts.current).forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      toastTimeouts.current = {};
    },
    []
  );

  const setStatus = useCallback(
    (message = "", options = {}) => {
      const { tone = "success", toast = false } = options;
      setStatusMessage(message);
      setStatusTone(tone);
      if (toast && message) {
        pushToast(toneToVariant(tone), message, options);
      }
    },
    [pushToast]
  );

  const setError = useCallback(
    (message = "", options = {}) => {
      const { toast = true } = options;
      setErrorMessage(message);
      if (toast && message) {
        pushToast("error", message, options);
      }
    },
    [pushToast]
  );

  const clearStatus = useCallback(() => {
    setStatusMessage("");
    setErrorMessage("");
  }, []);

  const value = useMemo(
    () => ({
      statusMessage,
      statusTone,
      errorMessage,
      setStatus,
      setError,
      clearStatus,
      pushToast,
      dismissToast,
      toasts,
    }),
    [
      statusMessage,
      statusTone,
      errorMessage,
      setStatus,
      setError,
      clearStatus,
      pushToast,
      dismissToast,
      toasts,
    ]
  );

  return (
    <UIContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </UIContext.Provider>
  );
};

export const useUIContext = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUIContext must be used within a UIProvider");
  }
  return context;
};

const ToastViewport = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto w-72 rounded-lg border px-4 py-3 text-sm shadow-lg ${
            toastVariantClasses[toast.variant] ?? toastVariantClasses.success
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900"
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
