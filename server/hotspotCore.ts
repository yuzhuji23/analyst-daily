import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve } from "node:path";
import { NEWS_FEEDS, briefFor, rankCandidates, scoreNews, toHotspot } from "../src/data/news";
import { newsDrill } from "../src/data/newsDrill";
import type { BriefSection, DailyHotspot, NewsCandidate, QuizQuestion } from "../src/types";

type Cache = { date: string; item: DailyHotspot | null; usedAi: boolean };
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
            "你是带大四学生看互联网商业新闻的学长。对方商业基础弱。只用大白话。只输出 JSON。不要提问，不要布置作业，不要解释你是怎么实现的。",
        },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return parseJsonObject(data.choices?.[0]?.message?.content || "");
}

async function askDeepseek(key: string, pool: NewsCandidate[]) {
  const catalog = pool
    .map((row, i) => `${i}. 【${row.source}】${row.title}\n${(row.summary || "").slice(0, 90)}`)
    .join("\n\n");
  const picked = await chat(
    key,
    `选出对互联网数据分析/数据运营岗最值得学的【一条】。优先：财报、补贴与一单赚不赚钱、投放效率、大厂业务动作、竞争。不要：数码评测、纯融资八卦、没有业务可练的软文。\n\n只输出：{"index":数字}\n\n候选：\n${catalog}`,
    80,
  );
  const index = Math.max(0, Math.min(Number(picked?.index) || 0, pool.length - 1));
  const row = pool[index];
  if (!row) return null;

  const taught = await chat(
    key,
    `读者是商业基础很弱的大四学生，准备进互联网分析岗。请根据下面这篇新闻，写一份能直接读懂的讲解。有数字就用人话解释它代表什么；没有的事实不要编。术语第一次出现时用括号解释，例如 ARPU（平均每个用户带来的收入）。

必须按这个结构写，可以比示例更长、更具体：
1. 「这篇在讲什么」：假设对方完全没读过。讲清哪家公司、发生了什么、关键数字、为什么今天值得看。3到5段，每段2到4句。
2. 「跟着看懂」：用「第一步 / 第二步 / 第三步…」带对方走逻辑。每一步先说人话，再说这件事里钱、用户或竞争是怎么动的，以及看哪个数能验证。写 4 到 6 步。
3. 「你要带走的」：这条对应的商业常识，以及以后看到同类新闻怎么想。2到3段。最后一段用「记住：」开头，给一句能留住的话。

结合这篇的公司名和事实，禁止空泛框架，禁止问答。

标题：${row.title}
来源：${row.source}
正文摘录：${row.summary || "（摘要很少，请严格按标题能确定的内容写，不确定的标明是推断）"}

只输出：{"sections":[{"title":"这篇在讲什么","paras":["",""]},{"title":"跟着看懂","paras":["第一步：", "第二步："]},{"title":"你要带走的","paras":["","记住："]}]}`,
    2400,
  );
  const sections = asSections(taught?.sections);
  if (!sections) return null;

  const drilled = await chat(
    key,
    `读者是商业基础很弱的大四学生。根据这篇新闻出 3 道选择题，把简报里的逻辑练住。

要求：
- 每题 4 个选项，只有 1 个对；answer 是从 0 开始的序号
- 结合这篇的公司名和事实，不要空泛送分题，不要提问式标题
- why 用一两句人话
- method 写一段「这类题以后怎么拆」的通用解法，不要只复述这篇

标题：${row.title}
来源：${row.source}
摘录：${row.summary || "（摘要很少，请严格按标题能确定的内容出题）"}

只输出：{"method":"","quiz":[{"prompt":"","options":["","","",""],"answer":0,"why":""},{"prompt":"","options":["","","",""],"answer":1,"why":""},{"prompt":"","options":["","","",""],"answer":2,"why":""}]}`,
    1400,
  );
  const quiz = asQuiz(drilled?.quiz);
  const method = String(drilled?.method || "").trim();
  const fallback = newsDrill(row.title, row.summary);
  return toHotspot(todayShanghai(), row, sections, {
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
      if (ai) return { item: ai, usedAi: true };
    } catch {
      /* fall through */
    }
  }
  const row = pool[0];
  return { item: toHotspot(todayShanghai(), row, briefFor(row.title, row.summary)), usedAi: false };
}

async function dailyHotspot(apiKey: string) {
  const date = todayShanghai();
  if (cache?.date === date && (cache.usedAi || !apiKey) && hasDrill(cache.item)) return cache.item;
  if (!inflight) {
    inflight = buildHotspot(apiKey)
      .then((row) => {
        cache = { date, item: row.item, usedAi: row.usedAi };
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
      if (size > 4000) {
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
  } catch {
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

export const apiState = { key: (process.env.DEEPSEEK_API_KEY || "").trim() };

export { handleHotspot, handleKey, handleTerm };
