"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { API_BASE } from "@/lib/api";
import type { ResearchTask } from "@/lib/types";
import { Icon } from "./ui";
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [recent, setRecent] = useState<ResearchTask[]>([]);
  const drawer = useRef<HTMLDialogElement>(null);
  const refresh = useCallback(() => {
    fetch(`${API_BASE}/api/research-tasks?limit=12`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setRecent)
      .catch(() => {});
  }, []);
  useEffect(() => {
    refresh();
    window.addEventListener("researchmesh:updated", refresh);
    return () => window.removeEventListener("researchmesh:updated", refresh);
  }, [path, refresh]);
  const navigation = (
    <>
      <div className="sidebar-top">
        <Link href="/" className="brand" aria-label="ResearchMesh 首页">
          ResearchMesh
        </Link>
        <button
          className="icon-button sidebar-desktop-toggle"
          aria-label="折叠侧边栏"
          onClick={() => setCollapsed(true)}
        >
          <Icon name="panel" />
        </button>
        <button
          className="icon-button mobile-only"
          aria-label="关闭导航"
          onClick={() => drawer.current?.close()}
        >
          <Icon name="close" />
        </button>
      </div>
      <nav className="navigation" aria-label="主导航">
        <Link
          href="/"
          className={`nav-item ${path === "/" ? "selected" : ""}`}
          onClick={() => {
            window.dispatchEvent(new Event("researchmesh:new"));
            drawer.current?.close();
          }}
        >
          <Icon name="edit" />
          新建研究
        </Link>
        <Link
          href="/history"
          className={`nav-item ${path === "/history" ? "selected" : ""}`}
          onClick={() => drawer.current?.close()}
        >
          <Icon name="history" />
          研究历史
        </Link>
      </nav>
      <div className="recent-section">
        <p className="sidebar-label">最近的研究</p>
        <nav aria-label="最近的研究">
          {recent.length ? (
            recent.map((task) => (
              <Link
                key={task.task_id}
                href={`/history?task=${encodeURIComponent(task.task_id)}`}
                className="nav-item recent-item"
                title={task.topic}
                onClick={() => drawer.current?.close()}
              >
                {task.topic}
              </Link>
            ))
          ) : (
            <p className="sidebar-empty">暂无记录</p>
          )}
        </nav>
      </div>
          <button
            className="icon-button sidebar-theme"
            aria-label="切换浅色或深色主题"
            title="切换主题"
            onClick={() => {
              const root = document.documentElement;
              const theme = root.dataset.theme === "dark" ? "light" : "dark";
              root.dataset.theme = theme;
              try {
                localStorage.setItem("researchmesh-theme", theme);
              } catch {}
            }}
          >
            <Icon name="moon" className="theme-moon" />
            <Icon name="sun" className="theme-sun" />
          </button>
    </>
  );
  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <a href="#main-content" className="skip-link">
        跳到主要内容
      </a>
      <aside className="sidebar">{navigation}</aside>
      <dialog
        ref={drawer}
        className="mobile-drawer"
        aria-label="导航"
        onClick={(e) => {
          if (e.target === e.currentTarget) drawer.current?.close();
        }}
      >
        <div className="drawer-content">{navigation}</div>
      </dialog>
      <div className="workspace">
        <button
          className="icon-button desktop-expand navigation-trigger"
          aria-label="展开侧边栏"
          onClick={() => setCollapsed(false)}
        >
          <Icon name="panel" />
        </button>
        <button
          className="icon-button mobile-only navigation-trigger"
          aria-label="打开导航"
          onClick={() => drawer.current?.showModal()}
        >
          <Icon name="panel" />
        </button>
        <main id="main-content" className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
