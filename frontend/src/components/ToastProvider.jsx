import { useEffect, useState } from "react";
import Icon from "./Icon";
import { ToastContext } from "./ToastContext";

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timeout = window.setTimeout(() => onDismiss(toast.id), 4800);
    return () => window.clearTimeout(timeout);
  }, [toast.id, onDismiss]);

  return <div className={`toast toast-${toast.tone}`} role={toast.tone === "error" ? "alert" : "status"}>
    <span className="toast-mark"><Icon name={toast.tone === "error" ? "close" : "check"} size={16} /></span>
    <span>{toast.message}</span>
    <button type="button" aria-label="Dismiss message" onClick={() => onDismiss(toast.id)}><Icon name="close" size={15} /></button>
  </div>;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = (id) => setToasts((current) => current.filter((toast) => toast.id !== id));
  const showToast = (message, tone = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current.slice(-2), { id, message, tone }]);
  };

  return <ToastContext.Provider value={showToast}>
    {children}
    <div className="toast-stack" aria-live="polite" aria-relevant="additions text">
      {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />)}
    </div>
  </ToastContext.Provider>;
}
