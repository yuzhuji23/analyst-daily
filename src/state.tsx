import { createContext, createElement, useContext, useMemo, useState, type ReactNode } from "react";
import { loadProgress, saveProgress } from "./lib/progress";
import type { ProgressFile } from "./types";

type Ctx = {
  progress: ProgressFile;
  setProgress: (next: ProgressFile | ((p: ProgressFile) => ProgressFile)) => void;
};

const ProgressCtx = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setState] = useState<ProgressFile>(() => loadProgress());
  const setProgress: Ctx["setProgress"] = (next) => {
    setState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      saveProgress(value);
      return value;
    });
  };
  const value = useMemo(() => ({ progress, setProgress }), [progress]);
  return createElement(ProgressCtx.Provider, { value }, children);
}

export function useProgress() {
  const ctx = useContext(ProgressCtx);
  if (!ctx) throw new Error("ProgressProvider missing");
  return ctx;
}
