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

export type SqlReview = { plain: string; fix: string };

export async function reviewSqlLab(input: {
  prompt: string;
  schema: string;
  expected: string;
  student: string;
  engine: string;
}): Promise<SqlReview | null> {
  const body = { ...input, key: readApiKey() };
  try {
    const res = await fetch("/api/sql-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = (await res.json()) as { item?: SqlReview | null };
      if (data.item?.plain) return data.item;
    }
  } catch {
    /* GitHub Pages 没有这个接口，改走直连 */
  }
  return fromBrowserSqlReview(body);
}

async function fromBrowserSqlReview(body: {
  key: string;
  prompt: string;
  schema: string;
  expected: string;
  student: string;
  engine: string;
}): Promise<SqlReview | null> {
  if (!body.key) return null;
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${body.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.3,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "你在改 SQL 作业。只输出 JSON。不要提问。" },
          {
            role: "user",
            content: `读者是商业基础弱的大四学生，在做 SQL 实验室。对照下面这题。

任务：${body.prompt}
表：${body.schema || "（见任务）"}
参考写法（这是本题标准答案，不要另起一套口径）：
${body.expected}

学生写的：
${body.student || "（空）"}

引擎核对：${body.engine || "未知"}

只输出 JSON：{"plain":"","fix":""}
要求：大白话；不要提问、不要布置作业、不要夸学生。
- 如果引擎说结果一致：plain 里说结果对了；写法若不同，用一两句点出差别；fix 留空。
- 如果报错或结果不对：plain 先说错在哪一步（筛选、连接、分组、去重、排序、日期还是口径），再对照参考写法；fix 用两三句说该怎么改，不要整段重抄参考 SQL。`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content || "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end < start) return null;
    const row = JSON.parse(text.slice(start, end + 1)) as { plain?: string; fix?: string };
    const plain = String(row.plain || "").trim();
    if (!plain) return null;
    return { plain, fix: String(row.fix || "").trim() };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}
