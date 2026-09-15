import { useRef, useState } from "react";
import { FileText, Upload, CheckCircle2, Loader2, Eye, ScanText, AlertCircle } from "lucide-react";
import type { UploadedDocument } from "../types/intake";
import DocumentViewer from "./DocumentViewer";

interface TesseractResult {
  data: { text: string };
}
interface TesseractGlobal {
  recognize: (image: File | Blob | string, language: string, options?: { logger?: (message: { status?: string; progress?: number }) => void }) => Promise<TesseractResult>;
}
declare global {
  interface Window { Tesseract?: TesseractGlobal; }
}

let tesseractLoader: Promise<TesseractGlobal> | null = null;

function loadTesseract(): Promise<TesseractGlobal> {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (tesseractLoader) return tesseractLoader;

  const loader: Promise<TesseractGlobal> = new Promise<TesseractGlobal>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-medi-kiosk-ocr="tesseract"]');
    if (existing) {
      existing.addEventListener("load", () => window.Tesseract ? resolve(window.Tesseract) : reject(new Error("OCR library unavailable")));
      existing.addEventListener("error", () => reject(new Error("OCR library failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@6/dist/tesseract.min.js";
    script.async = true;
    script.dataset.mediKioskOcr = "tesseract";
    script.onload = () => window.Tesseract ? resolve(window.Tesseract) : reject(new Error("OCR library unavailable"));
    script.onerror = () => reject(new Error("OCR library failed to load"));
    document.head.appendChild(script);
  }).catch((error) => {
    tesseractLoader = null;
    throw error;
  });
  tesseractLoader = loader;
  return loader;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function cleanOcrText(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 1)
    .slice(0, 80);
}

interface DocumentUploadProps {
  documents: UploadedDocument[];
  onAdd: (doc: UploadedDocument) => void;
  onProcessed: (id: string, extracted: string[]) => void;
  title: string;
  subtitle: string;
  uploadLabel: string;
  processedLabel: string;
  processingLabel: string;
  viewLabel: string;
  closeLabel: string;
  sampleNote: string;
  continueLabel?: string;
  skipLabel?: string;
  onContinue?: () => void;
}

export default function DocumentUpload({
  documents,
  onAdd,
  onProcessed,
  title,
  subtitle,
  uploadLabel,
  processedLabel,
  processingLabel,
  viewLabel,
  closeLabel,
  sampleNote,
  continueLabel,
  skipLabel,
  onContinue,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [viewing, setViewing] = useState<UploadedDocument | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState<Record<string, number>>({});

  const runOcr = async (file: File, id: string) => {
    // Tesseract.js runs the English OCR model in the browser. Images are the
    // reliable prototype input; PDFs remain viewable but are not OCR'd here.
    if (!file.type.startsWith("image/")) {
      onProcessed(id, ["PDF uploaded successfully.", "English OCR is available for JPG/PNG document images in this prototype."]);
      return;
    }

    try {
      setOcrError(null);
      setOcrProgress((p) => ({ ...p, [id]: 0 }));
      const tesseract = await loadTesseract();
      const result = await tesseract.recognize(file, "eng", {
        logger: (message) => {
          if (typeof message.progress === "number") {
            const progress = message.progress;
            setOcrProgress((p) => ({ ...p, [id]: Math.round(progress * 100) }));
          }
        },
      });
      const lines = cleanOcrText(result.data.text);
      onProcessed(id, lines.length ? lines : ["No readable English text was detected."]);
    } catch (error) {
      console.error("OCR failed", error);
      setOcrError("OCR could not process this image. You can continue and the original document will still be saved.");
      onProcessed(id, ["OCR processing failed."]);
    } finally {
      setOcrProgress((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const doc: UploadedDocument = {
        id,
        name: file.name,
        type: file.type || "document",
        sizeLabel: formatSize(file.size),
        status: "processing",
        url: URL.createObjectURL(file),
      };
      onAdd(doc);
      void runOcr(file, id);
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-teal-700 shadow-sm">
          <ScanText size={38} />
        </div>
        <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-base font-semibold text-white/80">{subtitle}</p>
      </div>

      <label className="flex min-h-[130px] touch-target cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-white/50 bg-white/15 p-6 text-white transition-all hover:bg-white/25 active:scale-[0.99]">
        <Upload size={30} />
        <span className="text-xl font-extrabold">{uploadLabel}</span>
        <span className="text-sm font-medium text-white/75">JPG / PNG / PDF</span>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {ocrError && (
        <div className="flex items-start gap-2 rounded-2xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-900">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{ocrError}</span>
        </div>
      )}

      {documents.length > 0 && (
        <ul className="space-y-4">
          {documents.map((doc) => (
            <li key={doc.id} className="rounded-3xl border-2 border-white/30 bg-white p-5 text-sky-950 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                  <FileText size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-base font-extrabold">{doc.name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {doc.sizeLabel} · {doc.status === "processed" ? (
                      <span className="inline-flex items-center gap-1 font-bold text-teal-700"><CheckCircle2 size={14} /> {processedLabel}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-slate-600"><Loader2 size={14} className="animate-spin" /> {processingLabel}{ocrProgress[doc.id] !== undefined ? ` ${ocrProgress[doc.id]}%` : ""}</span>
                    )}
                  </p>
                </div>
                {doc.status === "processed" && doc.url && (
                  <button type="button" onClick={() => setViewing(doc)} className="touch-target flex shrink-0 items-center gap-1.5 rounded-xl border border-teal-200 px-3 py-2 text-sm font-bold text-teal-800 hover:bg-teal-50 active:scale-95">
                    <Eye size={15} /> {viewLabel}
                  </button>
                )}
              </div>

              {doc.status === "processed" && doc.extracted && (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">Extracted English text</p>
                  <div className="max-h-56 overflow-y-auto space-y-1.5">
                    {doc.extracted.map((line, index) => (
                      <p key={`${doc.id}-${index}`} className="break-words text-sm font-medium leading-relaxed text-slate-800">{line}</p>
                    ))}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-xs font-semibold text-white/65">English OCR is powered by Tesseract.js in this prototype.</p>

      {onContinue && (
        <div className="flex flex-wrap gap-4 pt-2">
          {skipLabel && (
            <button type="button" onClick={onContinue} className="min-h-[68px] flex-1 rounded-2xl border-2 border-white/50 bg-white/10 px-5 text-lg font-extrabold text-white transition-all hover:bg-white/20 active:scale-[0.98]">
              {skipLabel}
            </button>
          )}
          <button type="button" onClick={onContinue} className="min-h-[68px] flex-[2] rounded-2xl bg-white px-6 text-lg font-extrabold text-sky-900 shadow-lg transition-all hover:bg-sky-50 active:scale-[0.98]">
            {continueLabel}
          </button>
        </div>
      )}

      <DocumentViewer
        document={viewing && viewing.url ? { name: viewing.name, url: viewing.url, type: viewing.type, isSample: viewing.isSample } : null}
        onClose={() => setViewing(null)}
        closeLabel={closeLabel}
        sampleNote={sampleNote}
      />
    </div>
  );
}
