import { lazy, Suspense } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { CasePage } from "./pages/CasePage";
import { LessonPage } from "./pages/Lesson";
import { MePage } from "./pages/Me";
import { NewsPage } from "./pages/News";
import { PathPage } from "./pages/Path";
import { TodayPage } from "./pages/Today";
import { ProgressProvider } from "./state";

const LabPage = lazy(async () => {
  const m = await import("./pages/Lab");
  return { default: m.LabPage };
});

export default function App() {
  return (
    <ProgressProvider>
      <HashRouter>
        <Suspense fallback={<p className="lead">加载中…</p>}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<TodayPage />} />
              <Route path="/path" element={<PathPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/lab" element={<LabPage />} />
              <Route path="/me" element={<MePage />} />
              <Route path="/lesson/:id" element={<LessonPage />} />
              <Route path="/case/:id" element={<CasePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </HashRouter>
    </ProgressProvider>
  );
}
