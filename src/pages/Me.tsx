import { useEffect, useRef, useState } from "react";
import { keyIsSaved, saveApiKey } from "../lib/hotspot";
import { exportJson, fromToken, mergeProgress, toToken } from "../lib/progress";
import { useProgress } from "../state";

export function MePage() {
  const { progress, setProgress } = useProgress();
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState("");
  const [keyDraft, setKeyDraft] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const [keyEditing, setKeyEditing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void keyIsSaved().then((ok) => {
      setKeySaved(ok);
      setKeyEditing(!ok);
    });
  }, []);

  const copyToken = async () => {
    const t = toToken(progress);
    try {
      await navigator.clipboard.writeText(t);
      setMsg("口令已复制，发给另一台设备后粘贴导入。");
    } catch {
      setDraft(t);
      setMsg("已填进口令，请手动复制。");
    }
  };

  const download = () => {
    const blob = new Blob([exportJson(progress)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `分析日课进度-${progress.today.date}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg("已下载进度文件。");
  };

  const applyText = (raw: string) => {
    try {
      const incoming = fromToken(raw);
      const merged = mergeProgress(progress, incoming);
      setProgress(merged);
      setDraft("");
      setMsg("已导入，两边做过的都会保留。");
    } catch (e) {
      setMsg((e as Error).message || "导入失败");
    }
  };

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => applyText(String(reader.result || ""));
    reader.readAsText(file);
  };

  return (
    <div>
      <h2 className="section-title">进度</h2>
      <p className="lead">进度留在这台浏览器。换设备时导出，再在那边导入。</p>
      <div className="card">
        <p>
          已学课程 {progress.completed.length} · 案例 {progress.casesDone.length} · 实验室 {progress.completedLabs.length}
        </p>
        <p className="muted">连续 {progress.streak} 天 · 待做实验室 {progress.deferredLabs.length}</p>
        <div className="btn-row">
          <button className="btn" onClick={download}>
            导出
          </button>
          <button className="btn-ghost" onClick={() => void copyToken()}>
            复制口令
          </button>
        </div>
        <textarea
          className="token"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="粘贴口令或进度文件内容"
        />
        <div className="btn-row">
          <button className="btn" onClick={() => applyText(draft)} disabled={!draft.trim()}>
            导入
          </button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
            选择文件
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json,text/plain"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
        {msg && <p className="toast">{msg}</p>}
      </div>
      <div className="card" style={{ marginTop: "0.8rem" }}>
        <h3>简报密钥</h3>
        {keySaved && !keyEditing ? (
          <>
            <p className="muted">已经有密钥了，关掉浏览器也不用再填。</p>
            <div className="btn-row">
              <button className="btn-ghost" onClick={() => setKeyEditing(true)}>
                更换
              </button>
            </div>
          </>
        ) : (
          <>
            <input
              className="secret"
              type="password"
              autoComplete="off"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="DeepSeek 密钥，保存一次即可"
            />
            <div className="btn-row">
              <button
                className="btn"
                onClick={() => {
                  saveApiKey(keyDraft);
                  const ok = Boolean(keyDraft.trim());
                  setKeySaved(ok);
                  setKeyEditing(!ok);
                  setKeyDraft("");
                  setMsg(ok ? "密钥已保存。" : "已清除密钥。");
                }}
              >
                保存
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
