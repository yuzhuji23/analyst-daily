import { useState } from "react";
import { Quiz } from "../components/Quiz";
import { newsDrill } from "../data/newsDrill";
import { todayIso } from "../lib/progress";
import { useDailyHotspot } from "../lib/hotspot";
import { useProgress } from "../state";

function todayLabel() {
  const d = new Date();
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function NewsPage() {
  const { progress, setProgress } = useProgress();
  const { item, loading } = useDailyHotspot();
  const [quizDone, setQuizDone] = useState(false);

  const finish = (correct: number, total: number) => {
    const d = todayIso();
    setQuizDone(true);
    setProgress((p) => ({
      ...p,
      newsReadDates: Array.from(new Set([...p.newsReadDates, d])),
      quiz: {
        ...p.quiz,
        [`news-${d}`]: { correct, total, at: new Date().toISOString() },
      },
      today: { ...p.today, news: true },
    }));
  };

  if (loading && !item) {
    return (
      <div className="brief">
        <p className="brief-kicker">{todayLabel()}</p>
        <p className="muted">今日简报写得细一点，稍等。</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="brief">
        <p className="brief-kicker">{todayLabel()}</p>
        <h2 className="brief-title">今天还没有新的简报</h2>
        <p className="muted">过一会儿再打开这一页。</p>
      </div>
    );
  }

  const extra = item.quiz?.length >= 3 && item.method ? { quiz: item.quiz, method: item.method } : newsDrill(item.title, "");
  const showMethod = quizDone || progress.today.news;

  return (
    <article className="brief">
      <p className="brief-kicker">{todayLabel()}</p>
      <h2 className="brief-title">{item.title}</h2>
      <p className="brief-source">{item.source}</p>
      <p className="brief-learn">能学到什么</p>
      <div className="brief-body">
        {item.sections.map((sec) => (
          <section className="brief-block" key={sec.title}>
            <h3>{sec.title}</h3>
            {sec.paras.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        ))}
      </div>
      <div className="card" style={{ marginTop: "0.4rem" }}>
        <h3>看到这儿</h3>
        <Quiz questions={extra.quiz} onFinished={finish} />
        {showMethod && extra.method ? (
          <div className="callout" style={{ marginTop: "0.9rem" }}>
            <strong>这类题以后怎么拆</strong>
            {extra.method}
          </div>
        ) : null}
      </div>
      <div className="brief-actions">
        {item.url ? (
          <a className="btn" href={item.url} target="_blank" rel="noreferrer">
            阅读原文
          </a>
        ) : null}
      </div>
    </article>
  );
}
