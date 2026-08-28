import { useState } from "react";
import { useParams } from "react-router-dom";
import { Quiz } from "../components/Quiz";
import { caseById } from "../data/catalog";
import { useProgress } from "../state";

export function CasePage() {
  const { id } = useParams();
  const item = id ? caseById(id) : undefined;
  const { progress, setProgress } = useProgress();
  const [quizDone, setQuizDone] = useState(false);
  if (!item) return <p>找不到这个故事。</p>;

  const showMethod = quizDone || progress.casesDone.includes(item.id);

  const finish = (correct: number, total: number) => {
    setQuizDone(true);
    setProgress((p) => ({
      ...p,
      casesDone: Array.from(new Set([...p.casesDone, item.id])),
      quiz: {
        ...p.quiz,
        [item.id]: { correct, total, at: new Date().toISOString() },
      },
      today: { ...p.today, case: true },
    }));
  };

  return (
    <article className="story">
      <p className="kicker">
        {item.industry} · 约 {item.minutes} 分钟
      </p>
      <h2 className="section-title">{item.title}</h2>
      <div className="story-body">
        {item.story.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <h3 className="story-h">一点点看懂</h3>
      <ol className="story-steps">
        {item.steps.map((s) => (
          <li key={s.title}>
            <strong>{s.title}</strong>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
      <div className="callout">
        <strong>记住这个画面</strong>
        {item.remember}
      </div>
      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>看到这儿</h3>
        <Quiz questions={item.quiz} onFinished={finish} />
        {showMethod && item.method ? (
          <div className="callout" style={{ marginTop: "0.9rem" }}>
            <strong>这类题以后怎么拆</strong>
            {item.method}
          </div>
        ) : null}
      </div>
    </article>
  );
}
