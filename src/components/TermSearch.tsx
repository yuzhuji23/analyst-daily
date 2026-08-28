import { useState } from "react";
import type { TermDef } from "../data/glossary";
import { lookupTerm } from "../data/glossary";
import { readApiKey } from "../lib/hotspot";

type Hit = Pick<TermDef, "term" | "plain" | "example" | "watch">;

const MEMO = "analyst-term-cache-v1";

function readMemo(): Record<string, Hit> {
  try {
    return JSON.parse(localStorage.getItem(MEMO) || "{}") as Record<string, Hit>;
  } catch {
    return {};
  }
}

function writeMemo(term: string, hit: Hit) {
  const all = readMemo();
  all[term.trim().toLowerCase()] = hit;
  localStorage.setItem(MEMO, JSON.stringify(all));
}

async function fromServer(term: string): Promise<Hit | null> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch("/api/term", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term, key: readApiKey() }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { item?: Hit | null };
    if (!data.item?.plain) return null;
    return data.item;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

export function TermSearch() {
  const [q, setQ] = useState("");
  const [hit, setHit] = useState<Hit | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const search = async () => {
    const term = q.trim();
    if (!term) return;
    setErr("");
    const local = lookupTerm(term);
    if (local) {
      setHit(local);
      return;
    }
    const cached = readMemo()[term.toLowerCase()];
    if (cached) {
      setHit(cached);
      return;
    }
    setLoading(true);
    const remote = await fromServer(term);
    setLoading(false);
    if (remote) {
      writeMemo(term, remote);
      setHit(remote);
      return;
    }
    setHit(null);
    setErr("暂时没有这条。换个写法试试，比如把英文缩写拆开。");
  };

  return (
    <div className="glossary">
      <form
        className="glossary-bar"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="查个词，比如 日活"
          aria-label="查词"
        />
        <button className="btn" type="submit" disabled={loading || !q.trim()}>
          {loading ? "…" : "查"}
        </button>
      </form>
      {hit && (
        <div className="glossary-hit">
          <header>
            <strong>{hit.term}</strong>
            <button type="button" className="btn-ghost" onClick={() => setHit(null)}>
              收起
            </button>
          </header>
          <p>{hit.plain}</p>
          {hit.example ? <p className="muted">比方：{hit.example}</p> : null}
          {hit.watch ? <p className="muted">小心：{hit.watch}</p> : null}
        </div>
      )}
      {err && !hit ? <p className="muted glossary-miss">{err}</p> : null}
    </div>
  );
}
