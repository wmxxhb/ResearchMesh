# ResearchMesh 开发说明

## 项目现状

ResearchMesh 是本地 AI 深度研究应用。界面、命令行、API、数据库和内部事件统一使用 ResearchMesh 命名；内部事件前缀为 `researchmesh:`，主题存储键为 `researchmesh-theme`。

## 运行与配置

所有 Python 入口从项目根目录运行。Windows 使用 `.venv/Scripts/python.exe`。

```powershell
# 安装完整后端依赖，包含 CLI 所需依赖
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
# 启动后端
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
# 在 frontend 目录运行前端
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3000
```

`.env` 位于根目录，由 `cli/config.py` 加载。必需配置为 `DEEPSEEK_API_KEY`、`TAVILY_API_KEY`，可选备用配置为 `DASHSCOPE_API_KEY`、`SERPAPI_API_KEY`。模型分配由 `PLANNER_MODEL`、`RESEARCHER_MODEL`、`REPORTER_MODEL`、`REPORTER_FALLBACK_MODEL` 控制。修改后重启后端。不要输出密钥或覆盖已有配置。

## 后端结构

- `backend/app/main.py`：FastAPI 入口，启动时初始化 SQLite 表。
- `backend/app/services/research.py`：网页研究任务自动执行计划、检索或计算、报告生成，通过 SSE 发布进度。
- `backend/app/api/routes/`：研究记录、事件流、报告下载、风格转换、播客、PPT 和文本操作 API。
- `backend/app/core/db.py`：SQLite 持久化，使用 WAL。
- `backend/researchmesh.db`：研究任务、步骤、原始报告与生成结果，不能当作缓存随意删除。
- `generated_outputs` 表按任务、内容类型、语言、风格保存生成结果。生成 API 默认复用已有内容；`regenerate: true` 才覆盖对应结果。失败或空结果不应覆盖已有有效结果。
- 通用风格在尚无独立生成版本时直接返回原始报告。
- `cli/agents/`：模型调用与 Agent 实现；网页和 CLI 复用这些模块。
- `cli/state_machine.py`：命令行流程，与网页后台任务编排入口不同。

`need_search=true` 的步骤进入 Researcher，`false` 进入 Coder。代码执行工具在 `cli/tools/sandbox.py`，支持子进程及 Docker 模式。

提示词位于 `prompts/`，按 `{agent}@v{version}.md` 命名。由 `cli/agents/prompt_loader.py` 加载；成果物提示词在 `prompts/artifacts/`。这些是运行依赖。

## 前端结构与界面约定

遵守 `frontend/AGENTS.md` 中的 Next.js 版本说明。

- `app/page.tsx`：新建研究、SSE 进度和完成后的报告。
- `app/history/page.tsx`：历史列表；`?task=任务ID` 直接展示独立报告页，不使用列表内嵌套展开。
- `components/AppShell.tsx`：侧栏顶部显示 ResearchMesh、主导航、最近研究、主题按钮和手机抽屉。没有独立顶栏。
- `components/ReportView.tsx`：报告阅读和编辑，顶部工具栏吸附到页面顶端；导出 Markdown。
- `components/StyleSelector.tsx`：六种风格直接显示为按钮，保留已生成版本。
- `components/ArtifactTools.tsx`：播客和 PPT 按钮，内容在原生 dialog 中展示、下载。当前 PPT 输出为 Markdown，不是 `.pptx`。
- `components/Timeline.tsx`：折叠的研究过程；`components/ui.tsx` 提供统一基础控件。
- `lib/api.ts`：后端地址，默认 `http://localhost:8000`，支持 `NEXT_PUBLIC_API_URL`。
- `app/globals.css`：统一颜色、字号、间距、圆角等设计 Token；浅色优先，兼容深色。

界面使用克制的中性色、系统无衬线字体和一致的线性图标，不加入渐变、Emoji 功能图标、营销文案、示例主题或无意义标签。结果区域加宽、正文放大，风格、成果物、编辑和导出操作直接可见。

报告正文由父组件持有，风格切换时不要通过变化的 React key 重建整个 ReportView 或工具栏，否则会清掉风格与成果物状态。报告编辑目前只影响当前页面，导出用于本地保存，不要声称已写回数据库。

## 辅助内容

`evals/` 是可选的模型评测工具，会调用真实 Agent。`output/`、`runs/` 为命令行运行输出；`.local/` 为本地日志等辅助文件。`.next/` 和 `node_modules/` 为当前前端构建缓存与依赖，不属于旧版源码副本。

本地任务按用户要求控制修改范围，不擅自触发付费生成、评测或扩大检查。保留 LICENSE 中的上游 MIT 许可和版权声明。
