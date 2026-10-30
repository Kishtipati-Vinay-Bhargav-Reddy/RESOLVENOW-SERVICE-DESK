import { useEffect, useRef } from "react";
import Icon from "./Icon";

function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", tone = "primary", isBusy = false, onConfirm, onCancel }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return <dialog className="confirm-dialog" ref={dialogRef} onCancel={(event) => { event.preventDefault(); onCancel(); }}
    aria-labelledby="confirm-title" aria-describedby="confirm-message">
    <div className="dialog-icon"><Icon name="clock" /></div>
    <h2 id="confirm-title">{title}</h2>
    <p id="confirm-message">{message}</p>
    <div className="dialog-actions">
      <button className="button button-secondary" type="button" onClick={onCancel} disabled={isBusy}>Cancel</button>
      <button className={`button ${tone === "danger" ? "button-danger" : "button-primary"}`} type="button"
        onClick={onConfirm} disabled={isBusy}>{isBusy ? "Updating..." : confirmLabel}</button>
    </div>
  </dialog>;
}

export default ConfirmDialog;