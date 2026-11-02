"use client";
import { useRef, useState } from "react";
import { API_BASE } from "@/lib/api";
import { Button, Icon, Spinner } from "./ui";
import { Markdown } from "./ReportView";

type ArtifactType = "podcast" | "ppt";
type Artifact = { content: string; title: string };
export function ArtifactTools({ taskId }: { taskId: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<ArtifactType>("podcast");
  const [generating, setGenerating] = useState<ArtifactType | null>(null);
  const [results, setResults] = useState<
    Partial<Record<ArtifactType, Artifact>>
  >({});
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const result = results[active];
  const generate = async (type: ArtifactType, regenerate = false) => {
    if (busy.current) return;
    busy.current = true;
    setGenerating(type);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/artifacts/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId, locale: "zh-CN", regenerate }),
      });
      if (!response.ok) throw new Error("生成失败，请重试");
      const data = await response.json();
      setResults((current) => ({
        ...current,
        [type]: {
          content: type === "podcast" ? data.display : data.slides_markdown,
          title:
            type === "podcast"
              ? data.script?.title || "播客脚本"
              : "PPT 幻灯片",
        },
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
    } finally {
      busy.current = false;
      setGenerating(null);
    }
  };
  const open = (type: ArtifactType) => {
    setActive(type);
    setError(null);
    dialog.current?.showModal();
    if (!results[type]) void generate(type);
  };
  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(
      new Blob([result.content], { type: "text/markdown;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = active === "podcast" ? "podcast_script.md" : "presentation.md";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <div className="artifact-actions" role="group" aria-label="生成内容">
        <Button disabled={!!generating} onClick={() => open("podcast")}>
          {generating === "podcast" ? (
            <Spinner />
          ) : (
            <Icon name="mic" width="18" height="18" />
          )}
          播客脚本
        </Button>
        <Button disabled={!!generating} onClick={() => open("ppt")}>
          {generating === "ppt" ? (
            <Spinner />
          ) : (
            <Icon name="slides" width="18" height="18" />
          )}
          PPT 幻灯片
        </Button>
      </div>
      <dialog
        ref={dialog}
        className="artifact-dialog"
        aria-labelledby={`artifact-title-${taskId}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <div className="artifact-dialog-content">
          <header className="artifact-dialog-header">
            <h2 id={`artifact-title-${taskId}`}>
              {result?.title ??
                (active === "podcast" ? "播客脚本" : "PPT 幻灯片")}
            </h2>
            <div className="row">
              {result && !generating && (
                <>
                  <Button onClick={() => void generate(active, true)}>
                    重新生成
                  </Button>
                  <Button onClick={download}>
                    <Icon name="download" width="18" height="18" />
                    下载
                  </Button>
                </>
              )}
              <button
                className="icon-button"
                aria-label="关闭生成内容"
                onClick={() => dialog.current?.close()}
              >
                <Icon name="close" />
              </button>
            </div>
          </header>
          <div className="artifact-dialog-body">
            {generating ? (
              <div className="status-line" role="status">
                <Spinner />
                正在生成{active === "podcast" ? "播客脚本" : "PPT 幻灯片"}…
              </div>
            ) : error ? (
              <div className="stack">
                <p className="error-text" role="alert">
                  {error}
                </p>
                <div>
                  <Button onClick={() => void generate(active, true)}>
                    重试
                  </Button>
                </div>
              </div>
            ) : result ? (
              <Markdown>{result.content}</Markdown>
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
