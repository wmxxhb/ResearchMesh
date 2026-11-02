"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { createResearch, getReport, subscribeToEvents } from "@/lib/api";
import { ReportView } from "@/components/ReportView";
import { Timeline } from "@/components/Timeline";
import { StyleSelector } from "@/components/StyleSelector";
import { ArtifactTools } from "@/components/ArtifactTools";
import { Button, Icon, Spinner } from "@/components/ui";
import type { ResearchPlan, Report } from "@/lib/types";
type UIState =
  "input" | "loading" | "researching" | "generating" | "completed" | "error";
export default function Home() {
  const [uiState, setUiState] = useState<UIState>("input");
  const [topic, setTopic] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [plan, setPlan] = useState<ResearchPlan | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [reportStyle, setReportStyle] = useState("general");
  const [events, setEvents] = useState<
    { type: string; data: Record<string, unknown>; time: number }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const stream = useRef<(() => void) | null>(null);
  const generation = useRef(0);
  const submitting = useRef(false);
  const handleReset = useCallback(() => {
    generation.current += 1;
    submitting.current = false;
    stream.current?.();
    stream.current = null;
    setUiState("input");
    setTopic("");
    setTaskId(null);
    setPlan(null);
    setReport(null);
    setEvents([]);
    setError(null);
    setCurrentStep(0);
    setTotalSteps(0);
    setReportStyle("general");
  }, []);
  useEffect(() => {
    window.addEventListener("researchmesh:new", handleReset);
    return () => {
      window.removeEventListener("researchmesh:new", handleReset);
      generation.current += 1;
      stream.current?.();
    };
  }, [handleReset]);
  const handleSubmit = async () => {
    if (!topic.trim() || submitting.current) return;
    submitting.current = true;
    const run = ++generation.current;
    stream.current?.();
    setUiState("loading");
    setError(null);
    setEvents([]);
    setReport(null);
    setPlan(null);
    const fail = (e: unknown) => {
      if (run !== generation.current) return;
      setError(e instanceof Error ? e.message : String(e));
      setUiState("error");
      submitting.current = false;
      stream.current?.();
    };
    try {
      const task = await createResearch(topic.trim());
      if (run !== generation.current) return;
      setTaskId(task.task_id);
      window.dispatchEvent(new Event("researchmesh:updated"));
      stream.current = subscribeToEvents(
        task.task_id,
        (type, data) => {
          if (run !== generation.current) return;
          setEvents((prev) => [...prev, { type, data, time: Date.now() }]);
          if (type === "planner.completed") {
            setPlan((data.plan ?? data) as unknown as ResearchPlan);
            setTotalSteps(Number(data.steps_count ?? 0));
            setUiState("researching");
          }
          if (type === "research.started") {
            setUiState("researching");
            if (data.total_steps) setTotalSteps(Number(data.total_steps));
          }
          if (type === "step.started") {
            setCurrentStep(Number(data.step_index ?? 0));
            if (data.total_steps) setTotalSteps(Number(data.total_steps));
          }
          if (type === "report.started") setUiState("generating");
          if (type === "report.completed") {
            stream.current?.();
            getReport(task.task_id)
              .then((result: Report) => {
                if (run !== generation.current) return;
                setReport(result);
                setUiState("completed");
                submitting.current = false;
                window.dispatchEvent(new Event("researchmesh:updated"));
              })
              .catch(fail);
          }
          if (type === "error.fatal") fail(data.message ?? "研究失败，请重试");
        },
        () => {
          /* EventSource reconnects automatically while the task is active. */
        },
      );
    } catch (e) {
      fail(e);
    }
  };
  return uiState === "input" ? (
    <section className="home-empty" aria-labelledby="research-title">
      <h1 id="research-title">你想研究什么？</h1>
      <div>
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            aria-label="研究主题"
            placeholder="输入研究主题或具体问题"
            rows={3}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
          />
          <div className="composer-toolbar">
            <Button
              type="submit"
              variant="primary"
              className="submit-button"
              disabled={!topic.trim()}
              aria-label="开始研究"
              title="开始研究"
            >
              <Icon name="arrow" />
            </Button>
          </div>
        </form>
      </div>
    </section>
  ) : (
    <section
      className={`${uiState === "completed" ? "result-width report-page" : "reading-width"} stack`}
    >
      {uiState !== "completed" && <div className="topic-bubble">{topic}</div>}
      {uiState === "error" ? (
        <div className="stack" role="alert">
          <div className="research-heading">
            <Icon name="alert" />
            <h2>研究失败</h2>
          </div>
          <p className="error-text">{error}</p>
          <div>
            <Button onClick={handleReset}>重新开始</Button>
          </div>
        </div>
      ) : null}
      {uiState === "loading" && (
        <div className="status-line" role="status">
          <Spinner />
          正在分析主题并制定研究计划…
        </div>
      )}
      {(uiState === "researching" || uiState === "generating") && (
        <div>
          <div className="research-heading">
            <span className="research-mark">
              <Icon name="globe" width="18" height="18" />
            </span>
            <h2>{plan?.title ?? "研究计划"}</h2>
          </div>
          {plan && (
            <ol className="plan-list">
              {plan.steps.map((step, i) => {
                const done = events.some(
                  (event) =>
                    event.type === "step.completed" &&
                    Number(event.data.step_index) === i + 1,
                );
                return (
                  <li
                    className={`plan-step ${i + 1 === currentStep && !done ? "current" : ""}`}
                    key={i}
                  >
                    <span className="step-number">
                      {done ? (
                        <Icon name="check" width="14" height="14" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span className="step-title">{step.title}</span>
                    <span className="step-type">
                      {step.need_search ? "搜索" : "计算"}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
          <div className="status-line" role="status">
            <Spinner />
            {uiState === "generating"
              ? "正在整理资料，撰写报告…"
              : currentStep
                ? `正在执行第 ${currentStep} / ${totalSteps} 步`
                : "正在准备研究…"}
          </div>
        </div>
      )}
      {uiState === "completed" && report && taskId && (
        <>
          <ReportView
            key={taskId}
            report={report}
            onNewResearch={handleReset}
            toolbar={
              <>
                <StyleSelector
                  taskId={taskId}
                  currentStyle={reportStyle}
                  currentMarkdown={report.content_markdown}
                  onRestyled={(style, markdown) => {
                    setReportStyle(style);
                    setReport({ ...report, content_markdown: markdown });
                  }}
                />
                <ArtifactTools taskId={taskId} />
              </>
            }
            onContentChange={(content) =>
              setReport({ ...report, content_markdown: content })
            }
          />
        </>
      )}
      <Timeline events={events} />
    </section>
  );
}
