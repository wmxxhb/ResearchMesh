import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import "./globals.css";
export const metadata: Metadata = {
  title: "ResearchMesh",
  description: "研究主题、收集资料并生成报告",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const key='researchmesh-theme';const previous=Object.keys(localStorage).find(k=>k!==key&&k.endsWith('-theme'));const theme=localStorage.getItem(key)??(previous?localStorage.getItem(previous):null);if(theme==='dark'||theme==='light'){localStorage.setItem(key,theme);if(previous)localStorage.removeItem(previous)}document.documentElement.dataset.theme=theme==='dark'?'dark':'light'}catch{}`,
          }}
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
