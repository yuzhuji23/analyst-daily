import type { ProgressFile } from "../types";

const KEY = "analyst-daily-progress-v1";

export function todayIso(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function emptyToday(date: string): ProgressFile["today"] {
  return { date, news: false, case: false, sql: "pending", lab: false };
}

function normalize(p: ProgressFile): ProgressFile {
  return {
    ...p,
    completed: p.completed ?? [],
    quiz: p.quiz ?? {},
    deferredLabs: p.deferredLabs ?? [],
    completedLabs: p.completedLabs ?? [],
    newsReadDates: p.newsReadDates ?? [],
    casesDone: p.casesDone ?? [],
    today: {
      date: p.today?.date ?? todayIso(),
      news: Boolean(p.today?.news),
      case: Boolean(p.today?.case),
      sql: p.today?.sql ?? "pending",
      lab: Boolean(p.today?.lab),
    },
  };
}

export function emptyProgress(): ProgressFile {
  const date = todayIso();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    completed: [],
    quiz: {},
    deferredLabs: [],
    completedLabs: [],
    newsReadDates: [],
    casesDone: [],
    lastVisit: date,
    streak: 0,
    today: emptyToday(date),
  };
}

function rollDay(p: ProgressFile): ProgressFile {
  const today = todayIso();
  if (p.today.date === today) return p;
  const yest = todayIso(new Date(Date.now() - 86400000));
  const hadWork =
    p.today.news || p.today.case || p.today.lab || p.today.sql === "done" || p.today.sql === "deferred";
  let streak = p.streak;
  if (p.today.date === yest && hadWork) streak += 1;
  else if (p.lastVisit !== today) streak = hadWork && p.today.date === yest ? streak + 1 : 0;
  return { ...p, lastVisit: today, streak, today: emptyToday(today) };
}

export function loadProgress(): ProgressFile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as ProgressFile;
    if (parsed.version !== 1) return emptyProgress();
    return rollDay(normalize(parsed));
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p: ProgressFile): void {
  const next = { ...p, exportedAt: new Date().toISOString(), lastVisit: todayIso() };
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function exportJson(p: ProgressFile): string {
  return JSON.stringify({ ...p, version: 1, exportedAt: new Date().toISOString() }, null, 2);
}

type Compact = {
  v: 1;
  c: string[];
  q: ProgressFile["quiz"];
  d: string[];
  l: string[];
  n: string[];
  k: string[];
  s: number;
  t: ProgressFile["today"];
};

export function toToken(p: ProgressFile): string {
  const compact: Compact = {
    v: 1,
    c: p.completed,
    q: p.quiz,
    d: p.deferredLabs,
    l: p.completedLabs,
    n: p.newsReadDates.slice(-40),
    k: p.casesDone,
    s: p.streak,
    t: p.today,
  };
  const json = JSON.stringify(compact);
  return "AD1." + bytesToB64(new TextEncoder().encode(json));
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin);
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function fromToken(token: string): ProgressFile {
  const trimmed = token.trim();
  if (trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed) as ProgressFile;
    if (parsed.version !== 1) throw new Error("进度文件版本不支持");
    return rollDay(normalize(parsed));
  }
  if (!trimmed.startsWith("AD1.")) throw new Error("不是分析日课的进度口令");
  const json = new TextDecoder().decode(b64ToBytes(trimmed.slice(4)));
  const c = JSON.parse(json) as Compact;
  return rollDay(normalize({
    version: 1,
    exportedAt: new Date().toISOString(),
    completed: c.c ?? [],
    quiz: c.q ?? {},
    deferredLabs: c.d ?? [],
    completedLabs: c.l ?? [],
    newsReadDates: c.n ?? [],
    casesDone: c.k ?? [],
    lastVisit: todayIso(),
    streak: c.s ?? 0,
    today: c.t ?? emptyToday(todayIso()),
  }));
}

export function mergeProgress(current: ProgressFile, incoming: ProgressFile): ProgressFile {
  const quiz = { ...current.quiz, ...incoming.quiz };
  const union = (a: string[], b: string[]) => Array.from(new Set([...a, ...b]));
  const rolled = rollDay(incoming);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    completed: union(current.completed, incoming.completed),
    quiz,
    deferredLabs: union(current.deferredLabs, incoming.deferredLabs).filter(
      (id) => !union(current.completedLabs, incoming.completedLabs).includes(id),
    ),
    completedLabs: union(current.completedLabs, incoming.completedLabs),
    newsReadDates: union(current.newsReadDates, incoming.newsReadDates),
    casesDone: union(current.casesDone, incoming.casesDone),
    lastVisit: todayIso(),
    streak: Math.max(current.streak, incoming.streak),
    today: {
      date: todayIso(),
      news: current.today.news || rolled.today.news,
      case: current.today.case || rolled.today.case,
      lab: Boolean(current.today.lab || rolled.today.lab),
      sql:
        current.today.sql === "done" || rolled.today.sql === "done"
          ? "done"
          : current.today.sql === "deferred" || rolled.today.sql === "deferred"
            ? "deferred"
            : "pending",
    },
  };
}
