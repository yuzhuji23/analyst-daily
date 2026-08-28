import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ALL_LESSONS } from "../data/catalog";
import { reviewSqlLab, type SqlReview } from "../lib/hotspot";
import { checkQuery, execSql, getDb, SCHEMA_TEXT, type Grid } from "../lib/sqlEngine";
import { useProgress } from "../state";
import type { Database } from "sql.js";

export function LabPage() {
  const [params] = useSearchParams();
  const taskId = params.get("task");
  const { progress, setProgress } = useProgress();
  const labs = useMemo(
    () => ALL_LESSONS.filter((l) => l.lab).map((l) => l.lab!),
    [],
  );
  const current = labs.find((t) => t.id === taskId) ?? labs.find((t) => progress.deferredLabs.includes(t.id)) ?? labs[0];
  const [activeId, setActiveId] = useState(current.id);
  const task = labs.find((t) => t.id === activeId) ?? current;

  useEffect(() => {
    if (taskId) setActiveId(taskId);
  }, [taskId]);
  const [db, setDb] = useState<Database | null>(null);
  const [error, setError] = useState("");
  const [sql, setSql] = useState(task.starter);
  const [grid, setGrid] = useState<Grid | null>(null);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState<boolean | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [review, setReview] = useState<SqlReview | null>(null);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    getDb()
      .then(setDb)
      .catch((e) => setError(`SQL 引擎加载失败：${(e as Error).message}`));
  }, []);

  useEffect(() => {
    setSql(task.starter);
    setGrid(null);
    setMsg("");
    setOk(null);
    setShowAnswer(false);
    setReview(null);
    setReviewing(false);
  }, [task.id, task.starter]);

  const run = () => {
    if (!db) return;
    try {
      const g = execSql(db, sql);
      setGrid(g);
      setMsg(`返回 ${g.rows.length} 行`);
      setOk(null);
    } catch (e) {
      setGrid(null);
      setMsg((e as Error).message);
      setOk(false);
    }
  };

  const check = async () => {
    if (!db) return;
    const r = checkQuery(db, sql, task.expectedSql);
    setGrid(r.grid);
    setMsg(r.message);
    setOk(r.ok);
    setShowAnswer(true);
    setReview(null);
    if (r.ok) {
      setProgress((p) => ({
        ...p,
        completedLabs: Array.from(new Set([...p.completedLabs, task.id])),
        deferredLabs: p.deferredLabs.filter((id) => id !== task.id),
      }));
    }
    setReviewing(true);
    const note = await reviewSqlLab({
      prompt: `${task.title}。${task.prompt}`,
      schema: SCHEMA_TEXT,
      expected: task.expectedSql,
      student: sql,
      engine: r.message,
    });
    setReview(note);
    setReviewing(false);
  };

  return (
    <div>
      <h2 className="section-title">SQL 实验室</h2>
      <p className="lead">
        模拟生活服务 App 的订单与行为数据。手机也能跑，但小屏会挤——有电脑时体验更好。待做的实验会列在下面。
      </p>
      {error && <p className="err">{error}</p>}
      <div className="grid-2">
        <div>
          <label className="muted">当前任务</label>
          <select
            value={task.id}
            onChange={(e) => setActiveId(e.target.value)}
            style={{ width: "100%", margin: "0.35rem 0 0.7rem", padding: "0.4rem", background: "var(--card)", border: "1px solid var(--rule)" }}
          >
            {labs.map((t) => (
              <option key={t.id} value={t.id}>
                {(progress.completedLabs.includes(t.id) ? "✓ " : progress.deferredLabs.includes(t.id) ? "稍后 " : "") + t.title}
              </option>
            ))}
          </select>
          <p>{task.prompt}</p>
          <p className="muted">提示：{task.hint}</p>
          <textarea className="code" value={sql} onChange={(e) => setSql(e.target.value)} spellCheck={false} />
          <div className="btn-row">
            <button className="btn" disabled={!db} onClick={run}>
              运行
            </button>
            <button className="btn-ghost" disabled={!db || reviewing} onClick={() => void check()}>
              {reviewing ? "正在看你的写法…" : "核对（看参考写法和点评）"}
            </button>
          </div>
          {msg && <p className={`toast ${ok === false ? "err" : ok ? "ok" : ""}`}>{msg}</p>}
          {showAnswer ? (
            <div className="callout" style={{ marginTop: "0.85rem" }}>
              <strong>参考写法</strong>
              <pre className="sql">{task.expectedSql}</pre>
            </div>
          ) : null}
          {reviewing ? <p className="muted">对照你的 SQL 看差在哪，稍等。</p> : null}
          {review ? (
            <div className="callout" style={{ marginTop: "0.75rem" }}>
              <strong>{ok ? "对照点评" : "你这题差在哪"}</strong>
              <p style={{ margin: "0.35rem 0 0" }}>{review.plain}</p>
              {review.fix ? <p style={{ margin: "0.45rem 0 0" }}>{review.fix}</p> : null}
            </div>
          ) : null}
          {grid && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {grid.columns.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grid.rows.slice(0, 80).map((r, i) => (
                    <tr key={i}>
                      {r.map((v, j) => (
                        <td key={j}>{String(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card">
          <h3>表结构</h3>
          <pre className="schema">{SCHEMA_TEXT}</pre>
          <p className="muted">日期范围约 2026-05-01 至 2026-08-27。订单状态含 paid / cancelled / created / refunded。</p>
        </div>
      </div>
    </div>
  );
}
