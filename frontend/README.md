# ResearchMesh 前端

基于 Next.js 16 App Router、React 19、TypeScript 和 Tailwind CSS 4。字体使用系统无衬线字体栈，不再加载模板默认的 Google Geist 字体。

## 运行

在本目录执行：

```powershell
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3000
```

需要同时在项目根目录启动 Python 后端，详见 [项目说明](../README.md)。默认后端地址为 `http://localhost:8000`，可用 `NEXT_PUBLIC_API_URL` 配置。

## 页面与组件

- `app/page.tsx`：研究主题输入、SSE 进度和完成后的报告。
- `app/history/page.tsx`：记录搜索，以及通过 `?task=任务ID` 直接打开报告。
- `components/AppShell.tsx`：侧栏顶部 ResearchMesh 名称、最近研究、主题切换和手机导航抽屉，无独立顶栏。
- `components/ReportView.tsx`：吸顶工具栏、报告编辑、阅读和 Markdown 导出。
- `components/StyleSelector.tsx`：六种风格按钮及当前风格的重新生成操作。
- `components/ArtifactTools.tsx`：播客、PPT 的生成、弹窗阅读与下载。
- `components/Timeline.tsx`：可折叠的研究过程。
- `components/ui.tsx`：统一按钮、线性图标和加载指示。
- `app/globals.css`：统一设计 Token、明暗主题、正文排版和响应式布局。

风格切换复用已生成版本，工具栏不会随风格变化重建。后端持久化生成结果；只有显式点击“重新生成”才覆盖对应结果。报告编辑仅保留在当前页面，导出可以保存到本地。

PPT 功能当前生成并下载 Markdown 幻灯片内容，不直接导出 `.pptx`。

`app/favicon.ico` 是当前标签页图标；`next-env.d.ts`、`tsconfig.json`、`next.config.ts` 和 `postcss.config.mjs` 属于构建配置，应保留。
