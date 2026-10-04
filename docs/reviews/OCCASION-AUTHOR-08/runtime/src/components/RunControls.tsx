import { useEffect, useRef } from 'react';

export function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export type PendingAction = { label: string; detail: string; run: () => void };
export function ConfirmationDialog({ action, cancel }: { action: PendingAction; cancel: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); return () => dialog.current?.close(); }, []);
  return <dialog ref={dialog} aria-labelledby="confirm-title" onCancel={cancel}><h2 id="confirm-title">Confirm this action</h2><p>{action.label}</p><p>{action.detail}</p><div className="toolbar"><button autoFocus className="quiet" onClick={cancel}>Cancel</button><button onClick={() => { cancel(); action.run(); }}>Confirm action</button></div></dialog>;
}
