import { Link } from "react-router-dom";
import { AB_LESSONS } from "../data/abLessons";
import { CASES } from "../data/cases";
import { CASES_INTERVIEW } from "../data/casesInterview";
import { pathProgress } from "../data/catalog";
import { ORAL_LESSONS } from "../data/oralLessons";
import { SQL_FOUNDATION } from "../data/sqlFoundation";
import { EXCEL_LESSONS, SQL_LESSONS } from "../data/sqlLessons";
import { SQL_INTERVIEW } from "../data/sqlInterview";
import { useProgress } from "../state";
import type { BizCase, Lesson } from "../types";

function LessonList({ items }: { items: Lesson[] }) {
  const { progress } = useProgress();
  return (
    <>
      {items.map((l) => (
        <Link className="path-item" key={l.id} to={`/lesson/${l.id}`}>
          <span className="n">{String(l.order).padStart(2, "0")}</span>
          <span>
            <strong>{l.title}</strong>
            <div className="muted">{l.summary}</div>
          </span>
          <span className="done">{progress.completed.includes(l.id) ? "已学" : `${l.minutes}′`}</span>
        </Link>
      ))}
    </>
  );
}

function CaseList({ items }: { items: BizCase[] }) {
  const { progress } = useProgress();
  return (
    <>
      {items.map((c) => (
        <Link className="path-item" key={c.id} to={`/case/${c.id}`}>
          <span className="n">{String(c.order).padStart(2, "0")}</span>
          <span>
            <strong>{c.title}</strong>
            <div className="muted">
              {c.industry} · {c.minutes} 分钟
            </div>
          </span>
          <span className="done">{progress.casesDone.includes(c.id) ? "看过" : "未看"}</span>
        </Link>
      ))}
    </>
  );
}

export function PathPage() {
  const { progress } = useProgress();
  const pp = pathProgress(progress.completed);
  return (
    <div>
      <h2 className="section-title">学习路径</h2>
      <p className="muted">课程 {pp.done}/{pp.total} · 故事 {progress.casesDone.length}/{CASES.length + CASES_INTERVIEW.length}</p>

      <h3 className="path-phase">第一阶段 · 入门</h3>
      <h4 className="path-sub">SQL</h4>
      <LessonList items={SQL_LESSONS} />
      <h4 className="path-sub">SQL 再往细里</h4>
      <LessonList items={SQL_FOUNDATION} />
      <h4 className="path-sub">Excel</h4>
      <LessonList items={EXCEL_LESSONS} />
      <h4 className="path-sub">故事</h4>
      <CaseList items={CASES} />

      <h3 className="path-phase">第二阶段 · SQL 面试题</h3>
      <LessonList items={SQL_INTERVIEW} />

      <h3 className="path-phase">第三阶段 · 实验</h3>
      <LessonList items={AB_LESSONS} />

      <h3 className="path-phase">第四阶段 · 开口面试</h3>
      <LessonList items={ORAL_LESSONS} />
      <h4 className="path-sub">面试故事</h4>
      <CaseList items={CASES_INTERVIEW} />
    </div>
  );
}
