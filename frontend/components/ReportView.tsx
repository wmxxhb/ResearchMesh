"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Report } from "@/lib/types";
import { Button, Icon } from "./ui";
export function Markdown({ children }: { children: string }) {
  return (
    <article className="report-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="table-scroll">
              <table>{children}</table>
            </div>
          ),
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </article>
  );
}
export function ReportView({
  report,
  onNewResearch,
  onContentChange,
  toolbar,
}: {
  report: Report;
  onNewResearch: () => void;
  onContentChange: (content: string) => void;
  toolbar?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(report.content_markdown);
  const content = report.content_markdown;
  const [notice, setNotice] = useState("");
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([editing ? draft : content], {
        type: "text/markdown;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title || "report"}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice("已导出 Markdown");
  };
  return (
    <div className="stack">
      <div className="result-toolbar" aria-label="报告工具">
        {toolbar && <div className="result-tools">{toolbar}</div>}
        <div className="report-actions">
          <Button
            variant="ghost"
            onClick={() => {
              setDraft(content);
              setEditing(!editing);
              setNotice("");
            }}
          >
            <Icon name="edit" width="16" height="16" />
            {editing ? "退出编辑" : "编辑报告"}
          </Button>
          <Button variant="ghost" onClick={download}>
            <Icon name="download" width="16" height="16" />
            导出 Markdown
          </Button>
          <Button variant="ghost" onClick={onNewResearch}>
            <Icon name="file" width="16" height="16" />
            新建研究
          </Button>
          <div className="report-meta">
            <span>{report.sources_count} 个引用来源</span>
            <span>{Math.round(report.elapsed_seconds)} 秒</span>
            <span>¥{report.cost_rmb.toFixed(2)}</span>
          </div>
        </div>
      </div>
      {notice && (
        <p className="small muted" role="status">
          {notice}
        </p>
      )}
      {editing ? (
        <div className="stack">
          <label
            htmlFor={`report-editor-${report.task_id}`}
            className="small muted"
          >
            修改仅保留在当前页面，导出可保存到本地。
          </label>
          <textarea
            id={`report-editor-${report.task_id}`}
            className="report-editor"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="row">
            <Button
              variant="primary"
              onClick={() => {
                onContentChange(draft);
                setEditing(false);
                setNotice("修改已应用到本页");
              }}
            >
              完成编辑
            </Button>
            <Button
              onClick={() => {
                setDraft(content);
                setEditing(false);
              }}
            >
              取消
            </Button>
          </div>
        </div>
      ) : (
        <Markdown>{content}</Markdown>
      )}
    </div>
  );
}
