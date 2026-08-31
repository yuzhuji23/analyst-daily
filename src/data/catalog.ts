import { CASES } from "./cases";
import { CASE_DRILL } from "./caseDrill";
import { CASES_INTERVIEW } from "./casesInterview";
import { AB_LESSONS } from "./abLessons";
import { ORAL_LESSONS } from "./oralLessons";
import { EXCEL_LESSONS, SQL_LESSONS } from "./sqlLessons";
import { SQL_FOUNDATION } from "./sqlFoundation";
import { SQL_INTERVIEW } from "./sqlInterview";
import { R_LESSONS } from "./rLessons";
import type { BizCase, LabTask, Lesson } from "../types";

function withDrill(c: BizCase): BizCase {
  const d = CASE_DRILL[c.id];
  if (!d) return c;
  return { ...c, method: d.method, quiz: [...c.quiz, ...d.more] };
}

export const SQL_BASIC: Lesson[] = [...SQL_LESSONS, ...SQL_FOUNDATION];
export const SQL_ALL: Lesson[] = [...SQL_BASIC, ...SQL_INTERVIEW];
export { R_LESSONS };
export const ALL_LESSONS: Lesson[] = [...SQL_ALL, ...EXCEL_LESSONS, ...R_LESSONS, ...AB_LESSONS, ...ORAL_LESSONS];
export const ALL_CASES: BizCase[] = [...CASES, ...CASES_INTERVIEW].map(withDrill);
export const LEARN_PATH: Lesson[] = [...SQL_BASIC, ...EXCEL_LESSONS, ...R_LESSONS, ...SQL_INTERVIEW, ...AB_LESSONS, ...ORAL_LESSONS];

export function lessonById(id: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}

export function caseById(id: string): BizCase | undefined {
  return ALL_CASES.find((c) => c.id === id);
}

export function nextLesson(completed: string[]): Lesson {
  return LEARN_PATH.find((l) => !completed.includes(l.id)) ?? LEARN_PATH[LEARN_PATH.length - 1];
}

export function nextSqlLesson(completed: string[]): Lesson {
  return SQL_ALL.find((l) => !completed.includes(l.id)) ?? SQL_ALL[SQL_ALL.length - 1];
}

export function nextRLesson(completed: string[]): Lesson {
  return R_LESSONS.find((l) => !completed.includes(l.id)) ?? R_LESSONS[R_LESSONS.length - 1];
}

export function todayCase(completedCases: string[]): BizCase {
  return ALL_CASES.find((c) => !completedCases.includes(c.id)) ?? ALL_CASES[ALL_CASES.length - 1];
}

export function sqlLabs(): LabTask[] {
  return SQL_ALL.filter((l) => l.lab).map((l) => l.lab!);
}

export function rLabs(): LabTask[] {
  return R_LESSONS.filter((l) => l.lab).map((l) => l.lab!);
}

export function allLabs(): LabTask[] {
  return [...sqlLabs(), ...rLabs()];
}

export function nextSqlLab(completedLabs: string[]): LabTask {
  const labs = sqlLabs();
  return labs.find((t) => !completedLabs.includes(t.id)) ?? labs[labs.length - 1];
}

export function nextRLab(completedLabs: string[]): LabTask {
  const labs = rLabs();
  return labs.find((t) => !completedLabs.includes(t.id)) ?? labs[labs.length - 1];
}

export function nextLab(completedLabs: string[]): LabTask {
  return nextSqlLab(completedLabs);
}

export function labProgress(doneIds: string[]): { done: number; total: number } {
  const labs = allLabs();
  return { done: labs.filter((t) => doneIds.includes(t.id)).length, total: labs.length };
}

export function sqlProgress(completed: string[]): { done: number; total: number } {
  const done = SQL_ALL.filter((l) => completed.includes(l.id)).length;
  return { done, total: SQL_ALL.length };
}

export function rProgress(completed: string[]): { done: number; total: number } {
  const done = R_LESSONS.filter((l) => completed.includes(l.id)).length;
  return { done, total: R_LESSONS.length };
}

export function pathProgress(completed: string[]): { done: number; total: number } {
  const done = LEARN_PATH.filter((l) => completed.includes(l.id)).length;
  return { done, total: LEARN_PATH.length };
}

export function caseProgress(doneIds: string[]): { done: number; total: number } {
  return { done: ALL_CASES.filter((c) => doneIds.includes(c.id)).length, total: ALL_CASES.length };
}
