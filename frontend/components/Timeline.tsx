"use client";
interface TimelineEvent {
  type: string;
  data: Record<string, unknown>;
  time: number;
}
const labels: Record<string, string> = {
  "coordinator.started": "分析主题",
  "planner.completed": "计划已生成",
  "research.started": "开始研究",
  "step.started": "执行步骤",
  "step.completed": "步骤完成",
  "report.started": "撰写报告",
  "report.completed": "报告已完成",
  "error.fatal": "研究失败",
};
export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) return null;
  return (
    <details className="timeline">
      <summary>研究过程 · {events.length} 条记录</summary>
      <ol className="timeline-list">
        {events.map((event, i) => (
          <li key={i}>
            <span className="timeline-dot" />
            <div>
              <span
                className={event.type === "error.fatal" ? "error-text" : ""}
              >
                {labels[event.type] ?? event.type}
              </span>
              <time>
                +{Math.round((event.time - events[0].time) / 1000)} 秒
              </time>
              <p className="timeline-detail">
                {event.type === "step.started" &&
                  `步骤 ${event.data.step_index}：${event.data.title}`}
                {event.type === "step.completed" &&
                  `步骤 ${event.data.step_index} · ${event.data.sources_count} 个来源`}
                {event.type === "planner.completed" &&
                  `${event.data.steps_count} 个研究步骤`}
                {event.type === "report.completed" &&
                  `${event.data.sources_count} 个来源`}
                {event.type === "error.fatal" && String(event.data.message)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </details>
  );
}
