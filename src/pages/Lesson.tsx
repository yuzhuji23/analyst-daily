import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Blocks } from "../components/Blocks";
import { Quiz } from "../components/Quiz";
import { lessonById } from "../data/catalog";
import { useProgress } from "../state";

export function LessonPage() {
  const { id } = useParams();
  const lesson = id ? lessonById(id) : undefined;
  const { progress, setProgress } = useProgress();
  const [quizDone, setQuizDone] = useState(false);
  if (!lesson) return <p>找不到这一课。</p>;

  const finishQuiz = (correct: number, total: number) => {
    setQuizDone(true);
    setProgress((p) => {
      const labId = lesson.lab?.id;
      return {
        ...p,
        completed: Array.from(new Set([...p.completed, lesson.id])),
        quiz: {
          ...p.quiz,
          [lesson.id]: { correct, total, at: new Date().toISOString() },
        },
        deferredLabs:
          labId && !p.completedLabs.includes(labId)
            ? Array.from(new Set([...p.deferredLabs, labId]))
            : p.deferredLabs,
        today: {
          ...p.today,
          sql: lesson.track === "sql" || lesson.track === "ab" || lesson.track === "oral" || lesson.track === "r" ? "done" : p.today.sql,
        },
      };
    });
  };

  const skipLab = () => {
    if (!lesson.lab) return;
    setProgress((p) => ({
      ...p,
      deferredLabs: Array.from(new Set([...p.deferredLabs, lesson.lab!.id])),
      today: { ...p.today, sql: p.today.sql === "done" ? "done" : "deferred" },
    }));
  };

  return (
    <article>
      <p className="kicker">
        {lesson.track === "sql"
          ? "SQL"
          : lesson.track === "excel"
            ? "Excel 对照"
            : lesson.track === "ab"
              ? "实验"
              : lesson.track === "r"
                ? "R · 对照 Python"
                : "开口面试"}
      </p>
      <h2 className="section-title">{lesson.title}</h2>
      <p className="lead">{lesson.summary}</p>
      <Blocks blocks={lesson.blocks} />

      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>自测（手机上就能做）</h3>
        {progress.completed.includes(lesson.id) && !quizDone ? (
          <p className="muted">这一课已经记过进度。可以再做一遍巩固，不会清空记录。</p>
        ) : null}
        <Quiz questions={lesson.quiz} onFinished={finishQuiz} />
      </div>

      {lesson.lab && (
        <div className="card" style={{ marginTop: "0.8rem" }}>
          <h3>实验室 · 建议电脑</h3>
          <p>
            {lesson.lab.title}
          </p>
          <p className="muted">{lesson.lab.prompt}</p>
          <div className="btn-row">
            <Link className="btn" to={lesson.lab.lang === "r" ? `/lab?lang=r&task=${lesson.lab.id}` : `/lab?task=${lesson.lab.id}`}>
              {lesson.lab.lang === "r" ? "打开 R 实验室" : "打开 SQL 实验室"}
            </Link>
            <button className="btn-ghost" onClick={skipLab}>
              晚点再做
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
