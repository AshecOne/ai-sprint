"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, HelpCircle } from "lucide-react";

export type ConfirmTone = "default" | "danger";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  /** When provided, renders a "don't ask again" checkbox bound to this state. */
  remember?: boolean;
  onRememberChange?: (next: boolean) => void;
  rememberLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Game-themed confirmation modal. Presentational only — open/close and the
 * confirm/cancel handlers are owned by the caller (see ConfirmProvider).
 * Closes via Cancel, backdrop click, or Esc. Focus moves to the confirm
 * button on open and is restored to the previously focused element on close.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  remember,
  onRememberChange,
  rememberLabel = "Don't ask again",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<Element | null>(null);

  // Esc to cancel; lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    document.addEventListener("keydown", onKey);
    // Focus the primary action once mounted.
    const id = window.requestAnimationFrame(() => confirmRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      window.cancelAnimationFrame(id);
      // Restore focus to whatever triggered the dialog.
      if (lastFocused.current instanceof HTMLElement) {
        lastFocused.current.focus();
      }
    };
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="confirm-backdrop"
      onMouseDown={(e) => {
        // Only dismiss when the backdrop itself is pressed, not the dialog.
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className={`confirm-dialog${tone === "danger" ? " confirm-dialog--danger" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        data-testid="confirm-dialog"
      >
        <div className="confirm-dialog__head">
          <span className="confirm-dialog__icon" aria-hidden="true">
            {tone === "danger" ? (
              <AlertTriangle size={18} strokeWidth={2.5} />
            ) : (
              <HelpCircle size={18} strokeWidth={2.5} />
            )}
          </span>
          <h2 id="confirm-title" className="confirm-dialog__title">
            {title}
          </h2>
        </div>

        <p id="confirm-message" className="confirm-dialog__message">
          {message}
        </p>

        {onRememberChange && (
          <label className="confirm-dialog__remember">
            <input
              type="checkbox"
              checked={!!remember}
              onChange={(e) => onRememberChange(e.target.checked)}
              data-testid="confirm-remember"
            />
            {rememberLabel}
          </label>
        )}

        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            data-testid="confirm-cancel"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`btn${tone === "danger" ? " btn-danger" : ""}`}
            onClick={onConfirm}
            data-testid="confirm-accept"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
