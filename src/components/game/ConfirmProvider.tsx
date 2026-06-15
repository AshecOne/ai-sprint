"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { ConfirmDialog, type ConfirmTone } from "./ConfirmDialog";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  /**
   * When set, the dialog shows a "don't ask again" checkbox. Ticking it and
   * confirming suppresses every future confirm() with the same key for the
   * rest of the session (state lives here, not persisted — a refresh resets).
   */
  rememberKey?: string;
  rememberLabel?: string;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface DialogState extends ConfirmOptions {
  open: boolean;
}

const CLOSED: DialogState = { open: false, title: "", message: "" };

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>(CLOSED);
  const [remember, setRemember] = useState(false);
  // Keys the player chose to stop confirming (session-only).
  const suppressed = useRef<Set<string>>(new Set());
  // Resolver for the in-flight confirm() promise.
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const settle = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setState(CLOSED);
    setRemember(false);
  }, []);

  const confirm = useCallback<ConfirmFn>((opts) => {
    // Auto-approve actions the player previously opted out of confirming.
    if (opts.rememberKey && suppressed.current.has(opts.rememberKey)) {
      return Promise.resolve(true);
    }
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setRemember(false);
      setState({ ...opts, open: true });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (remember && state.rememberKey) {
      suppressed.current.add(state.rememberKey);
    }
    settle(true);
  }, [remember, state.rememberKey, settle]);

  const handleCancel = useCallback(() => settle(false), [settle]);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={state.open}
        title={state.title}
        message={state.message}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        tone={state.tone}
        remember={remember}
        rememberLabel={state.rememberLabel}
        onRememberChange={state.rememberKey ? setRemember : undefined}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}

/** Imperative confirm: `if (await confirm({ ... })) doThing()`. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a <ConfirmProvider>");
  }
  return ctx;
}
