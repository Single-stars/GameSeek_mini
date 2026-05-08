import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "GameSeek Mini",
  description: "12 题纯体验游戏推荐器"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, background: "#f4f0e8", color: "#201915" }}>{children}</body>
    </html>
  );
}
