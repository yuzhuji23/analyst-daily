import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { TermSearch } from "./TermSearch";
import { todayIso } from "../lib/progress";
import { useProgress } from "../state";

const links = [
  { to: "/", label: "今日" },
  { to: "/path", label: "路径" },
  { to: "/news", label: "热点" },
  { to: "/lab", label: "实验室" },
  { to: "/me", label: "我的" },
];

export function Layout() {
  const { progress } = useProgress();
  const date = todayIso();
  const home = useLocation().pathname === "/";

  useEffect(() => {
    document.documentElement.classList.toggle("lock-scroll", home);
    return () => document.documentElement.classList.remove("lock-scroll");
  }, [home]);

  return (
    <div className={home ? "shell home" : "shell"}>
      <header className="masthead">
        <div>
          {home ? null : <p className="kicker">互联网分析岗训练</p>}
          <h1>分析日课</h1>
        </div>
        <div className="meta">
          {date}
          <br />
          连续 {progress.streak} 天
        </div>
      </header>
      <nav className="desk-nav">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === "/"}>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <TermSearch />
      <Outlet />
      <nav className="tabbar">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === "/"}>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
