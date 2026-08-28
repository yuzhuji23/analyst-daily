export type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "sql"; code: string }
  | { type: "callout"; title: string; text: string };

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  why: string;
};

export type LabTask = {
  id: string;
  title: string;
  prompt: string;
  hint: string;
  starter: string;
  expectedSql: string;
};

export type Lesson = {
  id: string;
  track: "sql" | "excel" | "ab" | "oral";
  order: number;
  title: string;
  minutes: number;
  summary: string;
  blocks: Block[];
  quiz: QuizQuestion[];
  lab?: LabTask;
};

export type BizCase = {
  id: string;
  order: number;
  title: string;
  industry: "电商" | "内容" | "本地生活" | "广告";
  minutes: number;
  story: string[];
  steps: { title: string; text: string }[];
  remember: string;
  method?: string;
  quiz: QuizQuestion[];
};

export type ProgressFile = {
  version: 1;
  exportedAt: string;
  completed: string[];
  quiz: Record<string, { correct: number; total: number; at: string }>;
  deferredLabs: string[];
  completedLabs: string[];
  newsReadDates: string[];
  casesDone: string[];
  lastVisit: string;
  streak: number;
  today: {
    date: string;
    news: boolean;
    case: boolean;
    sql: "pending" | "done" | "deferred";
    lab: boolean;
  };
};

export type NewsCandidate = {
  title: string;
  source: string;
  url: string;
  published: string;
  summary: string;
  score: number;
};

export type BriefSection = {
  title: string;
  paras: string[];
};

export type DailyHotspot = {
  date: string;
  title: string;
  source: string;
  url: string;
  published: string;
  sections: BriefSection[];
  quiz: QuizQuestion[];
  method: string;
};
