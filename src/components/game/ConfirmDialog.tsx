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
 *
 * The overlay is portaled to <body>, so its layout (fixed + centering) is set
 * with inline styles rather than utility/global classes — that guarantees it
 * always floats centered regardless of stylesheet load/cache quirks. Inner
 * visuals reuse the proven .panel / .section-title / .btn classes.
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

  // Esc to cancel; move focus to the primary action; restore focus on close.
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
    const id = window.requestAnimationFrame(() => confirmRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      window.cancelAnimationFrame(id);
      if (lastFocused.current instanceof HTMLElement) {
        lastFocused.current.focus();
      }
    };
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  const danger = tone === "danger";

  return createPortal(
    <div
      // Inline layout = bulletproof: always a fixed, full-screen, centered
      // overlay even if global/utility CSS hasn't loaded for the portal node.
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(3, 8, 14, 0.6)",
        backdropFilter: "blur(2px)",
      }}
      onMouseDown={(e) => {
        // Only dismiss when the backdrop itself is pressed, not the dialog.
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="panel"
        style={{
          width: "100%",
          maxWidth: 360,
          padding: 18,
          borderColor: danger ? "rgba(248, 113, 113, 0.45)" : undefined,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        data-testid="confirm-dialog"
      >
        <div className="flex items-center gap-2.5 mb-2.5">
          <span
            className="inline-flex"
            style={{ color: danger ? "#fca5a5" : "var(--accent-cyan)" }}
            aria-hidden="true"
          >
            {danger ? (
              <AlertTriangle size={18} strokeWidth={2.5} />
            ) : (
              <HelpCircle size={18} strokeWidth={2.5} />
            )}
          </span>
          <h2 id="confirm-title" className="section-title" style={{ margin: 0 }}>
            {title}
          </h2>
        </div>

        <p
          id="confirm-message"
          className="text-[12px] leading-relaxed text-slate-300"
          style={{ margin: "0 0 14px" }}
        >
          {message}
        </p>

        {onRememberChange && (
          <label className="flex items-center gap-2 mb-3.5 text-[11px] text-slate-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!remember}
              onChange={(e) => onRememberChange(e.target.checked)}
              style={{ width: 14, height: 14, accentColor: "var(--accent-cyan)", cursor: "pointer" }}
              data-testid="confirm-remember"
            />
            {rememberLabel}
          </label>
        )}

        <div className="flex justify-end gap-2">
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
            className={`btn${danger ? " btn-danger" : ""}`}
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
