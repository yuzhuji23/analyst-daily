import { Link } from "react-router-dom";
import { caseProgress, labProgress, nextRLab, nextRLesson, nextSqlLab, nextSqlLesson, rProgress, sqlProgress, todayCase } from "../data/catalog";
import { useDailyHotspot } from "../lib/hotspot";
import { useProgress } from "../state";
import type { Lesson } from "../types";

function lessonBadge(lesson: Lesson, completed: string[], deferred: boolean) {
  if (completed.includes(lesson.id)) return { text: "已完成", cls: "good" };
  if (deferred) return { text: "晚点做", cls: "warn" };
  return { text: "待做", cls: "" };
}

export function TodayPage() {
  const { progress } = useProgress();
  const { item: hotspot } = useDailyHotspot();
  const sqlLesson = nextSqlLesson(progress.completed);
  const rLesson = nextRLesson(progress.completed);
  const biz = todayCase(progress.casesDone);
  const sqlLab = nextSqlLab(progress.completedLabs);
  const rLab = nextRLab(progress.completedLabs);
  const sp = sqlProgress(progress.completed);
  const rp = rProgress(progress.completed);
  const cp = caseProgress(progress.casesDone);
  const lp = labProgress(progress.completedLabs);
  const sqlMark = lessonBadge(sqlLesson, progress.completed, progress.today.sql === "deferred" && sqlLesson.track === "sql");
  const rMark = lessonBadge(rLesson, progress.completed, false);
  const caseBadge = progress.casesDone.includes(biz.id)
    ? "已完成"
    : progress.today.case
      ? "继续"
      : "约 10 分钟";

  return (
    <div className="today-board">
      <div className="card today-slot">
        <header>
          <h2>今日热点</h2>
          <span className={`badge ${progress.today.news ? "good" : ""}`}>
            {progress.today.news ? "已读" : "约 8 分钟"}
          </span>
        </header>
        <p className="today-copy">{hotspot ? hotspot.title : "今日简报准备中"}</p>
        <div className="btn-row">
          <Link className="btn" to="/news">
            去看
          </Link>
        </div>
      </div>

      <div className="card today-slot">
        <header>
          <h2>商业小故事</h2>
          <span className={`badge ${progress.casesDone.includes(biz.id) ? "good" : ""}`}>
            {caseBadge}
          </span>
        </header>
        <p className="today-copy">
          {biz.industry} · {biz.title}
        </p>
        <div className="btn-row">
          <Link className="btn" to={`/case/${biz.id}`}>
            看这个故事
          </Link>
        </div>
      </div>

      <div className="card today-slot">
        <header>
          <h2>今日 SQL</h2>
          <span className={`badge ${sqlMark.cls}`}>{sqlMark.text}</span>
        </header>
        <p className="today-copy">{sqlLesson.title}</p>
        <div className="btn-row">
          <Link className="btn" to={`/lesson/${sqlLesson.id}`}>
            开始这一课
          </Link>
          <Link className="btn-ghost" to={`/lab?task=${sqlLab.id}`}>
            实验室
          </Link>
        </div>
      </div>

      <div className="card today-slot">
        <header>
          <h2>今日 R</h2>
          <span className={`badge ${rMark.cls}`}>{rMark.text}</span>
        </header>
        <p className="today-copy">{rLesson.title}</p>
        <div className="btn-row">
          <Link className="btn" to={`/lesson/${rLesson.id}`}>
            开始这一课
          </Link>
          <Link className="btn-ghost" to={`/lab?lang=r&task=${rLab.id}`}>
            实验室
          </Link>
        </div>
      </div>

      <div className="today-foot">
        <span>
          SQL {sp.done}/{sp.total} · R {rp.done}/{rp.total} · 故事 {cp.done}/{cp.total} · 实验 {lp.done}/{lp.total}
        </span>
        <div className="progress-track">
          <span style={{ width: `${((sp.done + rp.done) / (sp.total + rp.total)) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
