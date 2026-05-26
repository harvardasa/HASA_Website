'use client';

import { ReactNode } from 'react';

type ConfirmActionPanelProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  tone?: 'danger' | 'warning';
  children?: ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export default function ConfirmActionPanel({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  busy = false,
  tone = 'danger',
  children,
  onConfirm,
  onCancel,
}: ConfirmActionPanelProps) {
  if (!open) {
    return null;
  }

  const confirmClasses =
    tone === 'warning'
      ? 'border-amber-300 bg-amber-600 text-white hover:bg-amber-700'
      : 'border-red-300 bg-red-600 text-white hover:bg-red-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{description}</p>

        {children ? <div className="mt-4">{children}</div> : null}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={busy}
            className={`rounded-md border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${confirmClasses}`}
          >
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}