"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  DraftingCompass,
  Flame,
  Loader2,
  MessageCircle,
  Pencil,
  Send,
  Star,
  ThumbsUp,
  X,
} from "lucide-react";
import JudgeShell from "@/components/JudgeShell";
import PreviewImageViewer from "@/components/PreviewImageViewer";
import RotatedContainImage from "@/components/RotatedContainImage";
import TranslatedComment from "@/components/judge/TranslatedComment";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocalizedDay4Entry } from "@/hooks/useLocalizedDay4Entry";
import {
  fetchDay4Lounge,
  updateDay4Lounge,
} from "@/lib/day4-lounge/client";
import {
  loadJudgeSession,
  type JudgeSession,
} from "@/lib/review-client";
import type {
  Day4LoungeAction,
  Day4LoungeEntry,
  Day4Note,
} from "@/types/day4-lounge";

const NOTE_STYLES = [
  "bg-amber-100/95 border-amber-200 rotate-[-0.6deg]",
  "bg-sky-100/95 border-sky-200 rotate-[0.5deg]",
  "bg-rose-100/95 border-rose-200 rotate-[-0.3deg]",
  "bg-emerald-100/95 border-emerald-200 rotate-[0.4deg]",
  "bg-violet-100/95 border-violet-200 rotate-[-0.5deg]",
  "bg-orange-100/95 border-orange-200 rotate-[0.3deg]",
];

const PINUP_HEADER_CONTROL =
  "inline-flex h-9 shrink-0 items-center rounded-full border border-slate-300 bg-white/80 text-xs leading-none text-slate-600 transition hover:bg-white";

function localeDateTag(locale: string): string {
  if (locale === "ja") return "ja-JP";
  if (locale === "en") return "en-US";
  return "zh-TW";
}

function StickyNote({
  note,
  index,
  currentJudgeId,
  layout = "grid",
  onOpen,
  onLike,
  busy,
}: {
  note: Day4Note;
  index: number;
  currentJudgeId: string;
  layout?: "sidebar" | "grid";
  onOpen: () => void;
  onLike: () => void;
  busy: boolean;
}) {
  const { t } = useLanguage();
  const hasContent = Boolean(note.content);
  const liked = note.likedBy.includes(currentJudgeId);
  const canLike =
    hasContent &&
    currentJudgeId !== "ADMIN" &&
    currentJudgeId !== note.judgeId;
  const isSidebar = layout === "sidebar";

  return (
    <article
      className={`relative flex flex-col rounded-sm border shadow-[0_8px_20px_rgba(51,65,85,0.12)] transition hover:-translate-y-0.5 hover:shadow-lg ${
        isSidebar ? "min-h-[11rem] flex-1 p-5" : "h-40 p-4"
      } ${
        hasContent
          ? NOTE_STYLES[index % NOTE_STYLES.length]
          : "border-dashed border-slate-300 bg-white/35 opacity-70"
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") onOpen();
        }}
        className="flex min-h-0 flex-1 flex-col text-left"
      >
        <div className="mb-2">
          <span
            className={`font-semibold tracking-wide text-slate-600 ${
              isSidebar ? "text-sm" : "text-xs"
            }`}
          >
            {note.judgeName}
          </span>
        </div>
        {hasContent ? (
          <TranslatedComment
            content={note.content}
            sourceLanguage={note.language}
            className={`line-clamp-4 leading-relaxed text-slate-700 ${
              isSidebar ? "text-lg" : "text-sm"
            }`}
          />
        ) : (
          <p
            className={`m-auto text-center leading-relaxed text-slate-400 ${
              isSidebar ? "text-sm" : "text-xs"
            }`}
          >
            {t("day4.waitingForReview", { name: note.judgeName })}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-2">
        <div
          className={`flex items-center gap-3 text-slate-500 ${
            isSidebar ? "text-xs" : "text-[11px]"
          }`}
        >
          <button
            type="button"
            disabled={!canLike || busy}
            onClick={onLike}
            className={`flex items-center gap-1 rounded-full px-2 py-1 transition ${
              liked
                ? "bg-white/70 text-sage-700"
                : "hover:bg-white/60"
            } disabled:cursor-default disabled:opacity-40`}
          >
            <ThumbsUp className={isSidebar ? "h-3.5 w-3.5" : "h-3 w-3"} />
            {note.likedBy.length}
          </button>
          <button
            type="button"
            onClick={onOpen}
            aria-label={t("day4.viewThread")}
            className="flex items-center gap-1 rounded-full px-2 py-1 transition hover:bg-white/60"
          >
            <MessageCircle className={isSidebar ? "h-3.5 w-3.5" : "h-3 w-3"} />
            {note.replies.length}
          </button>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className={`text-slate-500 hover:text-slate-700 ${
            isSidebar ? "text-xs" : "text-[10px]"
          }`}
        >
          {currentJudgeId === note.judgeId ? t("day4.editNote") : t("day4.viewThread")}
        </button>
      </div>
    </article>
  );
}

function ThreadDialog({
  note,
  entryId,
  session,
  busy,
  error,
  onClose,
  onAction,
}: {
  note: Day4Note;
  entryId: string;
  session: JudgeSession;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onAction: (payload: Day4LoungeAction) => Promise<void>;
}) {
  const { locale, t } = useLanguage();
  const [text, setText] = useState(
    session.judgeId === note.judgeId ? note.content : ""
  );
  const ownsNote = session.judgeId === note.judgeId;
  const canPost = session.judgeId !== "ADMIN";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim() || !canPost) return;
    await onAction(
      ownsNote
        ? {
            action: "save_note",
            judgeId: session.judgeId,
            entryId,
            content: text,
            language: locale,
          }
        : {
            action: "add_reply",
            judgeId: session.judgeId,
            entryId,
            noteJudgeId: note.judgeId,
            content: text,
            language: locale,
          }
    );
    if (!ownsNote) setText("");
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="day4-modal-in flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-[#f8f5ed] shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              {entryId}
            </p>
            <h3 className="mt-1 font-medium text-slate-800">
              {t("day4.threadTitle", { name: note.judgeName })}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-white hover:text-slate-700"
            aria-label={t("day4.closeThread")}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
          {note.content ? (
            <div className="rounded-xl bg-amber-100 p-4 shadow-sm">
              <TranslatedComment
                content={note.content}
                sourceLanguage={note.language}
                className="text-sm leading-relaxed text-slate-700"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-400">
              {t("day4.noCoreComment")}
            </div>
          )}
          {note.replies.map((reply) => (
            <div
              key={reply.id}
              className="ml-5 rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-medium text-slate-600">{reply.judgeName}</span>
                <time>{new Date(reply.createdAt).toLocaleString(localeDateTag(locale))}</time>
              </div>
              <TranslatedComment
                content={reply.content}
                sourceLanguage={reply.language}
                className="text-sm leading-relaxed text-slate-700"
              />
            </div>
          ))}
        </div>

        {canPost && (ownsNote || note.content) ? (
          <form onSubmit={submit} className="border-t border-slate-200 bg-white/70 p-4">
            <label className="mb-2 block text-xs font-medium text-slate-500">
              {ownsNote
                ? t("day4.updateCoreComment")
                : t("day4.replyTo", { name: note.judgeName })}
            </label>
            <div className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={3}
                maxLength={ownsNote ? 600 : 400}
                placeholder={
                  ownsNote ? t("day4.notePlaceholder") : t("day4.replyPlaceholder")
                }
                className="min-h-[5rem] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100"
              />
              <button
                type="submit"
                disabled={busy || !text.trim()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sage-600 text-white transition hover:bg-sage-700 disabled:opacity-40"
                aria-label={t("day4.submit")}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : ownsNote ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
          </form>
        ) : null}
      </div>
    </div>
  );
}

function PinupModal({
  entry,
  entries,
  currentIndex,
  session,
  busy,
  error,
  onClose,
  onNavigate,
  onAction,
}: {
  entry: Day4LoungeEntry;
  entries: Day4LoungeEntry[];
  currentIndex: number;
  session: JudgeSession;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onNavigate: (delta: number) => void;
  onAction: (payload: Day4LoungeAction) => Promise<void>;
}) {
  const { t } = useLanguage();
  const { workTitle, workConcept, translating } = useLocalizedDay4Entry(entry);
  const [threadJudgeId, setThreadJudgeId] = useState<string | null>(null);
  const leftNotes = entry.notes.slice(0, 3);
  const rightNotes = entry.notes.slice(3, 6);
  const threadNote = entry.notes.find((note) => note.judgeId === threadJudgeId);
  const isShortlisted = entry.shortlistedBy.includes(session.judgeId);
  const canNominate = session.judgeId !== "ADMIN";

  useEffect(() => {
    setThreadJudgeId(null);
  }, [entry.entryId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (threadJudgeId) setThreadJudgeId(null);
        else onClose();
        return;
      }
      if (threadJudgeId || entries.length <= 1) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onNavigate(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onNavigate(1);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, onNavigate, threadJudgeId, entries.length]);

  const renderNote = (note: Day4Note, index: number, layout: "sidebar" | "grid") => (
    <StickyNote
      key={note.judgeId}
      note={note}
      index={index}
      layout={layout}
      currentJudgeId={session.judgeId}
      busy={busy}
      onOpen={() => setThreadJudgeId(note.judgeId)}
      onLike={() =>
        void onAction({
          action: "toggle_like",
          judgeId: session.judgeId,
          entryId: entry.entryId,
          noteJudgeId: note.judgeId,
        })
      }
    />
  );

  return (
    <div className="day4-modal-in fixed inset-0 z-50 overflow-y-auto bg-[#e9e4d8]">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-300/70 bg-[#f7f4ec]/90 px-4 py-3 backdrop-blur md:px-7">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
            {t("day4.pinupLabel")}
          </p>
          <h2 className="font-mono text-sm font-semibold text-slate-700">
            {entry.entryId}
            {workTitle ? ` · ${workTitle}` : ""}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className={`${PINUP_HEADER_CONTROL} gap-0.5 px-1.5`}>
            <button
              type="button"
              onClick={() => onNavigate(-1)}
              disabled={entries.length <= 1}
              aria-label={t("day4.prevEntry")}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full disabled:cursor-default disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[3.25rem] px-1 text-center font-mono text-xs font-semibold tabular-nums">
              {t("day4.entryCounter", {
                current: currentIndex + 1,
                total: entries.length,
              })}
            </span>
            <button
              type="button"
              onClick={() => onNavigate(1)}
              disabled={entries.length <= 1}
              aria-label={t("day4.nextEntry")}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full disabled:cursor-default disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`${PINUP_HEADER_CONTROL} gap-2 px-4`}
          >
            <X className="h-4 w-4" />
            {t("day4.closePinup")}
          </button>
        </div>
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-65px)] max-w-[1800px] grid-cols-1 gap-5 p-4 md:p-6 xl:grid-cols-[18rem_minmax(0,1fr)_18rem] xl:items-stretch">
        <aside className="hidden min-h-0 flex-col justify-evenly gap-3 xl:flex xl:h-full">
          {leftNotes.map((note, index) => renderNote(note, index, "sidebar"))}
        </aside>

        <main key={entry.entryId} className="day4-pinup-switch mx-auto flex w-full max-w-5xl flex-col">
          {entry.imageUrl ? (
            <PreviewImageViewer
              src={entry.imageUrl}
              alt={workTitle}
              rotation={entry.displayRotation}
              className="w-full"
              viewportClassName="h-[52vh] min-h-[20rem] md:h-[60vh] xl:h-[min(72vh,calc(100vh-20rem))]"
              overlay={
                <div className="p-4 md:p-6">
                  <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/50">
                    {entry.entryId}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm font-medium text-white/90 md:text-base">
                    {workTitle}
                  </p>
                </div>
              }
              cornerOverlay={
                canNominate ? (
                  <button
                    type="button"
                    disabled={busy}
                    title={t("day4.shortlistHint")}
                    aria-pressed={isShortlisted}
                    onClick={(event) => {
                      event.stopPropagation();
                      void onAction({
                        action: "toggle_shortlist",
                        judgeId: session.judgeId,
                        entryId: entry.entryId,
                      });
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                    className={`pointer-events-auto absolute bottom-4 right-4 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur-md transition-all duration-200 disabled:opacity-50 ${
                      isShortlisted
                        ? "bg-amber-400/90 text-amber-950 ring-2 ring-amber-200/80"
                        : "bg-black/45 text-white/95 ring-1 ring-white/20 hover:bg-black/60"
                    }`}
                  >
                    <Star
                      className={`h-4 w-4 shrink-0 transition ${
                        isShortlisted
                          ? "fill-amber-300 text-amber-300"
                          : "text-white/90"
                      }`}
                    />
                    {isShortlisted ? t("day4.shortlistActive") : t("day4.markShortlist")}
                  </button>
                ) : null
              }
            />
          ) : (
            <div className="relative grid min-h-[52vh] place-items-center rounded-2xl bg-slate-950 text-sm text-slate-400 md:min-h-[60vh]">
              {t("day4.noImage")}
              {canNominate ? (
                <button
                  type="button"
                  disabled={busy}
                  title={t("day4.shortlistHint")}
                  aria-pressed={isShortlisted}
                  onClick={() =>
                    void onAction({
                      action: "toggle_shortlist",
                      judgeId: session.judgeId,
                      entryId: entry.entryId,
                    })
                  }
                  className={`absolute bottom-4 right-4 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur-md transition-all duration-200 disabled:opacity-50 ${
                    isShortlisted
                      ? "bg-amber-400/90 text-amber-950 ring-2 ring-amber-200/80"
                      : "bg-black/45 text-white/95 ring-1 ring-white/20 hover:bg-black/60"
                  }`}
                >
                  <Star
                    className={`h-4 w-4 shrink-0 ${
                      isShortlisted
                        ? "fill-amber-300 text-amber-300"
                        : "text-white/90"
                    }`}
                  />
                  {isShortlisted ? t("day4.shortlistActive") : t("day4.markShortlist")}
                </button>
              ) : null}
            </div>
          )}

          <section className="px-2 pb-2 pt-6 text-center md:px-8">
            {translating ? (
              <div className="mx-auto max-w-3xl space-y-3 py-2" aria-label={t("day4.translatingEntry")}>
                <div className="mx-auto h-7 w-2/3 animate-pulse rounded bg-slate-300/40" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-300/30" />
                <div className="h-4 w-11/12 animate-pulse rounded bg-slate-300/30" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-slate-300/30" />
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold tracking-tight text-slate-800">
                  {workTitle}
                </h3>
                <p className="mx-auto mt-4 max-w-3xl whitespace-pre-line text-left text-base leading-relaxed text-gray-700">
                  {workConcept}
                </p>
              </>
            )}
          </section>

          <section className="mt-3 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 shadow-sm">
            <DraftingCompass className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-amber-900">
                {t("day4.technicalAssessmentTitle")}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-amber-950/75">
                {t("day4.technicalAssessment")}
              </p>
            </div>
          </section>
        </main>

        <aside className="hidden min-h-0 flex-col justify-evenly gap-3 xl:flex xl:h-full">
          {rightNotes.map((note, index) => renderNote(note, index + 3, "sidebar"))}
        </aside>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:hidden">
          {entry.notes.map((note, index) => renderNote(note, index, "grid"))}
        </section>
      </div>

      {error && !threadNote ? (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-red-600 px-4 py-2 text-xs text-white shadow-lg">
          {error}
        </div>
      ) : null}

      {threadNote ? (
        <ThreadDialog
          note={threadNote}
          entryId={entry.entryId}
          session={session}
          busy={busy}
          error={error}
          onClose={() => setThreadJudgeId(null)}
          onAction={onAction}
        />
      ) : null}
    </div>
  );
}

export default function Day4LoungeClient() {
  const router = useRouter();
  const { t } = useLanguage();
  const [session, setSession] = useState<JudgeSession | null>(null);
  const [entries, setEntries] = useState<Day4LoungeEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.entryId === selectedEntryId) ?? null,
    [entries, selectedEntryId]
  );

  const selectedIndex = useMemo(
    () =>
      selectedEntryId
        ? entries.findIndex((entry) => entry.entryId === selectedEntryId)
        : -1,
    [entries, selectedEntryId]
  );

  const navigateEntry = useCallback(
    (delta: number) => {
      if (entries.length === 0) return;
      const baseIndex = selectedIndex >= 0 ? selectedIndex : 0;
      const nextIndex =
        (baseIndex + delta + entries.length) % entries.length;
      setSelectedEntryId(entries[nextIndex].entryId);
      setError(null);
    },
    [entries, selectedIndex]
  );

  const load = useCallback(async (judgeSession: JudgeSession) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDay4Lounge(judgeSession.judgeId);
      setEntries(result.entries ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : t("day4.loadFailed")
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const judgeSession = loadJudgeSession();
    if (!judgeSession) {
      router.replace("/judge");
      return;
    }
    setSession(judgeSession);
    void load(judgeSession);
  }, [load, router]);

  const handleAction = useCallback(async (payload: Day4LoungeAction) => {
    setBusy(true);
    setError(null);
    try {
      const result = await updateDay4Lounge(payload);
      setEntries(result.entries ?? []);
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : t("day4.updateFailed")
      );
    } finally {
      setBusy(false);
    }
  }, [t]);

  if (!session) return null;

  return (
    <JudgeShell showPhaseNav>
      <main className="min-h-full bg-[#eee9df] px-4 py-8 md:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 border-b border-slate-300 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sage-600">
                {t("day4.phaseBadge")}
              </p>
              <h1 className="mt-2 text-3xl font-light tracking-tight text-slate-800 md:text-4xl">
                {t("day4.title")}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {t("day4.subtitle")}
              </p>
            </div>
          </header>

          {loading ? (
            <div className="grid min-h-[45vh] place-items-center">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("day4.gridLoading")}
              </div>
            </div>
          ) : error && entries.length === 0 ? (
            <div className="grid min-h-[45vh] place-items-center text-center">
              <div>
                <p className="text-sm text-red-600">{error}</p>
                <button
                  type="button"
                  onClick={() => void load(session)}
                  className="mt-4 rounded-full bg-sage-600 px-5 py-2 text-sm text-white"
                >
                  {t("day4.reload")}
                </button>
              </div>
            </div>
          ) : (
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
              {entries.map((entry) => (
                <button
                  type="button"
                  key={entry.entryId}
                  onClick={() => setSelectedEntryId(entry.entryId)}
                  className="group relative aspect-[4/3] overflow-hidden border-[7px] border-white bg-slate-200 text-left shadow-[0_8px_24px_rgba(51,65,85,0.14)] transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {entry.imageUrl ? (
                    <RotatedContainImage
                      src={entry.imageUrl}
                      alt={entry.entryId}
                      rotation={entry.displayRotation}
                      layout="fill"
                      imgClassName="transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-slate-400">
                      {t("day4.noPreview")}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-slate-950/85 via-slate-950/55 to-transparent px-3 pb-2 pt-8 text-white">
                    <span className="font-mono text-xs font-semibold tracking-wide">
                      {entry.entryId}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-black/30 px-2 py-1 text-[10px] backdrop-blur">
                      <Flame className="h-3 w-3 text-orange-400" />
                      {entry.discussionCount}
                    </span>
                  </div>
                </button>
              ))}
            </section>
          )}
        </div>
      </main>

      {selectedEntry ? (
        <PinupModal
          entry={selectedEntry}
          entries={entries}
          currentIndex={selectedIndex}
          session={session}
          busy={busy}
          error={error}
          onClose={() => {
            setSelectedEntryId(null);
            setError(null);
          }}
          onNavigate={navigateEntry}
          onAction={handleAction}
        />
      ) : null}
    </JudgeShell>
  );
}
