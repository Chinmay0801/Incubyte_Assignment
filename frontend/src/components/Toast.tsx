import { useEffect } from 'react';

export interface ToastMessage {
  id: number;
  kind: 'success' | 'error';
  text: string;
}

const DISMISS_AFTER_MS = 5000;

/** A single transient notification. Errors are announced assertively, successes politely. */
export function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, DISMISS_AFTER_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isError = toast.kind === 'error';
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div
        role={isError ? 'alert' : 'status'}
        className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-md border px-4 py-3 text-sm shadow-xl ${
          isError ? 'border-stamp bg-asphalt-950 text-sticker' : 'border-paint/70 bg-asphalt-950 text-sticker'
        }`}
      >
        <span aria-hidden="true" className={`h-5 w-1 -skew-x-12 ${isError ? 'bg-stamp' : 'bg-paint'}`} />
        <span>{toast.text}</span>
        <button type="button" onClick={onDismiss} className="ml-2 font-mono text-xs text-asphalt-300 hover:text-sticker" aria-label="Dismiss">
          ✕
        </button>
      </div>
    </div>
  );
}
