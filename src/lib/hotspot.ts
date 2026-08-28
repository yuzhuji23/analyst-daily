import { useCallback, useEffect, useState } from "react";
import { NEWS_FEEDS, briefFor, rankCandidates, scoreNews, toHotspot } from "../data/news";
import { newsDrill } from "../data/newsDrill";
import { todayIso } from "./progress";
import type { DailyHotspot, NewsCandidate } from "../types";

const CACHE = "analyst-daily-hotspot-v5";
const API_KEY = "analyst-deepseek-key";

function strip(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function withDrill(row: DailyHotspot): DailyHotspot {
  if (row.quiz?.length >= 3 && row.method) return row;
  const d = newsDrill(row.title, "");
  return {
    ...row,
    quiz: row.quiz?.length >= 3 ? row.quiz : d.quiz,
    method: row.method || d.method,
  };
}

function isHotspot(row: unknown): row is DailyHotspot {
  if (!row || typeof row !== "object") return false;
  const it = row as DailyHotspot;
  return (
    typeof it.date === "string" &&
    typeof it.title === "string" &&
    Array.isArray(it.sections) &&
    it.sections.some((s) => s?.title && Array.isArray(s.paras) && s.paras.length > 0)
  );
}

export function readHotspotCache(): DailyHotspot | null {
  try {
    const raw = localStorage.getItem(CACHE);
    if (!raw) return null;
    const row = JSON.parse(raw) as unknown;
    if (!isHotspot(row) || row.date !== todayIso()) return null;
    return withDrill(row);
  } catch {
    return null;
  }
}

export function clearHotspotCache() {
  localStorage.removeItem(CACHE);
}

export function readApiKey() {
  try {
    return localStorage.getItem(API_KEY) || "";
  } catch {
    return "";
  }
}

export function saveApiKey(key: string) {
  const next = key.trim();
  if (next) localStorage.setItem(API_KEY, next);
  else localStorage.removeItem(API_KEY);
  clearHotspotCache();
  void fetch("/api/hotspot-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: next }),
  }).catch(() => undefined);
}

export async function keyIsSaved() {
  if (readApiKey()) return true;
  try {
    const res = await fetch("/api/hotspot-key");
    if (!res.ok) return false;
    const data = (await res.json()) as { saved?: boolean };
    return Boolean(data.saved);
  } catch {
    return false;
  }
}

function writeCache(row: DailyHotspot) {
  localStorage.setItem(CACHE, JSON.stringify(row));
}

async function fromServer(): Promise<DailyHotspot | null> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 90000);
  try {
    const res = await fetch("/api/hotspot", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: readApiKey() }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { item?: unknown };
    return isHotspot(data.item) ? withDrill(data.item) : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

async function pullClientFeed(url: string, name: string): Promise<NewsCandidate[]> {
  const api = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(api, { signal: ctrl.signal });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      status?: string;
      items?: { title?: string; link?: string; pubDate?: string; description?: string }[];
    };
    if (data.status !== "ok" || !data.items?.length) return [];
    return data.items.slice(0, 20).map((it) => {
      const title = (it.title || "无标题").trim();
      const summary = strip(it.description || "").slice(0, 1200);
      return {
        title,
        source: name,
        url: it.link || "",
        published: it.pubDate || "",
        summary,
        score: scoreNews(title, summary),
      };
    });
  } catch {
    return [];
  } finally {
    window.clearTimeout(timer);
  }
}

async function fromClient(): Promise<DailyHotspot | null> {
  const batches = await Promise.all(NEWS_FEEDS.map((f) => pullClientFeed(f.url, f.name)));
  const ranked = rankCandidates(batches.flat());
  const row = ranked[0];
  if (!row) return null;
  return toHotspot(todayIso(), row, briefFor(row.title, row.summary));
}

export async function loadHotspot(): Promise<DailyHotspot | null> {
  const cached = readHotspotCache();
  if (cached) return cached;
  const item = (await fromServer()) ?? (await fromClient());
  if (item) writeCache(withDrill({ ...item, date: todayIso() }));
  return item;
}

export function useDailyHotspot() {
  const [item, setItem] = useState<DailyHotspot | null>(() => readHotspotCache());
  const [loading, setLoading] = useState(() => !readHotspotCache());

  const reload = useCallback(async () => {
    const cached = readHotspotCache();
    if (cached) {
      setItem(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    const row = await loadHotspot();
    setItem(row);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { item, loading };
}
