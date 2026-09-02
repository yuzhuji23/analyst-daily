import { useCallback, useEffect, useState } from "react";
import {
  NEWS_FEEDS,
  briefFor,
  drillPrompt,
  isCannedHotspot,
  isGroundedBrief,
  pickPrompt,
  rankCandidates,
  scoreNews,
  teachPrompt,
  toHotspot,
} from "../data/news";
import { newsDrill } from "../data/newsDrill";
import { todayIso } from "./progress";
import type { BriefSection, DailyHotspot, NewsCandidate, QuizQuestion } from "../types";

const CACHE = "analyst-daily-hotspot-v6";
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
    const item = withDrill(row);
    if (isCannedHotspot(item)) return null;
    return item;
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
    if (!isHotspot(data.item)) return null;
    const item = withDrill(data.item);
    if (isCannedHotspot(item)) return null;
    return item;
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

function parseJsonObject(text: string): Record<string, unknown> | null {
  const clipped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = clipped.indexOf("{");
  const end = clipped.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  try {
    return JSON.parse(clipped.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asSections(raw: unknown): BriefSection[] | null {
  if (!Array.isArray(raw)) return null;
  const sections: BriefSection[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as { title?: unknown; paras?: unknown };
    const title = String(row.title || "").trim();
    const paras = Array.isArray(row.paras)
      ? row.paras.map((s) => String(s).trim()).filter(Boolean)
      : [];
    if (title && paras.length) sections.push({ title, paras });
  }
  return sections.length >= 2 ? sections : null;
}

function asQuiz(raw: unknown): QuizQuestion[] | null {
  if (!Array.isArray(raw) || raw.length < 3) return null;
  const out: QuizQuestion[] = [];
  for (const [i, item] of raw.slice(0, 3).entries()) {
    if (!item || typeof item !== "object") return null;
    const row = item as { prompt?: unknown; options?: unknown; answer?: unknown; why?: unknown };
    const options = Array.isArray(row.options) ? row.options.map((s) => String(s).trim()).filter(Boolean) : [];
    const answer = Number(row.answer);
    const prompt = String(row.prompt || "").trim();
    const why = String(row.why || "").trim();
    if (!prompt || options.length < 2 || !Number.isInteger(answer) || answer < 0 || answer >= options.length) {
      return null;
    }
    out.push({ id: `hot-${i + 1}`, prompt, options, answer, why: why || "回头对照简报里的那一步。" });
  }
  return out;
}

async function chatBrowser(
  key: string,
  user: string,
  maxTokens: number,
  system: string,
): Promise<Record<string, unknown> | null> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.3,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return parseJsonObject(data.choices?.[0]?.message?.content || "");
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

async function fromClientPool(): Promise<NewsCandidate[]> {
  const batches = await Promise.all(NEWS_FEEDS.map((f) => pullClientFeed(f.url, f.name)));
  return rankCandidates(batches.flat()).slice(0, 12);
}

async function fromBrowserHotspot(key: string): Promise<DailyHotspot | null> {
  const pool = await fromClientPool();
  if (!pool.length) return null;
  const catalog = pool
    .map((row, i) => `${i}. 【${row.source}】${row.title}\n${(row.summary || "").slice(0, 180)}`)
    .join("\n\n");
  const picked = await chatBrowser(
    key,
    pickPrompt(catalog),
    80,
    "你在挑今天最值得拆的一条互联网新闻。只输出 JSON。",
  );
  const index = Math.max(0, Math.min(Number(picked?.index) || 0, pool.length - 1));
  const row = pool[index];
  if (!row) return null;

  const teach = async (extra?: string) => {
    const taught = await chatBrowser(
      key,
      teachPrompt(row, extra),
      2800,
      "你在写今天这一条新闻的讲解，只讲这篇，禁止套话讲义。只输出 JSON。",
    );
    const sections = asSections(taught?.sections);
    if (!sections || !isGroundedBrief(sections, row.title, row.summary)) return null;
    return sections;
  };

  const sections =
    (await teach()) ||
    (await teach("上一稿写成了套话或没点这篇的公司/数字。重写。每一段都必须出现标题里的公司或数字。"));
  if (!sections) return null;

  const drilled = await chatBrowser(
    key,
    drillPrompt(row),
    1400,
    "你在根据这篇新闻出题。只输出 JSON。",
  );
  const quiz = asQuiz(drilled?.quiz);
  const method = String(drilled?.method || "").trim();
  return toHotspot(todayIso(), row, sections, {
    quiz: quiz ?? newsDrill(row.title, row.summary).quiz,
    method: method || newsDrill(row.title, row.summary).method,
  });
}

async function fromClient(): Promise<DailyHotspot | null> {
  const pool = await fromClientPool();
  const row = pool[0];
  if (!row) return null;
  return toHotspot(todayIso(), row, briefFor(row.title, row.summary));
}

export async function loadHotspot(): Promise<DailyHotspot | null> {
  const cached = readHotspotCache();
  if (cached) return cached;
  const server = await fromServer();
  if (server?.usedAi) {
    writeCache(withDrill({ ...server, date: todayIso() }));
    return server;
  }
  const key = readApiKey();
  if (key) {
    const ai = await fromBrowserHotspot(key);
    if (ai) {
      const row = withDrill({ ...ai, date: todayIso(), usedAi: true });
      writeCache(row);
      return row;
    }
  }
  const item = server ?? (await fromClient());
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

export type NewsAskTurn = { role: "user" | "assistant"; text: string };

export async function askNews(input: {
  question: string;
  title: string;
  source: string;
  brief: string;
  history: NewsAskTurn[];
}): Promise<string | null> {
  const body = { ...input, key: readApiKey() };
  try {
    const res = await fetch("/api/news-ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = (await res.json()) as { item?: { reply?: string } | null };
      const reply = String(data.item?.reply || "").trim();
      if (reply) return reply;
    }
  } catch {
    /* GitHub Pages 没有这个接口，改走直连 */
  }
  return fromBrowserNewsAsk(body);
}

function newsAskPrompt(body: {
  question: string;
  title: string;
  source: string;
  brief: string;
  history: NewsAskTurn[];
}) {
  const prior = body.history
    .slice(-6)
    .map((m) => `${m.role === "assistant" ? "学长" : "学生"}：${m.text}`)
    .join("\n");
  return `读者是商业基础很弱的大四学生，在读今天这篇互联网新闻简报，有一句看不懂。请用大白话直接回答。

今天这篇：
标题：${body.title || "（还没有标题）"}
来源：${body.source || "（未知）"}
简报摘录：${body.brief || "（摘要很少，按标题能确定的内容答，不确定就标明是推断）"}

${prior ? `刚才的对话：\n${prior}\n` : ""}学生现在问：${body.question}

只输出 JSON：{"reply":""}
要求：两三到五段人话；术语第一次出现用括号带一句；不要编造没有的数字；不要布置作业、不要反问一串问题；紧扣这篇，不要空泛框架。`;
}

async function fromBrowserNewsAsk(body: {
  key: string;
  question: string;
  title: string;
  source: string;
  brief: string;
  history: NewsAskTurn[];
}): Promise<string | null> {
  if (!body.key || !body.question.trim()) return null;
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
        max_tokens: 800,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "你在带人看这篇新闻。只输出 JSON。不要提问。" },
          { role: "user", content: newsAskPrompt(body) },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content || "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end < start) return null;
    const row = JSON.parse(text.slice(start, end + 1)) as { reply?: string };
    const reply = String(row.reply || "").trim();
    return reply || null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}
