import { useEffect } from "react";
import { X } from "lucide-react";

export interface ViewableDocument {
  name: string;
  url: string;
  type: string;
  isSample?: boolean;
}

interface DocumentViewerProps {
  document: ViewableDocument | null;
  onClose: () => void;
  closeLabel: string;
  sampleNote: string;
}

export default function DocumentViewer({ document: doc, onClose, closeLabel, sampleNote }: DocumentViewerProps) {
  useEffect(() => {
    if (!doc) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc, onClose]);

  if (!doc) return null;

  const isImage = doc.type.startsWith("image/");
  const isPdf = doc.type === "application/pdf";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={doc.name}
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl2 bg-white shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{doc.name}</p>
            {doc.isSample && <p className="text-xs text-ink-faint">{sampleNote}</p>}
          </div>
          <button
            onClick={onClose}
            className="touch-target flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-black/5"
            aria-label={closeLabel}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-paper p-4">
          {isImage && (
            <img
              src={doc.url}
              alt={doc.name}
              className="mx-auto max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
            />
          )}
          {isPdf && <iframe src={doc.url} title={doc.name} className="h-[70vh] w-full rounded-lg border border-line" />}
          {!isImage && !isPdf && (
            <p className="p-6 text-center text-sm text-ink-faint">
              Preview isn't available for this file type. ({doc.type || "unknown"})
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
