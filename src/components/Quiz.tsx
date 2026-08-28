import { useState } from "react";
import type { QuizQuestion } from "../types";

export function Quiz({
  questions,
  onFinished,
  label = "第",
}: {
  questions: QuizQuestion[];
  onFinished: (correct: number, total: number) => void;
  label?: string;
}) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const q = questions[i];
  if (!q) return null;

  const submit = () => {
    if (picked === null || revealed) return;
    const ok = picked === q.answer;
    const nextCorrect = correct + (ok ? 1 : 0);
    setCorrect(nextCorrect);
    setRevealed(true);
    if (i === questions.length - 1) {
      setFinalScore(nextCorrect);
      onFinished(nextCorrect, questions.length);
    }
  };

  const next = () => {
    setI(i + 1);
    setPicked(null);
    setRevealed(false);
  };

  return (
    <div>
      <p className="muted">
        {label} {i + 1} / {questions.length} 题
      </p>
      <p style={{ lineHeight: 1.6, fontWeight: 600 }}>{q.prompt}</p>
      {q.options.map((opt, idx) => {
        let cls = "option";
        if (revealed) {
          if (idx === q.answer) cls += " right";
          else if (idx === picked) cls += " wrong";
        } else if (idx === picked) cls += " picked";
        return (
          <button
            key={opt}
            className={cls}
            disabled={revealed}
            onClick={() => setPicked(idx)}
          >
            {opt}
          </button>
        );
      })}
      {revealed && <p className="why">{q.why}</p>}
      <div className="btn-row">
        {!revealed ? (
          <button className="btn" disabled={picked === null} onClick={submit}>
            确认
          </button>
        ) : i < questions.length - 1 ? (
          <button className="btn" onClick={next}>
            下一题
          </button>
        ) : (
          <p className="muted">
            本组 {finalScore ?? correct} / {questions.length} 题正确，进度已记下。
          </p>
        )}
      </div>
    </div>
  );
}
