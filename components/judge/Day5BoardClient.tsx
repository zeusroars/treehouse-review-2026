"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Loader2, Star } from "lucide-react";
import JudgeShell from "@/components/JudgeShell";
import RotatedContainImage from "@/components/RotatedContainImage";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchDay5Board } from "@/lib/day5-board/client";
import {
  isAdminSession,
  loadJudgeSession,
  type JudgeSession,
} from "@/lib/review-client";
import {
  DAY5_COLUMN_LIMITS,
  emptyDay5Columns,
  type Day5BoardEntry,
  type Day5ColumnId,
  type Day5ColumnState,
} from "@/types/day5-board";

const COLUMN_IDS: Day5ColumnId[] = ["pool", "top4", "honorable", "eliminated"];
const COLUMNS_STORAGE_KEY = "day5-board-columns";
const RUNDOWN_STORAGE_KEY = "day5-board-rundown";

const RUNDOWN_STEP_KEYS = [
  "step1",
  "step2",
  "step3",
  "step4",
  "step5",
] as const;

function findColumnForEntry(
  columns: Day5ColumnState,
  entryId: string
): Day5ColumnId | null {
  for (const columnId of COLUMN_IDS) {
    if (columns[columnId].includes(entryId)) return columnId;
  }
  return null;
}

function resolveDropColumn(
  columns: Day5ColumnState,
  overId: string
): Day5ColumnId | null {
  if (COLUMN_IDS.includes(overId as Day5ColumnId)) {
    return overId as Day5ColumnId;
  }
  return findColumnForEntry(columns, overId);
}

function loadSavedColumns(entryIds: string[]): Day5ColumnState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COLUMNS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Day5ColumnState;
    const valid = new Set(entryIds);
    const merged = emptyDay5Columns();
    const seen = new Set<string>();

    for (const columnId of COLUMN_IDS) {
      merged[columnId] = (parsed[columnId] ?? []).filter((id) => {
        if (!valid.has(id) || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }

    for (const id of entryIds) {
      if (!seen.has(id)) {
        merged.pool.push(id);
        seen.add(id);
      }
    }

    return merged;
  } catch {
    return null;
  }
}

function initialColumns(entryIds: string[]): Day5ColumnState {
  return loadSavedColumns(entryIds) ?? {
    ...emptyDay5Columns(),
    pool: [...entryIds],
  };
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 ring-1 ring-amber-400/30">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="text-xs font-bold tabular-nums text-amber-200">
        {count}
      </span>
    </div>
  );
}

function EntryCardContent({
  entry,
  dragging = false,
}: {
  entry: Day5BoardEntry;
  dragging?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-slate-800 shadow-lg ring-1 transition ${
        dragging
          ? "border-amber-400/60 ring-amber-400/40 shadow-amber-900/30"
          : "border-slate-600/80 ring-white/5 hover:border-slate-500 hover:ring-white/10"
      }`}
    >
      <div className="relative aspect-[4/3] bg-slate-950">
        {entry.imageUrl ? (
          <RotatedContainImage
            src={entry.imageUrl}
            alt={entry.entryId}
            rotation={entry.displayRotation}
            layout="fill"
            imgClassName="transition duration-300"
          />
        ) : (
          <div className="grid h-full place-items-center text-xs text-slate-500">
            {t("day5.noPreview")}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-semibold text-slate-100">
            {entry.entryId}
          </p>
          {entry.workTitle ? (
            <p className="truncate text-[10px] text-slate-400">{entry.workTitle}</p>
          ) : null}
        </div>
        <StarRating count={entry.starCount} />
      </div>
    </div>
  );
}

function DraggableEntryCard({ entry }: { entry: Day5BoardEntry }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: entry.entryId });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative touch-none ${isDragging ? "z-10 opacity-40" : ""}`}
    >
      <button
        type="button"
        className="absolute left-1.5 top-1.5 z-10 grid h-7 w-7 place-items-center rounded-lg bg-slate-950/70 text-slate-300 backdrop-blur-sm transition hover:bg-slate-900 hover:text-white"
        aria-label="Drag"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <EntryCardContent entry={entry} />
    </div>
  );
}

function KanbanColumn({
  columnId,
  entryIds,
  entriesById,
  atCapacity,
}: {
  columnId: Day5ColumnId;
  entryIds: string[];
  entriesById: Map<string, Day5BoardEntry>;
  atCapacity: boolean;
}) {
  const { t } = useLanguage();
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  const limit = DAY5_COLUMN_LIMITS[columnId].max;
  const emoji = DAY5_COLUMN_LIMITS[columnId].emoji;

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <header className="mb-3 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-100">
            {emoji ? `${emoji} ` : ""}
            {t(`day5.columns.${columnId}`)}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums ${
              atCapacity
                ? "bg-amber-500/20 text-amber-200"
                : "bg-slate-700 text-slate-300"
            }`}
          >
            {entryIds.length}
            {limit != null ? ` / ${limit}` : ""}
          </span>
        </div>
        {columnId === "top4" ? (
          <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
            {t("day5.top4Note")}
          </p>
        ) : null}
      </header>

      <div
        ref={setNodeRef}
        className={`min-h-[12rem] flex-1 space-y-3 overflow-y-auto rounded-xl border-2 border-dashed p-3 transition-colors ${
          isOver
            ? "border-amber-400/50 bg-amber-400/5"
            : atCapacity
              ? "border-red-500/30 bg-red-950/20"
              : "border-slate-700/80 bg-slate-900/40"
        }`}
      >
        {entryIds.map((entryId) => {
          const entry = entriesById.get(entryId);
          if (!entry) return null;
          return <DraggableEntryCard key={entryId} entry={entry} />;
        })}
        {entryIds.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-600">
            {t("day5.dropHere")}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function RunDownSidebar({
  checkedSteps,
  onToggleStep,
}: {
  checkedSteps: boolean[];
  onToggleStep: (index: number) => void;
}) {
  const { t } = useLanguage();

  return (
    <aside className="flex w-80 shrink-0 flex-col border-r border-slate-700/80 bg-slate-900/80">
      <div className="border-b border-slate-700/80 px-5 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-400/80">
          {t("day5.boardLabel")}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-100">
          {t("day5.runDownTitle")}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          {t("day5.runDownSubtitle")}
        </p>
      </div>

      <ol className="flex-1 space-y-0 overflow-y-auto px-5 py-5">
        {RUNDOWN_STEP_KEYS.map((stepKey, index) => {
          const done = checkedSteps[index];
          const isLast = index === RUNDOWN_STEP_KEYS.length - 1;

          return (
            <li key={stepKey} className="relative flex gap-3 pb-8">
              {!isLast ? (
                <span
                  className={`absolute left-[11px] top-7 h-[calc(100%-12px)] w-px ${
                    done ? "bg-amber-400/50" : "bg-slate-700"
                  }`}
                  aria-hidden
                />
              ) : null}

              <div className="relative z-10 mt-0.5 shrink-0">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full border-2 text-[10px] font-bold ${
                    done
                      ? "border-amber-400 bg-amber-400 text-slate-950"
                      : "border-slate-600 bg-slate-800 text-slate-400"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] font-semibold text-amber-300/90">
                  {t(`day5.runDown.${stepKey}.time`)}
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-100">
                  {t(`day5.runDown.${stepKey}.title`)}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                  {t(`day5.runDown.${stepKey}.desc`)}
                </p>
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => onToggleStep(index)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-amber-400 focus:ring-amber-400/30"
                  />
                  {t("day5.markComplete")}
                </label>
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

export default function Day5BoardClient() {
  const router = useRouter();
  const { t } = useLanguage();
  const [session, setSession] = useState<JudgeSession | null>(null);
  const [entries, setEntries] = useState<Day5BoardEntry[]>([]);
  const [columns, setColumns] = useState<Day5ColumnState>(emptyDay5Columns());
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>(
    RUNDOWN_STEP_KEYS.map(() => false)
  );
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  const entriesById = useMemo(
    () => new Map(entries.map((entry) => [entry.entryId, entry])),
    [entries]
  );

  const load = useCallback(async (judgeSession: JudgeSession) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDay5Board(judgeSession.judgeId);
      const list = result.entries ?? [];
      setEntries(list);
      setColumns(initialColumns(list.map((entry) => entry.entryId)));
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : t("day5.loadFailed")
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
    if (!isAdminSession(judgeSession)) {
      router.replace("/judge/dashboard");
      return;
    }
    setSession(judgeSession);
    void load(judgeSession);
  }, [load, router]);

  useEffect(() => {
    if (entries.length === 0) return;
    localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(columns));
  }, [columns, entries.length]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RUNDOWN_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as boolean[];
      if (Array.isArray(parsed) && parsed.length === RUNDOWN_STEP_KEYS.length) {
        setCheckedSteps(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(RUNDOWN_STORAGE_KEY, JSON.stringify(checkedSteps));
  }, [checkedSteps]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveEntryId(String(event.active.id));
    setLimitWarning(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEntryId(null);
    if (!over) return;

    const entryId = String(active.id);
    const sourceColumn = findColumnForEntry(columns, entryId);
    const targetColumn = resolveDropColumn(columns, String(over.id));

    if (!sourceColumn || !targetColumn || sourceColumn === targetColumn) return;

    const limit = DAY5_COLUMN_LIMITS[targetColumn].max;
    if (limit != null && columns[targetColumn].length >= limit) {
      setLimitWarning(t("day5.columnFull", { column: t(`day5.columns.${targetColumn}`) }));
      return;
    }

    setColumns((current) => {
      const next: Day5ColumnState = {
        pool: [...current.pool],
        top4: [...current.top4],
        honorable: [...current.honorable],
        eliminated: [...current.eliminated],
      };
      next[sourceColumn] = next[sourceColumn].filter((id) => id !== entryId);
      next[targetColumn] = [...next[targetColumn], entryId];
      return next;
    });
  };

  const toggleStep = (index: number) => {
    setCheckedSteps((current) =>
      current.map((value, i) => (i === index ? !value : value))
    );
  };

  const activeEntry = activeEntryId ? entriesById.get(activeEntryId) : null;

  if (!session) return null;

  return (
    <JudgeShell fill showPhaseNav>
      <div className="flex min-h-0 flex-1 bg-slate-950 text-slate-100">
        <RunDownSidebar checkedSteps={checkedSteps} onToggleStep={toggleStep} />

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="shrink-0 border-b border-slate-800 px-6 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {t("day5.boardLabel")}
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-50">
              {t("day5.title")}
            </h1>
            <p className="mt-1 text-sm text-slate-400">{t("day5.subtitle")}</p>
          </header>

          {loading ? (
            <div className="grid flex-1 place-items-center">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("day5.loading")}
              </div>
            </div>
          ) : error ? (
            <div className="grid flex-1 place-items-center text-center">
              <div>
                <p className="text-sm text-red-400">{error}</p>
                <button
                  type="button"
                  onClick={() => void load(session)}
                  className="mt-4 rounded-full bg-amber-500 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400"
                >
                  {t("day5.reload")}
                </button>
              </div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex min-h-0 flex-1 flex-col px-4 py-4 md:px-6">
                {limitWarning ? (
                  <p className="mb-3 shrink-0 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
                    {limitWarning}
                  </p>
                ) : null}

                <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
                  {COLUMN_IDS.map((columnId) => {
                    const limit = DAY5_COLUMN_LIMITS[columnId].max;
                    const count = columns[columnId].length;
                    return (
                      <KanbanColumn
                        key={columnId}
                        columnId={columnId}
                        entryIds={columns[columnId]}
                        entriesById={entriesById}
                        atCapacity={limit != null && count >= limit}
                      />
                    );
                  })}
                </div>
              </div>

              <DragOverlay dropAnimation={null}>
                {activeEntry ? (
                  <div className="w-56 rotate-1 scale-105 cursor-grabbing">
                    <EntryCardContent entry={activeEntry} dragging />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </main>
      </div>
    </JudgeShell>
  );
}
