import { useEffect, useId, useRef, type ReactNode } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Accessible modal dialog: closes on Escape, focuses its first field and restores focus on close. */
export function Modal({ title, onClose, children }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const firstField = panelRef.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-close])');
    firstField?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-asphalt-950/80 p-4 backdrop-blur-sm sm:items-center">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-md border border-asphalt-700 bg-asphalt-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-asphalt-700 px-5 py-3">
          <h2 id={titleId} className="flex items-center gap-3 font-display text-2xl font-extrabold tracking-wide uppercase">
            <span className="bay-line" aria-hidden="true" />
            {title}
          </h2>
          <button type="button" data-close aria-label="Close" onClick={onClose} className="rounded p-1 text-asphalt-300 hover:text-sticker">
            <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
