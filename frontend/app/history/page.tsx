"use client";
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE } from "@/lib/api";
import type { ResearchTask, Report } from "@/lib/types";
import { ReportView } from "@/components/ReportView";
import { StyleSelector } from "@/components/StyleSelector";
import { ArtifactTools } from "@/components/ArtifactTools";
import { Button, Icon, Spinner } from "@/components/ui";

const labels: Record<string, string> = {
  coordinating: "分析中",
  planning: "规划中",
  researching: "研究中",
  generating_report: "生成报告",
  completed: "已完成",
  failed: "失败",
  awaiting_confirmation: "执行计划",
};
function HistoryReport({
  report,
  onNewResearch,
}: {
  report: Report;
  onNewResearch: () => void;
}) {
  const [currentReport, setCurrentReport] = useState(report);
  const [style, setStyle] = useState("general");
  return (
    <ReportView
      key={report.task_id}
      report={currentReport}
      onNewResearch={onNewResearch}
      onContentChange={(content) =>
        setCurrentReport((current) => ({
          ...current,
          content_markdown: content,
        }))
      }
      toolbar={
        <>
          <Link href="/history" className="button button-ghost">
            <Icon name="chevron" className="back-icon" width="18" height="18" />
            研究历史
          </Link>
          <StyleSelector
            taskId={report.task_id}
            currentStyle={style}
            currentMarkdown={currentReport.content_markdown}
            onRestyled={(nextStyle, markdown) => {
              setStyle(nextStyle);
              setCurrentReport((current) => ({
                ...current,
                content_markdown: markdown,
              }));
            }}
          />
          <ArtifactTools taskId={report.task_id} />
        </>
      }
    />
  );
}
function HistoryContent() {
  const router = useRouter();
  const params = useSearchParams();
  const selected = params.get("task");
  const [tasks, setTasks] = useState<ResearchTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [reportError, setReportError] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/api/research-tasks?limit=100`, {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error("记录加载失败");
        return r.json();
      })
      .then((data) => {
        setTasks(data);
        setLoading(false);
        setError(null);
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError("记录加载失败，请重试");
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [retry]);
  const selectedTask = tasks.find((task) => task.task_id === selected);
  const status = selectedTask?.status;
  useEffect(() => {
    if (!selected || status !== "completed") return;
    const controller = new AbortController();
    fetch(`${API_BASE}/api/reports/${selected}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("报告加载失败");
        return r.json();
      })
      .then(setReport)
      .catch((e) => {
        if (e.name !== "AbortError")
          setReportError({ id: selected, message: "报告加载失败，请重试" });
      });
    return () => controller.abort();
  }, [selected, status, retry]);
  const retryLoading = () => {
    setError(null);
    setReportError(null);
    setLoading(true);
    setRetry((n) => n + 1);
  };
  const visible = tasks.filter((task) =>
    task.topic.toLowerCase().includes(query.toLowerCase()),
  );

  if (selected)
    return (
      <section className="result-width report-page">
        {report?.task_id !== selected && <div className="result-navigation">
          <Link href="/history" className="button button-ghost">
            <Icon name="chevron" className="back-icon" width="18" height="18" />
            研究历史
          </Link>
        </div>}
        {loading ? (
          <div className="status-line">
            <Spinner />
            正在加载报告…
          </div>
        ) : error ? (
          <div className="row">
            <p className="error-text" role="alert">
              {error}
            </p>
            <Button onClick={retryLoading}>重试</Button>
          </div>
        ) : !selectedTask ? (
          <p className="muted">未找到这条研究记录</p>
        ) : status !== "completed" ? (
          <div className="stack">
            <h1>{selectedTask.topic}</h1>
            <p className="muted">
              {status === "failed"
                ? "研究未完成，请新建研究重试。"
                : "研究尚未完成，报告暂不可用。"}
            </p>
            <div>
              <Link href="/" className="button button-secondary">
                新建研究
              </Link>
            </div>
          </div>
        ) : report?.task_id === selected ? (
          <HistoryReport
            key={report.task_id}
            report={report}
            onNewResearch={() => router.push("/")}
          />
        ) : reportError?.id === selected ? (
          <div className="row">
            <p className="error-text" role="alert">
              {reportError.message}
            </p>
            <Button onClick={retryLoading}>重试</Button>
          </div>
        ) : (
          <div className="status-line">
            <Spinner />
            正在加载报告…
          </div>
        )}
      </section>
    );

  return (
    <section className="result-width">
      <div className="history-heading">
        <div className="row spread">
          <h1>研究历史</h1>
          <Link href="/" className="button button-secondary">
            <Icon name="edit" width="18" height="18" />
            新建研究
          </Link>
        </div>
        <label className="history-search">
          <Icon name="search" width="18" height="18" />
          <input
            aria-label="搜索研究记录"
            placeholder="搜索研究记录"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="icon-button"
              aria-label="清除搜索"
              onClick={() => setQuery("")}
            >
              <Icon name="close" width="16" height="16" />
            </button>
          )}
        </label>
      </div>
      {loading ? (
        <div className="empty-state">
          <Spinner />
        </div>
      ) : error ? (
        <div className="empty-state" role="alert">
          <p className="error-text">{error}</p>
          <Button onClick={retryLoading}>重试</Button>
        </div>
      ) : !visible.length ? (
        <div className="empty-state">
          <Icon name={query ? "search" : "history"} width="28" height="28" />
          <p>{query ? "未找到相关记录" : "暂无记录"}</p>
          {!query && (
            <Link href="/" className="button button-secondary">
              新建研究
            </Link>
          )}
        </div>
      ) : (
        <div>
          {visible.map((task) => (
            <div className="history-item" key={task.task_id}>
              <Link
                className="history-row"
                href={`/history?task=${encodeURIComponent(task.task_id)}`}
              >
                <Icon name="file" width="20" height="20" className="muted" />
                <span className="history-topic">
                  <strong>{task.topic}</strong>
                  <span className="history-meta">
                    <span>
                      {new Date(task.created_at).toLocaleString("zh-CN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {task.total_steps > 0 && (
                      <span>
                        {task.current_step}/{task.total_steps} 步
                      </span>
                    )}
                  </span>
                </span>
                <span className={`history-status ${task.status}`}>
                  {labels[task.status] ?? task.status}
                </span>
                <Icon name="chevron" width="18" height="18" className="muted" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="result-width">
          <Spinner />
        </div>
      }
    >
      <HistoryContent />
    </Suspense>
  );
}
