import { Link } from "react-router-dom";
import { caseProgress, labProgress, nextLab, nextLesson, pathProgress, todayCase } from "../data/catalog";
import { useDailyHotspot } from "../lib/hotspot";
import { useProgress } from "../state";

const TRACK_NAME = {
  sql: "今日一课 · SQL",
  excel: "今日一课 · Excel",
  ab: "今日一课 · 实验",
  oral: "今日一课 · 开口",
};

export function TodayPage() {
  const { progress } = useProgress();
  const { item: hotspot } = useDailyHotspot();
  const lesson = nextLesson(progress.completed);
  const biz = todayCase(progress.casesDone);
  const lab = nextLab(progress.completedLabs);
  const pp = pathProgress(progress.completed);
  const cp = caseProgress(progress.casesDone);
  const lp = labProgress(progress.completedLabs);
  const sqlBadge = progress.completed.includes(lesson.id)
    ? "已完成"
    : progress.today.sql === "deferred"
      ? "晚点做"
      : progress.today.sql === "done"
        ? "继续"
        : "待做";
  const caseBadge = progress.casesDone.includes(biz.id)
    ? "已完成"
    : progress.today.case
      ? "继续"
      : "约 10 分钟";
  const labBadge = progress.completedLabs.includes(lab.id)
    ? "已完成"
    : progress.today.lab
      ? "继续"
      : "待做";

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
          <h2>{TRACK_NAME[lesson.track]}</h2>
          <span className={`badge ${progress.completed.includes(lesson.id) ? "good" : progress.today.sql === "deferred" ? "warn" : ""}`}>
            {sqlBadge}
          </span>
        </header>
        <p className="today-copy">{lesson.title}</p>
        <div className="btn-row">
          <Link className="btn" to={`/lesson/${lesson.id}`}>
            开始这一课
          </Link>
        </div>
      </div>

      <div className="card today-slot">
        <header>
          <h2>SQL 实验室</h2>
          <span className={`badge ${progress.completedLabs.includes(lab.id) ? "good" : ""}`}>
            {labBadge}
          </span>
        </header>
        <p className="today-copy">{lab.title}</p>
        <div className="btn-row">
          <Link className="btn" to={`/lab?task=${lab.id}`}>
            做这道实验
          </Link>
        </div>
      </div>

      <div className="today-foot">
        <span>
          课程 {pp.done}/{pp.total} · 故事 {cp.done}/{cp.total} · 实验 {lp.done}/{lp.total}
        </span>
        <div className="progress-track">
          <span style={{ width: `${(pp.done / pp.total) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
