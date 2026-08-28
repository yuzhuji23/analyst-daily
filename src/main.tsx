import { Component, StrictMode, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

class CrashBox extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) {
    return { err };
  }
  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error(err, info);
  }
  render() {
    if (this.state.err) {
      return (
        <div className="shell">
          <h1>页面出错了</h1>
          <p className="muted">{this.state.err.message}</p>
          <button className="btn" onClick={() => location.reload()}>
            刷新
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CrashBox>
      <App />
    </CrashBox>
  </StrictMode>,
);
