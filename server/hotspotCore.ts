import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve } from "node:path";
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
} from "../src/data/news";
import { newsDrill } from "../src/data/newsDrill";
import type { BriefSection, DailyHotspot, NewsCandidate, QuizQuestion } from "../src/types";

type Cache = { date: string; item: DailyHotspot | null; usedAi: boolean; triedAt: number };
let cache: Cache | null = null;
let inflight: Promise<DailyHotspot | null> | null = null;

function todayShanghai() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
}

function strip(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function tag(block: string, name: string) {
  const cdata = block.match(new RegExp(`<${name}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]>`));
  if (cdata?.[1]) return cdata[1].trim();
  const plain = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return plain?.[1] ? strip(plain[1]) : "";
}

function parseFeed(xml: string, source: string): NewsCandidate[] {
  const blocks = [...xml.matchAll(/<(item|entry)[\s\S]*?<\/\1>/gi)].map((m) => m[0]);
  return blocks.slice(0, 20).map((block) => {
    const title = tag(block, "title") || "无标题";
    const href = block.match(/<link[^>]*href=["']([^"']+)["']/)?.[1];
    const url = href || tag(block, "link") || tag(block, "guid") || "";
    const rawTime = tag(block, "pubDate") || tag(block, "updated") || tag(block, "published");
    const summary = strip(tag(block, "description") || tag(block, "summary") || tag(block, "content")).slice(0, 1200);
    return {
      title,
      source,
      url,
      published: rawTime,
      summary,
      score: scoreNews(title, summary),
    };
  });
}

async function getText(url: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "Mozilla/5.0 AnalystDaily/1.0" },
    });
    if (!res.ok) throw new Error(String(res.status));
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function pullFeed(url: string, name: string): Promise<NewsCandidate[]> {
  try {
    const xml = await getText(url);
    const rows = parseFeed(xml, name);
    if (rows.length) return rows;
  } catch {
    /* try json proxy */
  }
  try {
    const raw = await getText(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
    const data = JSON.parse(raw) as {
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

function hasDrill(item: DailyHotspot | null) {
  return Boolean(item && item.quiz?.length >= 3 && item.method);
}

async function chat(key: string, user: string, maxTokens: number, system?: string) {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.35,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            system ||
            "你是带大四学生看今天这一条互联网新闻的学长。只讲这篇里的公司、动作和数字。只用大白话。只输出 JSON。禁止套话讲义。不要提问，不要布置作业。",
        },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return parseJsonObject(data.choices?.[0]?.message?.content || "");
}

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function articleBody(url: string): Promise<string> {
  if (!url) return "";
  try {
    const html = await getText(url);
    const text = htmlToText(html);
    if (text.length < 80) return "";
    return text.slice(0, 2800);
  } catch {
    return "";
  }
}

async function teachOnce(key: string, row: NewsCandidate, extra?: string) {
  const taught = await chat(key, teachPrompt(row, extra), 2800);
  const sections = asSections(taught?.sections);
  if (!sections || !isGroundedBrief(sections, row.title, row.summary)) return null;
  return sections;
}

async function askDeepseek(key: string, pool: NewsCandidate[]) {
  const catalog = pool
    .map((row, i) => `${i}. 【${row.source}】${row.title}\n${(row.summary || "").slice(0, 180)}`)
    .join("\n\n");
  const picked = await chat(key, pickPrompt(catalog), 80);
  const index = Math.max(0, Math.min(Number(picked?.index) || 0, pool.length - 1));
  const row = pool[index];
  if (!row) return null;

  const body = await articleBody(row.url);
  const source = {
    ...row,
    summary: body
      ? `${row.summary || ""}\n${body}`.replace(/\s+/g, " ").trim().slice(0, 3200)
      : row.summary,
  };

  const sections =
    (await teachOnce(key, source)) ||
    (await teachOnce(
      key,
      source,
      "上一稿写成了套话或没点这篇的公司/数字。重写。每一段都必须出现标题里的公司或数字，禁止讲义腔。",
    ));
  if (!sections) return null;

  const drilled = await chat(key, drillPrompt(source), 1400);
  const quiz = asQuiz(drilled?.quiz);
  const method = String(drilled?.method || "").trim();
  const fallback = newsDrill(source.title, source.summary);
  return toHotspot(todayShanghai(), source, sections, {
    quiz: quiz ?? fallback.quiz,
    method: method || fallback.method,
  });
}

async function buildHotspot(apiKey: string): Promise<{ item: DailyHotspot | null; usedAi: boolean }> {
  const batches = await Promise.all(NEWS_FEEDS.map((f) => pullFeed(f.url, f.name)));
  const ranked = rankCandidates(batches.flat());
  if (!ranked.length) return { item: null, usedAi: false };
  const pool = ranked.slice(0, 12);
  if (apiKey) {
    try {
      const ai = await askDeepseek(apiKey, pool);
      if (ai) return { item: { ...ai, usedAi: true }, usedAi: true };
    } catch {
      /* fall through */
    }
  }
  const row = pool[0];
  return {
    item: { ...toHotspot(todayShanghai(), row, briefFor(row.title, row.summary)), usedAi: false },
    usedAi: false,
  };
}

async function dailyHotspot(apiKey: string) {
  const date = todayShanghai();
  const fresh =
    cache?.date === date &&
    hasDrill(cache.item) &&
    cache.item &&
    !isCannedHotspot(cache.item);
  const aiReady = cache?.usedAi || !apiKey;
  const cooldown = cache && Date.now() - cache.triedAt < 15 * 60 * 1000;
  if (fresh && (aiReady || cooldown)) return cache.item;
  if (!inflight) {
    inflight = buildHotspot(apiKey)
      .then((row) => {
        cache = { date, item: row.item, usedAi: row.usedAi, triedAt: Date.now() };
        return row.item;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolveBody, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > 24000) {
        reject(new Error("too large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const ENV_FILE = resolve(process.cwd(), ".env");

function persistEnvKey(key: string) {
  if (process.env.VERCEL) return;
  let text = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8") : "";
  if (!key) {
    text = text.replace(/^DEEPSEEK_API_KEY=.*\n?/m, "");
  } else if (/^DEEPSEEK_API_KEY=/m.test(text)) {
    text = text.replace(/^DEEPSEEK_API_KEY=.*$/m, `DEEPSEEK_API_KEY=${key}`);
  } else {
    text = `${text.replace(/\s*$/, "")}\nDEEPSEEK_API_KEY=${key}\n`.replace(/^\n/, "");
  }
  writeFileSync(ENV_FILE, text, "utf8");
}

async function handleHotspot(req: IncomingMessage, res: ServerResponse, state: { key: string }) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "GET" && req.method !== "POST") {
    send(res, 405, { item: null });
    return;
  }
  let extra = "";
  if (req.method === "POST") {
    try {
      const raw = await readBody(req);
      const body = raw ? (JSON.parse(raw) as { key?: string }) : {};
      extra = typeof body.key === "string" ? body.key.trim() : "";
    } catch {
      extra = "";
    }
  }
  try {
    const item = await dailyHotspot(extra || state.key);
    send(res, 200, { item });
  } catch (err) {
    console.error("[hotspot]", err);
    send(res, 200, { item: null });
  }
}

async function handleKey(req: IncomingMessage, res: ServerResponse, state: { key: string }) {
  if (req.method === "GET") {
    send(res, 200, { saved: Boolean(state.key) });
    return;
  }
  if (req.method !== "POST") {
    send(res, 405, { saved: Boolean(state.key) });
    return;
  }
  try {
    const raw = await readBody(req);
    const body = raw ? (JSON.parse(raw) as { key?: string }) : {};
    const next = typeof body.key === "string" ? body.key.trim() : "";
    persistEnvKey(next);
    state.key = next;
    send(res, 200, { saved: Boolean(next) });
  } catch {
    send(res, 200, { saved: Boolean(state.key) });
  }
}

async function handleTerm(req: IncomingMessage, res: ServerResponse, state: { key: string }) {
  if (req.method !== "POST") {
    send(res, 405, { item: null });
    return;
  }
  let term = "";
  let extra = "";
  try {
    const raw = await readBody(req);
    const body = raw ? (JSON.parse(raw) as { term?: string; key?: string }) : {};
    term = typeof body.term === "string" ? body.term.trim().slice(0, 40) : "";
    extra = typeof body.key === "string" ? body.key.trim() : "";
  } catch {
    send(res, 200, { item: null });
    return;
  }
  const apiKey = extra || state.key;
  if (!term || !apiKey) {
    send(res, 200, { item: null });
    return;
  }
  const cacheKey = term.toLowerCase();
  const cached = termMemo.get(cacheKey);
  if (cached) {
    send(res, 200, { item: cached });
    return;
  }
  try {
    const row = await chat(
      apiKey,
      `解释互联网商业或数据分析里的这个词：「${term}」。读者是商业基础很弱的大学生。

只输出 JSON：{"term":"常用叫法","plain":"两三句人话是什么意思","example":"一个生活里的比方","watch":"分析时最容易搞错的一点"}

要求：大白话；英文缩写先写中文再括英文；不要列表、不要提问、不要编造公司数据。如果根本不是这类词，plain 里如实说不像业务术语。`,
      400,
      "你在给人话词典。只输出 JSON。不要提问。",
    );
    const item = {
      term: String(row?.term || term).trim() || term,
      plain: String(row?.plain || "").trim(),
      example: String(row?.example || "").trim(),
      watch: String(row?.watch || "").trim(),
    };
    if (!item.plain) {
      send(res, 200, { item: null });
      return;
    }
    termMemo.set(cacheKey, item);
    send(res, 200, { item });
  } catch {
    send(res, 200, { item: null });
  }
}

const termMemo = new Map<string, { term: string; plain: string; example: string; watch: string }>();

async function handleSqlReview(req: IncomingMessage, res: ServerResponse, state: { key: string }) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    send(res, 405, { item: null });
    return;
  }
  let extra = "";
  let prompt = "";
  let schema = "";
  let expected = "";
  let student = "";
  let engine = "";
  try {
    const raw = await readBody(req);
    const body = raw
      ? (JSON.parse(raw) as {
          key?: string;
          prompt?: string;
          schema?: string;
          expected?: string;
          student?: string;
          engine?: string;
        })
      : {};
    extra = typeof body.key === "string" ? body.key.trim() : "";
    prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 800) : "";
    schema = typeof body.schema === "string" ? body.schema.trim().slice(0, 800) : "";
    expected = typeof body.expected === "string" ? body.expected.trim().slice(0, 4000) : "";
    student = typeof body.student === "string" ? body.student.trim().slice(0, 4000) : "";
    engine = typeof body.engine === "string" ? body.engine.trim().slice(0, 400) : "";
  } catch {
    send(res, 200, { item: null });
    return;
  }
  const apiKey = extra || state.key;
  if (!apiKey || !prompt || !expected) {
    send(res, 200, { item: null });
    return;
  }
  try {
    const row = await chat(
      apiKey,
      `读者是商业基础弱的大四学生，在做 SQL 实验室。对照下面这题。

任务：${prompt}
表：${schema || "（见任务）"}
参考写法（这是本题标准答案，不要另起一套口径）：
${expected}

学生写的：
${student || "（空）"}

引擎核对：${engine || "未知"}

只输出 JSON：{"plain":"","fix":""}
要求：大白话；不要提问、不要布置作业、不要夸学生。
- 如果引擎说结果一致：plain 里说结果对了；写法若不同，用一两句点出差别；fix 留空。
- 如果报错或结果不对：plain 先说错在哪一步（筛选、连接、分组、去重、排序、日期还是口径），再对照参考写法；fix 用两三句说该怎么改，不要整段重抄参考 SQL。`,
      700,
      "你在改 SQL 作业。只输出 JSON。不要提问。",
    );
    const item = {
      plain: String(row?.plain || "").trim(),
      fix: String(row?.fix || "").trim(),
    };
    send(res, 200, { item: item.plain ? item : null });
  } catch {
    send(res, 200, { item: null });
  }
}

async function handleNewsAsk(req: IncomingMessage, res: ServerResponse, state: { key: string }) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    send(res, 405, { item: null });
    return;
  }
  let extra = "";
  let question = "";
  let title = "";
  let source = "";
  let brief = "";
  let history: { role: string; text: string }[] = [];
  try {
    const raw = await readBody(req);
    const body = raw
      ? (JSON.parse(raw) as {
          key?: string;
          question?: string;
          title?: string;
          source?: string;
          brief?: string;
          history?: { role?: string; text?: string }[];
        })
      : {};
    extra = typeof body.key === "string" ? body.key.trim() : "";
    question = typeof body.question === "string" ? body.question.trim().slice(0, 400) : "";
    title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
    source = typeof body.source === "string" ? body.source.trim().slice(0, 40) : "";
    brief = typeof body.brief === "string" ? body.brief.trim().slice(0, 2400) : "";
    history = Array.isArray(body.history)
      ? body.history
          .slice(-6)
          .map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            text: String(m.text || "").trim().slice(0, 500),
          }))
          .filter((m) => m.text)
      : [];
  } catch {
    send(res, 200, { item: null });
    return;
  }
  const apiKey = extra || state.key;
  if (!apiKey || !question) {
    send(res, 200, { item: null });
    return;
  }
  const prior = history.map((m) => `${m.role === "assistant" ? "学长" : "学生"}：${m.text}`).join("\n");
  try {
    const row = await chat(
      apiKey,
      `读者是商业基础很弱的大四学生，在读今天这篇互联网新闻简报，有一句看不懂。请用大白话直接回答。

今天这篇：
标题：${title || "（还没有标题）"}
来源：${source || "（未知）"}
简报摘录：${brief || "（摘要很少，按标题能确定的内容答，不确定就标明是推断）"}

${prior ? `刚才的对话：\n${prior}\n` : ""}学生现在问：${question}

只输出 JSON：{"reply":""}
要求：两三到五段人话；术语第一次出现用括号带一句；不要编造没有的数字；不要布置作业、不要反问一串问题；紧扣这篇，不要空泛框架。`,
      800,
      "你在带人看这篇新闻。只输出 JSON。不要提问。",
    );
    const reply = String(row?.reply || "").trim();
    send(res, 200, { item: reply ? { reply } : null });
  } catch {
    send(res, 200, { item: null });
  }
}

export const apiState = { key: (process.env.DEEPSEEK_API_KEY || "").trim() };

export { handleHotspot, handleKey, handleTerm, handleSqlReview, handleNewsAsk };
