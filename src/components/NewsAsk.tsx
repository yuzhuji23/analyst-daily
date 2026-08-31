import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { askNews, readApiKey, useDailyHotspot, type NewsAskTurn } from "../lib/hotspot";

function briefOf(item: { sections: { title: string; paras: string[] }[] }) {
  return item.sections
    .map((s) => `${s.title}\n${s.paras.join("\n")}`)
    .join("\n\n")
    .slice(0, 2400);
}

export function NewsAsk() {
  const { item } = useDailyHotspot();
  const [q, setQ] = useState("");
  const [log, setLog] = useState<NewsAskTurn[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const articleKey = item ? `${item.date}|${item.title}` : "";

  useEffect(() => {
    setLog([]);
    setErr("");
    setQ("");
  }, [articleKey]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [log, loading]);

  const send = async () => {
    const question = q.trim();
    if (!question || loading) return;
    setErr("");
    setQ("");
    const history = log.slice(-6);
    setLog((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);
    const reply = await askNews({
      question,
      title: item?.title || "",
      source: item?.source || "",
      brief: item ? briefOf(item) : "",
      history,
    });
    setLoading(false);
    if (reply) {
      setLog((prev) => [...prev, { role: "assistant", text: reply }]);
      return;
    }
    setErr(readApiKey() ? "这一问没接上，过一会儿再试。" : "先到「我的」里把简报密钥存上，才能问。");
  };

  return (
    <div className="news-ask">
      <header className="news-ask-head">
        <p>看这篇有不懂的，直接问</p>
        {log.length ? (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setLog([]);
              setErr("");
            }}
          >
            清空
          </button>
        ) : null}
      </header>
      {log.length || loading ? (
        <div className="news-ask-log">
          {log.map((m, i) => (
            <div className={`news-ask-msg ${m.role}`} key={`${m.role}-${i}`}>
              <span>{m.role === "user" ? "你" : "答"}</span>
              <p>{m.text}</p>
            </div>
          ))}
          {loading ? <p className="muted news-ask-wait">在想…</p> : null}
          <div ref={bottom} />
        </div>
      ) : null}
      {err ? (
        <p className="muted glossary-miss">
          {err}
          {readApiKey() ? null : (
            <>
              {" "}
              <Link to="/me">去存</Link>
            </>
          )}
        </p>
      ) : null}
      <form
        className="glossary-bar"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="比如：他们为什么要这么做？"
          aria-label="问这篇简报"
          disabled={loading}
        />
        <button className="btn" type="submit" disabled={loading || !q.trim()}>
          {loading ? "…" : "问"}
        </button>
      </form>
    </div>
  );
}
