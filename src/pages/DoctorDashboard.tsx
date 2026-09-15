import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ClipboardCheck,
  AlertTriangle,
  Timer,
  ChevronLeft,
  FileText,
  Pill,
  ShieldAlert,
  History,
  Bot,
  Paperclip,
  Eye,
  StickyNote,
  Radio,
} from "lucide-react";
import Logo from "../components/Logo";
import MedicalSummary from "../components/MedicalSummary";
import DocumentViewer, { type ViewableDocument } from "../components/DocumentViewer";
import AmbientListeningPanel from "../components/AmbientListeningPanel";
import { useIntake } from "../services/IntakeContext";
import { t } from "../data/translations";
import { mockPatients } from "../data/mockPatients";
import { loadQueuedPatients, type QueuedPatient } from "../services/patientQueue";
import { loadAmbientNote } from "../services/ambientNotes";

const tabs = [
  { key: "summary", label: "Clinical Summary", icon: FileText },
  { key: "timeline", label: "Timeline", icon: History },
  { key: "symptoms", label: "Symptoms", icon: ShieldAlert },
  { key: "medications", label: "Medications", icon: Pill },
  { key: "notes", label: "Additional Notes", icon: StickyNote },
  { key: "documents", label: "Documents", icon: Paperclip },
  { key: "ambient", label: "Ambient Listening", icon: Radio },
  { key: "ainotes", label: "AI Notes", icon: Bot },
] as const;

type TabKey = (typeof tabs)[number]["key"];

/** Unified view of a mock (seeded) patient or a real submitted intake, for rendering. */
interface DisplayPatient {
  id: string;
  queueNumber: string;
  name: string;
  age: number;
  sex: string;
  pathway: string;
  status: string;
  redFlag: boolean;
  abhaLinked: boolean;
  abhaId: string | null;
  complaint: string;
  symptoms: string;
  medications: string;
  allergies: string;
  familyHistory: string;
  additionalNotes: string;
  documents: ViewableDocument[];
  aiNotes: string;
  timeline: { time: string; event: string }[];
  summary: string;
  isLive: boolean;
}

function fromMock(p: (typeof mockPatients)[number]): DisplayPatient {
  return {
    id: p.id,
    queueNumber: p.queueNumber,
    name: p.name,
    age: p.age,
    sex: p.sex,
    pathway: p.pathway,
    status: p.status === "Reviewed" ? "Reviewed" : "Ready for Review",
    redFlag: p.redFlag,
    abhaLinked: false,
    abhaId: null,
    complaint: p.complaint,
    symptoms: p.symptoms,
    medications: p.medications,
    allergies: p.allergies,
    familyHistory: p.familyHistory,
    additionalNotes: "Not provided",
    documents: p.documents,
    aiNotes: p.aiNotes,
    timeline: p.timeline,
    summary: p.summary,
    isLive: false,
  };
}

function fromQueued(p: QueuedPatient): DisplayPatient {
  return {
    id: p.id,
    queueNumber: p.queueNumber,
    name: p.name,
    age: p.age,
    sex: p.sex,
    pathway: p.pathway,
    status: p.status,
    redFlag: p.redFlag,
    abhaLinked: p.abhaLinked,
    abhaId: p.abhaId,
    complaint: p.complaint,
    symptoms: p.symptoms,
    medications: p.medications,
    allergies: p.allergies,
    familyHistory: p.familyHistory,
    additionalNotes: p.additionalNotes,
    documents: p.documents
      .filter((d) => d.url)
      .map((d) => ({ name: d.name, url: d.url as string, type: d.type, isSample: d.isSample })),
    aiNotes: p.aiNotes,
    timeline: [{ time: new Date(p.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), event: "Intake submitted from kiosk" }],
    summary: p.summary,
    isLive: true,
  };
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { state } = useIntake();
  const lang = state.language;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [queued, setQueued] = useState<QueuedPatient[]>([]);
  const [viewingDoc, setViewingDoc] = useState<ViewableDocument | null>(null);
  const [ambientVersion, setAmbientVersion] = useState(0);

  // Load whatever has been submitted so far. New intakes are appended
  // elsewhere (services/patientQueue.ts); this dashboard never generates
  // or replaces patients — it only reads and displays the queue.
  useEffect(() => {
    setQueued(loadQueuedPatients());
  }, []);

  const patients: DisplayPatient[] = useMemo(() => {
    // Seeded demo patients stay first (stable, familiar for judges), newest
    // real submissions are appended after — nothing is ever overwritten.
    return [...mockPatients.map(fromMock), ...queued.map(fromQueued)];
  }, [queued]);

  const waiting = patients.filter((p) => p.status !== "Reviewed").length;
  const completed = patients.length;
  const redFlags = patients.filter((p) => p.redFlag).length;

  const selected = patients.find((p) => p.id === selectedId) ?? null;
  const ambientNote = useMemo(
    () => (selected ? loadAmbientNote(selected.id) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected?.id, ambientVersion]
  );

  return (
    <div className="doctor-dashboard min-h-screen bg-paper">
      <header className="border-b border-line bg-paper-raised">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-4">
            {selected ? (
              <button
                onClick={() => setSelectedId(null)}
                className="touch-target flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"
                aria-label="Back to patient list"
              >
                <ChevronLeft size={18} />
              </button>
            ) : null}
            <Logo size="sm" />
          </div>
          <button
            onClick={() => navigate("/")}
            className="touch-target rounded-xl px-4 py-2 text-sm font-semibold text-sky-950 transition hover:bg-sky-100 active:scale-[0.98]"
          >
            Exit dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <h1 className="font-display text-2xl font-semibold text-ink">{t(lang, "doctorTitle")}</h1>

        {!selected ? (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={Users} label={t(lang, "statsWaiting")} value={String(waiting)} />
              <StatCard icon={ClipboardCheck} label={t(lang, "statsCompleted")} value={String(completed)} />
              <StatCard icon={AlertTriangle} label={t(lang, "statsRedFlags")} value={String(redFlags)} tone="danger" />
              <StatCard icon={Timer} label={t(lang, "statsAvgTime")} value="4.5 min" />
            </div>

            <div className="mt-8 space-y-3">
              {patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedId(p.id);
                    setActiveTab("summary");
                  }}
                  className="card flex w-full items-center justify-between gap-4 p-4 text-left text-slate-900 transition-all hover:border-sky-400 hover:shadow-md active:scale-[0.995]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 font-display text-base font-semibold text-teal-700">
                      {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <p className="font-medium text-ink">
                        {p.name} <span className="font-normal text-ink-faint">· {p.queueNumber}</span>
                        {p.isLive && (
                          <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-600">
                            New
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-ink-faint">
                        Age {p.age || "—"} · {p.pathway} · {p.status === "Reviewed" ? "Reviewed" : t(lang, "readyForReview")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      p.redFlag ? "bg-signal-redBg text-signal-red" : "bg-teal-50 text-teal-700"
                    }`}
                  >
                    {p.redFlag ? "RED FLAG" : "NORMAL"}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-6">
            <div className="card flex flex-wrap items-center justify-between gap-4 p-5 text-slate-900">
              <div>
                <p className="font-display text-xl font-semibold text-ink">
                  {selected.name} <span className="text-base font-normal text-ink-faint">· {selected.queueNumber}</span>
                </p>
                <p className="text-sm text-ink-faint">
                  Age {selected.age || "—"} · {selected.sex} · {selected.pathway}
                </p>
                {selected.abhaLinked && (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700">
                    ABHA linked · {selected.abhaId}
                  </span>
                )}
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  selected.redFlag ? "bg-signal-redBg text-signal-red" : "bg-teal-50 text-teal-700"
                }`}
              >
                {selected.redFlag ? "RED FLAG" : "NORMAL"}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`touch-target inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition-all active:scale-[0.97] ${
                    activeTab === key
                      ? "border-sky-700 bg-sky-700 text-white shadow-md"
                      : "border-slate-300 bg-white text-slate-800 hover:border-sky-400 hover:bg-sky-50"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-5">
              {activeTab === "summary" && (
                <MedicalSummary summary={selected.summary} note={t(lang, "aiSummaryNote")} />
              )}
              {activeTab === "timeline" && (
                <div className="card space-y-3 p-5">
                  {selected.timeline.map((item, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <span className="w-14 shrink-0 font-medium text-ink-faint">{item.time}</span>
                      <span className="text-ink">{item.event}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "symptoms" && (
                <div className="card p-5 text-[15px] text-slate-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Complaint</p>
                  <p className="mt-1">{selected.complaint}</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-faint">Symptoms</p>
                  <p className="mt-1">{selected.symptoms}</p>
                </div>
              )}
              {activeTab === "medications" && (
                <div className="card p-5 text-[15px] text-slate-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Medications</p>
                  <p className="mt-1">{selected.medications}</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-faint">Allergies</p>
                  <p className="mt-1">{selected.allergies}</p>
                </div>
              )}
              {activeTab === "notes" && (
                <div className="space-y-4">
                  <div className="card p-5 text-[15px] leading-relaxed text-slate-900">{selected.additionalNotes}</div>
                  {ambientNote && (
                    <div className="card p-5 text-slate-900">
                      <div className="flex items-center gap-2 text-teal-600">
                        <Radio size={15} />
                        <span className="text-xs font-semibold uppercase tracking-wide">
                          Ambient Listening summary (demo)
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink">
                        {ambientNote.summary}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === "documents" && (
                <div className="card p-5 text-slate-900">
                  {selected.documents.length === 0 ? (
                    <p className="text-sm text-ink-faint">No documents uploaded.</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {selected.documents.map((doc) => (
                        <li
                          key={doc.name}
                          className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-3"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <FileText size={16} className="shrink-0 text-teal-600" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ink">{doc.name}</p>
                              <p className="text-xs text-ink-faint">
                                {doc.type.startsWith("image/") ? "Image" : doc.type === "application/pdf" ? "PDF Document" : "Document"}
                                {doc.isSample ? ` · ${t(lang, "documentSampleOnly")}` : ""}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setViewingDoc(doc)}
                            className="touch-target flex shrink-0 items-center gap-1.5 rounded-xl border border-sky-200 bg-white px-3.5 py-2 text-xs font-semibold text-sky-800 transition hover:bg-sky-50 active:scale-[0.97]"
                          >
                            <Eye size={13} />
                            {t(lang, "documentView")}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {activeTab === "ambient" && (
                <AmbientListeningPanel
                  patientId={selected.id}
                  language={lang}
                  onSaved={() => setAmbientVersion((v) => v + 1)}
                />
              )}
              {activeTab === "ainotes" && (
                <div className="card p-5 text-[15px] leading-relaxed text-slate-900">{selected.aiNotes}</div>
              )}
            </div>
          </div>
        )}
      </main>

      <DocumentViewer
        document={viewingDoc}
        onClose={() => setViewingDoc(null)}
        closeLabel={t(lang, "documentClose")}
        sampleNote={t(lang, "documentSampleOnly")}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <div className="card p-4 text-slate-900">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          tone === "danger" ? "bg-signal-redBg text-signal-red" : "bg-teal-50 text-teal-600"
        }`}
      >
        <Icon size={17} />
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="text-xs text-ink-faint">{label}</p>
    </div>
  );
}
