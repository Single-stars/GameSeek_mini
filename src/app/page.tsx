"use client";

import { useMemo, useState } from "react";
import { questions } from "@/lib/gameseek/questions";
import type { AnswerMap } from "@/lib/gameseek/types";

type ApiResult = {
  id: string;
  title: string;
  cluster: string;
  score: number;
  matchedTags: string[];
  blockedBy: string[];
  explanation: string[];
  notFor: string[];
  similar: string[];
};

export default function HomePage() {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [results, setResults] = useState<ApiResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  async function submit() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
      });

      const data = await res.json();
      setResults(data.results);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "40px 20px 72px", fontFamily: "Georgia, 'Noto Serif SC', serif" }}>
      <section style={{ border: "2px solid #201915", borderRadius: 28, padding: 28, background: "#fffaf0", boxShadow: "10px 10px 0 #201915" }}>
        <p style={{ margin: 0, letterSpacing: 2, textTransform: "uppercase", fontSize: 12 }}>GameSeek Mini v0</p>
        <h1 style={{ fontSize: "clamp(42px, 8vw, 84px)", lineHeight: 0.9, margin: "12px 0 16px" }}>纯体验游戏推荐器</h1>
        <p style={{ fontSize: 18, maxWidth: 680, lineHeight: 1.7, margin: 0 }}>回答 12 个固定问题，只根据游戏体验标签推荐 6 款游戏。当前版本不考虑平台、价格、中文、输入方式。</p>
        <p style={{ marginTop: 18, fontWeight: 700 }}>已回答：{answeredCount} / {questions.length}</p>
      </section>

      <section style={{ marginTop: 32 }}>
        {questions.map((q, index) => (
          <article key={q.id} style={{ marginBottom: 22, padding: 22, background: "#fffdf7", border: "1px solid #d8c8ae", borderRadius: 20 }}>
            <h2 style={{ fontSize: 22, margin: "0 0 16px" }}>{index + 1}. {q.prompt}</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {q.options.map(o => {
                const checked = answers[q.id] === o.id;
                return (
                  <label key={o.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 12, border: checked ? "2px solid #201915" : "1px solid #d8c8ae", borderRadius: 14, background: checked ? "#ffe08a" : "#fffaf0", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name={q.id}
                      checked={checked}
                      onChange={() => setAnswers(prev => ({ ...prev, [q.id]: o.id }))}
                      style={{ marginTop: 4 }}
                    />
                    <span>{o.text}</span>
                  </label>
                );
              })}
            </div>
          </article>
        ))}
      </section>

      <button
        onClick={submit}
        disabled={isLoading}
        style={{ width: "100%", padding: "18px 24px", borderRadius: 999, border: "2px solid #201915", background: "#201915", color: "#fffaf0", fontSize: 20, fontWeight: 800, cursor: isLoading ? "wait" : "pointer" }}
      >
        {isLoading ? "生成中..." : "生成推荐"}
      </button>

      {results.length > 0 && (
        <section style={{ marginTop: 42 }}>
          <h2 style={{ fontSize: 34, marginBottom: 18 }}>推荐结果</h2>
          {results.map((r, index) => (
            <article key={r.id} style={{ border: "2px solid #201915", borderRadius: 22, padding: 22, marginBottom: 18, background: index === 0 ? "#d7ff73" : "#fffdf7" }}>
              <p style={{ margin: 0, fontWeight: 800 }}>#{index + 1} · {r.cluster}</p>
              <h3 style={{ fontSize: 28, margin: "8px 0" }}>{r.title}</h3>
              <p style={{ margin: "0 0 8px" }}>分数：{r.score}</p>
              <p>匹配点：{r.matchedTags.length > 0 ? r.matchedTags.join(" / ") : "暂无显式匹配标签"}</p>
              {r.blockedBy.length > 0 && <p>可能冲突：{r.blockedBy.join(" / ")}</p>}
              <ul>
                {r.explanation.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
              <p>可能不适合：{r.notFor.join("；")}</p>
              <p>相似游戏：{r.similar.join(" / ")}</p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
