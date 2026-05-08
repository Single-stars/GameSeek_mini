"use client";

import { useMemo, useState } from "react";
import { questions } from "@/lib/gameseek/questions";
import type { AnswerMap } from "@/lib/gameseek/types";
import type { FollowUpQuestion } from "@/lib/gameseek/followupQuestions";

type Phase =
  | "answering_core"
  | "loading_initial"
  | "initial_results"
  | "answering_followups"
  | "loading_final"
  | "final_results"
  | "error";

type ApiResult = {
  id: string;
  title: string;
  cluster: string;
  primarySubCluster?: string;
  secondarySubClusters?: string[];
  score: number;
  matchedTags: string[];
  blockedBy: string[];
  explanation: string[];
  notFor: string[];
  similar: string[];
};

type Diagnostic = {
  topCluster?: string;
  topSubClusters?: string[];
  reason?: string;
};

type RecommendApiResponse = {
  results?: ApiResult[];
  recommendations?: ApiResult[];
  needsFollowUp?: boolean;
  followUpQuestions?: FollowUpQuestion[];
  diagnostic?: Diagnostic;
  error?: string;
};

const shellStyle = {
  maxWidth: 920,
  margin: "0 auto",
  padding: "40px 20px 72px",
  fontFamily: "Georgia, 'Noto Serif SC', serif",
} satisfies React.CSSProperties;

const cardStyle = {
  border: "2px solid #201915",
  borderRadius: 28,
  padding: 28,
  background: "#fffaf0",
  boxShadow: "10px 10px 0 #201915",
} satisfies React.CSSProperties;

function readRecommendations(data: RecommendApiResponse) {
  const rows = Array.isArray(data.recommendations)
    ? data.recommendations
    : Array.isArray(data.results)
      ? data.results
      : null;

  if (!rows) {
    throw new Error("API 返回结构缺少 recommendations/results。");
  }

  return rows;
}

export default function HomePage() {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});
  const [recommendations, setRecommendations] = useState<ApiResult[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);
  const [needsFollowUp, setNeedsFollowUp] = useState(false);
  const [diagnostic, setDiagnostic] = useState<Diagnostic | undefined>();
  const [phase, setPhase] = useState<Phase>("answering_core");
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSubmittedFollowUps, setHasSubmittedFollowUps] = useState(false);
  const [hasSkippedFollowUps, setHasSkippedFollowUps] = useState(false);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const allCoreAnswered = answeredCount === questions.length;
  const allFollowUpsAnswered =
    followUpQuestions.length > 0 &&
    followUpQuestions.every((question) => Boolean(followUpAnswers[question.id]));

  function setCoreAnswer(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    if (phase !== "answering_core") {
      setPhase("answering_core");
      setRecommendations([]);
      setFollowUpQuestions([]);
      setFollowUpAnswers({});
      setNeedsFollowUp(false);
      setDiagnostic(undefined);
      setErrorMessage("");
      setHasSubmittedFollowUps(false);
      setHasSkippedFollowUps(false);
    }
  }

  async function requestRecommendations(payload: { answers: AnswerMap; followUpAnswers?: Record<string, string> }) {
    const response = await fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let data: RecommendApiResponse;
    try {
      data = await response.json();
    } catch {
      throw new Error("API 返回了无法解析的 JSON。");
    }

    if (!response.ok) {
      throw new Error(data.error || `API 请求失败：HTTP ${response.status}`);
    }

    return {
      recommendations: readRecommendations(data),
      needsFollowUp: Boolean(data.needsFollowUp),
      followUpQuestions: Array.isArray(data.followUpQuestions) ? data.followUpQuestions : [],
      diagnostic: data.diagnostic,
    };
  }

  async function submitCoreAnswers() {
    if (!allCoreAnswered) {
      setErrorMessage(`请先完成全部 ${questions.length} 道核心题，目前已回答 ${answeredCount} 道。`);
      setPhase("error");
      return;
    }

    setPhase("loading_initial");
    setErrorMessage("");
    setFollowUpAnswers({});
    setHasSubmittedFollowUps(false);
    setHasSkippedFollowUps(false);

    try {
      const data = await requestRecommendations({ answers });
      setRecommendations(data.recommendations);
      setNeedsFollowUp(data.needsFollowUp);
      setFollowUpQuestions(data.followUpQuestions);
      setDiagnostic(data.diagnostic);

      if (data.needsFollowUp && data.followUpQuestions.length === 0) {
        throw new Error("API 表示需要追问，但没有返回 followUpQuestions。");
      }

      setPhase(data.needsFollowUp && data.followUpQuestions.length > 0 ? "answering_followups" : "final_results");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "生成推荐失败。");
      setPhase("error");
    }
  }

  async function submitFollowUpAnswers() {
    if (!allFollowUpsAnswered) {
      setErrorMessage("请先回答全部追问题，或选择跳过追问。");
      setPhase("error");
      return;
    }

    setPhase("loading_final");
    setErrorMessage("");

    try {
      const data = await requestRecommendations({ answers, followUpAnswers });
      setRecommendations(data.recommendations);
      setNeedsFollowUp(false);
      setFollowUpQuestions([]);
      setDiagnostic(data.diagnostic);
      setHasSubmittedFollowUps(true);
      setHasSkippedFollowUps(false);
      setPhase("final_results");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "优化推荐失败。");
      setPhase("error");
    }
  }

  function skipFollowUps() {
    setHasSubmittedFollowUps(false);
    setHasSkippedFollowUps(true);
    setPhase("final_results");
  }

  function returnFromError() {
    setPhase(followUpQuestions.length > 0 && recommendations.length > 0 ? "answering_followups" : "answering_core");
  }

  const isLoading = phase === "loading_initial" || phase === "loading_final";
  const showingInitial = phase === "answering_followups";
  const showingResults = recommendations.length > 0 && (showingInitial || phase === "final_results");
  const resultTitle = showingInitial ? "初步推荐" : "推荐结果";
  const resultHint = showingInitial
    ? "下面是根据核心问卷得到的初步结果。回答追问后会进一步优化排序。"
    : hasSubmittedFollowUps
      ? "已根据你的追问答案优化排序。"
      : hasSkippedFollowUps
        ? "已跳过追问，展示初步推荐结果。"
        : "下面是根据核心问卷得到的推荐结果。";

  return (
    <main style={shellStyle}>
      <section style={cardStyle}>
        <p style={{ margin: 0, letterSpacing: 2, textTransform: "uppercase", fontSize: 12 }}>GameSeek Mini v0.4.2</p>
        <h1 style={{ fontSize: "clamp(42px, 8vw, 84px)", lineHeight: 0.9, margin: "12px 0 16px" }}>纯体验游戏推荐器</h1>
        <p style={{ fontSize: 18, maxWidth: 700, lineHeight: 1.7, margin: 0 }}>
          回答 12 个核心问题后，系统会先给出推荐。如果结果里出现相似游戏混淆，会再追问 1 到 3 个问题，用来微调排序。
        </p>
        <p style={{ marginTop: 18, fontWeight: 700 }}>已回答：{answeredCount} / {questions.length}</p>
      </section>

      {phase === "error" && (
        <section style={{ marginTop: 24, padding: 18, border: "2px solid #8a1f11", borderRadius: 18, background: "#ffe9df" }}>
          <h2 style={{ margin: "0 0 8px" }}>需要处理一个问题</h2>
          <p style={{ margin: "0 0 14px" }}>{errorMessage}</p>
          <button
            onClick={returnFromError}
            style={{ padding: "10px 16px", borderRadius: 999, border: "2px solid #201915", background: "#fffaf0", fontWeight: 800, cursor: "pointer" }}
          >
            返回继续
          </button>
        </section>
      )}

      <section style={{ marginTop: 32 }}>
        {questions.map((question, index) => (
          <article key={question.id} style={{ marginBottom: 22, padding: 22, background: "#fffdf7", border: "1px solid #d8c8ae", borderRadius: 20 }}>
            <h2 style={{ fontSize: 22, margin: "0 0 16px" }}>
              {index + 1}. {question.prompt}
            </h2>
            <div style={{ display: "grid", gap: 10 }}>
              {question.options.map((option) => {
                const checked = answers[question.id] === option.id;
                return (
                  <label
                    key={option.id}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      padding: 12,
                      border: checked ? "2px solid #201915" : "1px solid #d8c8ae",
                      borderRadius: 14,
                      background: checked ? "#ffe08a" : "#fffaf0",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      checked={checked}
                      onChange={() => setCoreAnswer(question.id, option.id)}
                      style={{ marginTop: 4 }}
                    />
                    <span>{option.text}</span>
                  </label>
                );
              })}
            </div>
          </article>
        ))}
      </section>

      <button
        onClick={submitCoreAnswers}
        disabled={isLoading}
        style={{ width: "100%", padding: "18px 24px", borderRadius: 999, border: "2px solid #201915", background: "#201915", color: "#fffaf0", fontSize: 20, fontWeight: 800, cursor: isLoading ? "wait" : "pointer" }}
      >
        {phase === "loading_initial" ? "正在生成推荐..." : "生成推荐"}
      </button>

      {showingResults && (
        <section style={{ marginTop: 42 }}>
          <h2 style={{ fontSize: 34, marginBottom: 8 }}>{resultTitle}</h2>
          <p style={{ marginTop: 0, lineHeight: 1.6 }}>{resultHint}</p>
          {diagnostic?.reason && (
            <p style={{ marginTop: 0, color: "#6b4f2c" }}>
              诊断：{diagnostic.reason}
              {diagnostic.topSubClusters?.length ? ` · ${diagnostic.topSubClusters.join(" / ")}` : ""}
            </p>
          )}
          {recommendations.map((result, index) => (
            <article key={result.id} style={{ border: "2px solid #201915", borderRadius: 22, padding: 22, marginBottom: 18, background: index === 0 ? "#d7ff73" : "#fffdf7" }}>
              <p style={{ margin: 0, fontWeight: 800 }}>#{index + 1} · {result.cluster}</p>
              <h3 style={{ fontSize: 28, margin: "8px 0" }}>{result.title}</h3>
              <p style={{ margin: "0 0 8px" }}>分数：{result.score}</p>
              <p>匹配点：{result.matchedTags.length > 0 ? result.matchedTags.join(" / ") : "暂无显式匹配标签"}</p>
              {result.blockedBy.length > 0 && <p>可能冲突：{result.blockedBy.join(" / ")}</p>}
              <ul>
                {result.explanation.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
              </ul>
              <p>可能不适合：{result.notFor.join("；")}</p>
              <p>相似游戏：{result.similar.join(" / ")}</p>
            </article>
          ))}
        </section>
      )}

      {phase === "answering_followups" && needsFollowUp && followUpQuestions.length > 0 && (
        <section style={{ marginTop: 34, padding: 24, border: "2px solid #201915", borderRadius: 24, background: "#eef7ff" }}>
          <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>为了更准，再回答几个追问题</h2>
          <p style={{ marginTop: 0, lineHeight: 1.6 }}>
            你的答案指向了几个相似游戏方向。回答下面的问题后，我会重新排序推荐结果。
          </p>

          {followUpQuestions.map((question, index) => (
            <article key={question.id} style={{ marginTop: 18, padding: 18, border: "1px solid #b8c7d8", borderRadius: 18, background: "#fafdff" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 21 }}>
                {index + 1}. {question.text}
              </h3>
              <div style={{ display: "grid", gap: 10 }}>
                {question.options.map((option) => {
                  const checked = followUpAnswers[question.id] === option.id;
                  return (
                    <label
                      key={option.id}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        padding: 12,
                        border: checked ? "2px solid #201915" : "1px solid #b8c7d8",
                        borderRadius: 14,
                        background: checked ? "#d7ff73" : "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        checked={checked}
                        onChange={() => setFollowUpAnswers((prev) => ({ ...prev, [question.id]: option.id }))}
                        style={{ marginTop: 4 }}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </article>
          ))}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22 }}>
            <button
              onClick={submitFollowUpAnswers}
              disabled={!allFollowUpsAnswered}
              style={{
                padding: "14px 20px",
                borderRadius: 999,
                border: "2px solid #201915",
                background: allFollowUpsAnswered ? "#201915" : "#d8c8ae",
                color: allFollowUpsAnswered ? "#fffaf0" : "#201915",
                fontWeight: 800,
                cursor: allFollowUpsAnswered ? "pointer" : "not-allowed",
              }}
            >
              优化推荐
            </button>
            <button
              onClick={skipFollowUps}
              style={{ padding: "14px 20px", borderRadius: 999, border: "2px solid #201915", background: "#fffaf0", fontWeight: 800, cursor: "pointer" }}
            >
              跳过追问，查看初步结果
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
