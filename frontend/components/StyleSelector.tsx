"use client";
import { useRef, useState } from "react";
import { API_BASE } from "@/lib/api";
import { Button, Spinner } from "./ui";
const styles = [
  { id: "general", label: "通用" },
  { id: "academic", label: "学术" },
  { id: "popular_science", label: "科普" },
  { id: "news", label: "新闻" },
  { id: "social_media", label: "社交媒体" },
  { id: "strategic_investment", label: "投资分析" },
];
export function StyleSelector({
  taskId,
  currentStyle,
  currentMarkdown,
  onRestyled,
}: {
  taskId: string;
  currentStyle: string;
  currentMarkdown: string;
  onRestyled: (style: string, markdown: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const versions = useRef<Record<string, string>>({
    [currentStyle]: currentMarkdown,
  });
  const busy = useRef(false);
  const restyle = async (style: string, regenerate = false) => {
    if (busy.current || (style === currentStyle && !regenerate)) return;
    versions.current[currentStyle] = currentMarkdown;
    setError(null);
    if (!regenerate && versions.current[style] !== undefined) {
      onRestyled(style, versions.current[style]);
      return;
    }
    busy.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/artifacts/restyle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          locale: "zh-CN",
          style,
          regenerate,
        }),
      });
      if (!response.ok) throw new Error("切换失败，请重试");
      const data = await response.json();
      versions.current[style] = data.report_markdown;
      onRestyled(style, data.report_markdown);
    } catch (e) {
      setError(e instanceof Error ? e.message : "切换失败");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };
  return (
    <div>
      <div className="style-controls">
        <span className="control-label">报告风格</span>
        <div className="style-options" role="group" aria-label="报告风格">
          {styles.map((style) => (
            <Button
              key={style.id}
              variant="ghost"
              className="style-option"
              aria-pressed={currentStyle === style.id}
              disabled={loading}
              onClick={() => void restyle(style.id)}
            >
              {style.label}
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          disabled={loading}
          onClick={() => void restyle(currentStyle, true)}
        >
          重新生成
        </Button>
        {loading && (
          <span className="status-line">
            <Spinner />
            正在转换风格…
          </span>
        )}
      </div>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
