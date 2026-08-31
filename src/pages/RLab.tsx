import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { nextRLab, rLabs } from "../data/catalog";
import { checkR, execR, R_SCHEMA_TEXT, type RRun } from "../lib/rEngine";
import { useProgress } from "../state";

function Plots({ images }: { images: ImageBitmap[] }) {
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    images.forEach((img, i) => {
      const canvas = refs.current[i];
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
    });
  }, [images]);
  if (!images.length) return null;
  return (
    <div>
      {images.map((img, i) => (
        <canvas
          key={`${img.width}x${img.height}-${i}`}
          className="lab-plot"
          ref={(el) => {
            refs.current[i] = el;
          }}
        />
      ))}
    </div>
  );
}

function ResultTable({ run }: { run: RRun }) {
  return (
    <>
      {run.output ? <pre className="schema">{run.output}</pre> : null}
      <Plots images={run.images} />
      {run.grid.columns.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {run.grid.columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {run.grid.rows.slice(0, 80).map((r, i) => (
                <tr key={i}>
                  {r.map((v, j) => (
                    <td key={j}>{v == null ? "NA" : String(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}

export function RLab() {
  const [params, setParams] = useSearchParams();
  const taskId = params.get("task");
  const { progress, setProgress } = useProgress();
  const labs = useMemo(() => rLabs(), []);
  const queued = nextRLab(progress.completedLabs);
  const current = labs.find((t) => t.id === taskId) ?? queued;
  const [activeId, setActiveId] = useState(current.id);
  const task = labs.find((t) => t.id === activeId) ?? current;
  const upcoming = nextRLab(progress.completedLabs);

  useEffect(() => {
    if (taskId && labs.some((t) => t.id === taskId)) setActiveId(taskId);
  }, [taskId, labs]);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState(task.starter);
  const [run, setRun] = useState<RRun | null>(null);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState<boolean | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [busy, setBusy] = useState(false);
  const showNext = Boolean(ok) && upcoming.id !== task.id;

  useEffect(() => {
    let cancelled = false;
    setError("");
    setReady(false);
    import("../lib/rEngine")
      .then((m) => m.getWebR())
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e) => {
        if (!cancelled) setError(`R 引擎加载失败：${(e as Error).message}。需要能访问 webr.r-wasm.org。`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setCode(task.starter);
    setRun(null);
    setMsg("");
    setOk(null);
    setShowAnswer(false);
  }, [task.id, task.starter]);

  const openTask = (id: string) => {
    setActiveId(id);
    setParams({ lang: "r", task: id }, { replace: true });
  };

  const runCode = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setOk(null);
    try {
      const g = await execR(code);
      setRun(g);
      const n = g.grid.rows.length;
      setMsg(n ? `返回 ${n} 行` : g.output || g.images.length ? "已运行" : "已运行（没有表，最后一行写出结果）");
    } catch (e) {
      setRun(null);
      setMsg((e as Error).message);
      setOk(false);
    } finally {
      setBusy(false);
    }
  };

  const check = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const r = await checkR(code, task.expectedSql);
      setRun(r.run);
      setMsg(r.ok ? "已记下这题，结果和参考一致。" : r.message);
      setOk(r.ok);
      setShowAnswer(true);
      if (r.ok) {
        setProgress((p) => ({
          ...p,
          completedLabs: Array.from(new Set([...(p.completedLabs ?? []), task.id])),
          deferredLabs: (p.deferredLabs ?? []).filter((id) => id !== task.id),
          today: { ...p.today, lab: true },
        }));
      }
    } catch (e) {
      setOk(false);
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid-2">
      <div>
        <label className="muted">当前任务</label>
        <select
          value={task.id}
          onChange={(e) => openTask(e.target.value)}
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
        <textarea className="code" value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} />
        <div className="btn-row">
          <button className="btn" disabled={!ready || busy} onClick={() => void runCode()}>
            {busy ? "运行中…" : "运行"}
          </button>
          <button className="btn-ghost" disabled={!ready || busy} onClick={() => void check()}>
            核对（看参考写法）
          </button>
          {showNext ? (
            <button className="btn" onClick={() => openTask(upcoming.id)}>
              下一题
            </button>
          ) : null}
        </div>
        {!ready && !error ? <p className="muted">第一次打开要加载浏览器里的 R（大约十几秒，之后会快）。</p> : null}
        {error && <p className="err">{error}</p>}
        {msg && <p className={`toast ${ok === false ? "err" : ok ? "ok" : ""}`}>{msg}</p>}
        {showAnswer ? (
          <div className="callout" style={{ marginTop: "0.85rem" }}>
            <strong>参考写法</strong>
            <pre className="sql">{task.expectedSql}</pre>
          </div>
        ) : null}
        {run ? <ResultTable run={run} /> : null}
      </div>
      <div className="card">
        <h3>表结构</h3>
        <pre className="schema">{R_SCHEMA_TEXT}</pre>
        <p className="muted">和 SQL 实验室同一门生意，行数更少。下标从 1 开始。最后一行写出要交的表或数字。</p>
      </div>
    </div>
  );
}
