"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { questions } from "@/lib/gameseek/questions";
import type { AnswerMap } from "@/lib/gameseek/types";
import type { FollowUpQuestion } from "@/lib/gameseek/followupQuestions";

type Phase =
  | "answering_core"
  | "checking_followups"
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
  results?: unknown;
  recommendations?: unknown;
  needsFollowUp?: boolean;
  followUpQuestions?: unknown;
  diagnostic?: Diagnostic;
  error?: string;
};

const shellStyle = {
  maxWidth: 920,
  margin: "0 auto",
  padding: "40px 20px 72px",
  fontFamily: "Georgia, 'Noto Serif SC', serif",
} satisfies CSSProperties;

const cardStyle = {
  border: "2px solid #201915",
  borderRadius: 28,
  padding: 28,
  background: "#fffaf0",
  boxShadow: "10px 10px 0 #201915",
} satisfies CSSProperties;

const questionCardStyle = {
  marginTop: 28,
  padding: 26,
  background: "#fffdf7",
  border: "2px solid #201915",
  borderRadius: 24,
} satisfies CSSProperties;

const progressPill = {
  minWidth: 96,
  padding: "10px 16px",
  border: "2px solid #201915",
  borderRadius: 999,
  background: "#d7ff73",
  fontWeight: 900,
  textAlign: "center",
  whiteSpace: "nowrap",
} satisfies CSSProperties;

function readRecommendations(data: RecommendApiResponse) {
  const rows = Array.isArray(data.recommendations)
    ? data.recommendations
    : Array.isArray(data.results)
      ? data.results
      : null;

  if (!rows) {
    throw new Error("API 返回结构缺少 recommendations/results。");
  }

  return rows as ApiResult[];
}

function readFollowUpQuestions(data: RecommendApiResponse) {
  if (data.followUpQuestions == null) return [];
  if (!Array.isArray(data.followUpQuestions)) {
    throw new Error("API 返回的 followUpQuestions 格式不合法。");
  }

  for (const question of data.followUpQuestions) {
    if (!question || typeof question !== "object") {
      throw new Error("API 返回的追加问题格式不合法。");
    }
    const row = question as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.text !== "string") {
      throw new Error("API 返回的追加问题缺少 id/text。");
    }
    if (!Array.isArray(row.options) || row.options.length === 0) {
      throw new Error(`追加问题 ${row.id} 缺少 options。`);
    }
    for (const option of row.options) {
      if (!option || typeof option !== "object") {
        throw new Error(`追加问题 ${row.id} 的选项格式不合法。`);
      }
      const optionRow = option as Record<string, unknown>;
      if (typeof optionRow.id !== "string" || typeof optionRow.label !== "string") {
        throw new Error(`追加问题 ${row.id} 的选项缺少 id/label。`);
      }
    }
  }

  return data.followUpQuestions as FollowUpQuestion[];
}

function resultList(value: string[] | undefined) {
  return Array.isArray(value) && value.length > 0 ? value.join(" / ") : "暂无";
}

export default function HomePage() {
  const [coreQuestionIndex, setCoreQuestionIndex] = useState(0);
  const [followUpQuestionIndex, setFollowUpQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);
  const [recommendations, setRecommendations] = useState<ApiResult[]>([]);
  const [pendingInitialRecommendations, setPendingInitialRecommendations] = useState<ApiResult[] | null>(null);
  const [diagnostic, setDiagnostic] = useState<Diagnostic | undefined>();
  const [phase, setPhase] = useState<Phase>("answering_core");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [softNotice, setSoftNotice] = useState<string | null>(null);
  const [hasAnsweredFollowUps, setHasAnsweredFollowUps] = useState(false);

  const coreTotal = questions.length;
  const followUpTotal = followUpQuestions.length;
  const totalQuestionCount = coreTotal + followUpTotal;
  const currentCoreQuestion = phase === "answering_core" ? questions[coreQuestionIndex] : undefined;
  const currentFollowUpQuestion =
    phase === "answering_followups" ? followUpQuestions[followUpQuestionIndex] : undefined;

  const answeredCoreCount = useMemo(() => Object.keys(answers).length, [answers]);
  const allCoreAnswered = coreTotal > 0 && questions.every((question) => Boolean(answers[question.id]));
  const currentCoreAnswered = Boolean(currentCoreQuestion && answers[currentCoreQuestion.id]);
  const currentFollowUpAnswered = Boolean(currentFollowUpQuestion && followUpAnswers[currentFollowUpQuestion.id]);
  const isLastCoreQuestion = coreQuestionIndex === coreTotal - 1;
  const isLastFollowUpQuestion = followUpQuestionIndex === followUpTotal - 1;

  const progressLabel =
    phase === "checking_followups"
      ? "正在判断是否需要追加问题..."
      : phase === "answering_followups"
        ? `${coreTotal + followUpQuestionIndex + 1} / ${totalQuestionCount}`
        : phase === "answering_core"
          ? `${coreQuestionIndex + 1} / ${coreTotal}`
          : "";

  function resetQuestionnaire() {
    setCoreQuestionIndex(0);
    setFollowUpQuestionIndex(0);
    setAnswers({});
    setFollowUpAnswers({});
    setFollowUpQuestions([]);
    setRecommendations([]);
    setPendingInitialRecommendations(null);
    setDiagnostic(undefined);
    setPhase("answering_core");
    setErrorMessage(null);
    setSoftNotice(null);
    setHasAnsweredFollowUps(false);
  }

  function setCoreAnswer(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setErrorMessage(null);
  }

  function setFollowUpAnswer(questionId: string, optionId: string) {
    setFollowUpAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setErrorMessage(null);
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
      followUpQuestions: readFollowUpQuestions(data),
      diagnostic: data.diagnostic,
    };
  }

  async function checkFollowUps() {
    if (!allCoreAnswered) {
      setErrorMessage(`请先完成全部 ${coreTotal} 道核心问题，目前已回答 ${answeredCoreCount} 道。`);
      return;
    }

    setPhase("checking_followups");
    setErrorMessage(null);
    setSoftNotice(null);
    setFollowUpAnswers({});
    setFollowUpQuestions([]);
    setFollowUpQuestionIndex(0);
    setPendingInitialRecommendations(null);
    setHasAnsweredFollowUps(false);

    try {
      const data = await requestRecommendations({ answers });
      setPendingInitialRecommendations(data.recommendations);
      setDiagnostic(data.diagnostic);

      if (data.needsFollowUp && data.followUpQuestions.length > 0) {
        setFollowUpQuestions(data.followUpQuestions);
        setFollowUpQuestionIndex(0);
        setPhase("answering_followups");
        return;
      }

      if (data.needsFollowUp && data.followUpQuestions.length === 0) {
        setSoftNotice("系统没有返回追加问题，已直接生成推荐。");
      }

      setRecommendations(data.recommendations);
      setPhase("final_results");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "生成推荐失败。");
      setPhase("error");
    }
  }

  function goToNextCoreQuestion() {
    if (!currentCoreQuestion) {
      setErrorMessage("题目数据异常，请重新开始。");
      setPhase("error");
      return;
    }
    if (!answers[currentCoreQuestion.id]) {
      setErrorMessage("请先选择当前题的一个选项。");
      return;
    }
    if (isLastCoreQuestion) {
      void checkFollowUps();
      return;
    }
    setCoreQuestionIndex((index) => index + 1);
    setErrorMessage(null);
  }

  function goToPreviousCoreQuestion() {
    setCoreQuestionIndex((index) => Math.max(0, index - 1));
    setErrorMessage(null);
  }

  async function submitFollowUpAnswers() {
    if (!currentFollowUpQuestion) {
      setErrorMessage("追加问题数据异常，请重新开始。");
      setPhase("error");
      return;
    }
    if (!followUpAnswers[currentFollowUpQuestion.id]) {
      setErrorMessage("请先选择当前追加问题的一个选项。");
      return;
    }

    if (!isLastFollowUpQuestion) {
      setFollowUpQuestionIndex((index) => index + 1);
      setErrorMessage(null);
      return;
    }

    const allFollowUpsAnswered = followUpQuestions.every((question) => Boolean(followUpAnswers[question.id]));
    if (!allFollowUpsAnswered) {
      setErrorMessage("请先回答全部追加问题。");
      return;
    }

    setPhase("loading_final");
    setErrorMessage(null);
    setSoftNotice(null);

    try {
      const data = await requestRecommendations({ answers, followUpAnswers });
      setRecommendations(data.recommendations);
      setDiagnostic(data.diagnostic);
      setPendingInitialRecommendations(null);
      setHasAnsweredFollowUps(true);
      setPhase("final_results");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "生成最终推荐失败。");
      setPhase("error");
    }
  }

  function goToPreviousFollowUpQuestion() {
    setFollowUpQuestionIndex((index) => Math.max(0, index - 1));
    setErrorMessage(null);
  }

  const resultHint = hasAnsweredFollowUps
    ? "已根据你的核心答案和追加问题生成推荐。"
    : "已根据你的核心答案生成推荐。";

  if (coreTotal === 0) {
    return (
      <main style={shellStyle}>
        <section style={cardStyle}>
          <h1 style={{ marginTop: 0 }}>GameSeek Mini</h1>
          <p>题目数据异常：当前没有可用的核心问题。</p>
        </section>
      </main>
    );
  }

  return (
    <main style={shellStyle}>
      <section style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18 }}>
          <div>
            <p style={{ margin: 0, letterSpacing: 2, textTransform: "uppercase", fontSize: 12 }}>GameSeek Mini v0.4.2</p>
            <h1 style={{ fontSize: "clamp(42px, 8vw, 84px)", lineHeight: 0.9, margin: "12px 0 16px" }}>GameSeek Mini</h1>
            <p style={{ fontSize: 18, maxWidth: 700, lineHeight: 1.7, margin: 0 }}>
              回答几个问题，找到更适合你的游戏。系统会先判断大方向；如果几个相似游戏需要区分，会继续展示必答的追加问题。
            </p>
          </div>
          {progressLabel && (
            <div aria-label="答题进度" style={progressPill}>
              {progressLabel}
            </div>
          )}
        </div>
      </section>

      {phase === "answering_core" && currentCoreQuestion && (
        <section style={questionCardStyle}>
          <p style={{ margin: 0, fontWeight: 900, color: "#6b4f2c" }}>核心问题</p>
          <h2 style={{ fontSize: 28, margin: "10px 0 18px" }}>{currentCoreQuestion.prompt}</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {currentCoreQuestion.options.map((option) => {
              const checked = answers[currentCoreQuestion.id] === option.id;
              return (
                <label
                  key={option.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: 14,
                    border: checked ? "2px solid #201915" : "1px solid #d8c8ae",
                    borderRadius: 16,
                    background: checked ? "#ffe08a" : "#fffaf0",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name={currentCoreQuestion.id}
                    checked={checked}
                    onChange={() => setCoreAnswer(currentCoreQuestion.id, option.id)}
                    style={{ marginTop: 4 }}
                  />
                  <span>{option.text}</span>
                </label>
              );
            })}
          </div>
          {errorMessage && <p style={{ color: "#8a1f11", fontWeight: 800 }}>{errorMessage}</p>}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 24 }}>
            <button
              onClick={goToPreviousCoreQuestion}
              disabled={coreQuestionIndex === 0}
              style={{
                padding: "12px 18px",
                borderRadius: 999,
                border: "2px solid #201915",
                background: "#fffaf0",
                fontWeight: 800,
                cursor: coreQuestionIndex === 0 ? "not-allowed" : "pointer",
              }}
            >
              上一题
            </button>
            <button
              onClick={goToNextCoreQuestion}
              disabled={!currentCoreAnswered}
              style={{
                padding: "12px 20px",
                borderRadius: 999,
                border: "2px solid #201915",
                background: currentCoreAnswered ? "#201915" : "#d8c8ae",
                color: currentCoreAnswered ? "#fffaf0" : "#201915",
                fontWeight: 900,
                cursor: currentCoreAnswered ? "pointer" : "not-allowed",
              }}
            >
              {isLastCoreQuestion ? "检查是否需要追问" : "下一题"}
            </button>
          </div>
        </section>
      )}

      {phase === "checking_followups" && (
        <section style={questionCardStyle} aria-live="polite">
          <p style={{ margin: 0, fontWeight: 900, color: "#6b4f2c" }}>核心问题已完成</p>
          <h2 style={{ fontSize: 28, margin: "10px 0 12px" }}>正在判断是否需要追加问题...</h2>
          <p style={{ margin: 0, lineHeight: 1.7 }}>如果当前答案已经足够明确，会直接生成最终推荐；如果存在相似游戏混淆，会继续显示追加问题。</p>
        </section>
      )}

      {phase === "answering_followups" && currentFollowUpQuestion && (
        <section style={{ ...questionCardStyle, background: "#eef7ff" }}>
          <p style={{ margin: 0, fontWeight: 900, color: "#2b5a78" }}>追加问题</p>
          <p style={{ margin: "10px 0 0", lineHeight: 1.6 }}>为了更准，还需要回答几个追加问题。</p>
          <h2 style={{ fontSize: 28, margin: "14px 0 18px" }}>{currentFollowUpQuestion.text}</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {currentFollowUpQuestion.options.map((option) => {
              const checked = followUpAnswers[currentFollowUpQuestion.id] === option.id;
              return (
                <label
                  key={option.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: 14,
                    border: checked ? "2px solid #201915" : "1px solid #b8c7d8",
                    borderRadius: 16,
                    background: checked ? "#d7ff73" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name={currentFollowUpQuestion.id}
                    checked={checked}
                    onChange={() => setFollowUpAnswer(currentFollowUpQuestion.id, option.id)}
                    style={{ marginTop: 4 }}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
          {errorMessage && <p style={{ color: "#8a1f11", fontWeight: 800 }}>{errorMessage}</p>}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 24 }}>
            <button
              onClick={goToPreviousFollowUpQuestion}
              disabled={followUpQuestionIndex === 0}
              style={{
                padding: "12px 18px",
                borderRadius: 999,
                border: "2px solid #201915",
                background: "#fffaf0",
                fontWeight: 800,
                cursor: followUpQuestionIndex === 0 ? "not-allowed" : "pointer",
              }}
            >
              上一题
            </button>
            <button
              onClick={() => void submitFollowUpAnswers()}
              disabled={!currentFollowUpAnswered}
              style={{
                padding: "12px 20px",
                borderRadius: 999,
                border: "2px solid #201915",
                background: currentFollowUpAnswered ? "#201915" : "#d8c8ae",
                color: currentFollowUpAnswered ? "#fffaf0" : "#201915",
                fontWeight: 900,
                cursor: currentFollowUpAnswered ? "pointer" : "not-allowed",
              }}
            >
              {isLastFollowUpQuestion ? "生成推荐" : "下一题"}
            </button>
          </div>
        </section>
      )}

      {phase === "loading_final" && (
        <section style={questionCardStyle} aria-live="polite">
          <p style={{ margin: 0, fontWeight: 900, color: "#2b5a78" }}>追加问题已完成</p>
          <h2 style={{ fontSize: 28, margin: "10px 0 12px" }}>正在生成最终推荐...</h2>
          <p style={{ margin: 0, lineHeight: 1.7 }}>正在根据核心答案和追加问题重新排序相似游戏。</p>
        </section>
      )}

      {phase === "error" && (
        <section style={{ marginTop: 24, padding: 22, border: "2px solid #8a1f11", borderRadius: 18, background: "#ffe9df" }}>
          <h2 style={{ margin: "0 0 8px" }}>需要处理一个问题</h2>
          <p style={{ margin: "0 0 14px" }}>{errorMessage ?? "页面遇到了未知错误。"}</p>
          <button
            onClick={resetQuestionnaire}
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: "2px solid #201915",
              background: "#fffaf0",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            重新开始
          </button>
        </section>
      )}

      {phase === "final_results" && (
        <section style={{ marginTop: 42 }}>
          <h2 style={{ fontSize: 36, marginBottom: 8 }}>为你推荐</h2>
          <p style={{ marginTop: 0, lineHeight: 1.6 }}>{softNotice ?? resultHint}</p>
          {pendingInitialRecommendations && recommendations.length === 0 && (
            <p style={{ color: "#8a1f11", fontWeight: 800 }}>结果状态异常，请重新开始。</p>
          )}
          {diagnostic?.reason && (
            <p style={{ marginTop: 0, color: "#6b4f2c" }}>
              诊断：{diagnostic.reason}
              {diagnostic.topSubClusters?.length ? ` · ${diagnostic.topSubClusters.join(" / ")}` : ""}
            </p>
          )}
          {recommendations.map((result, index) => (
            <article
              key={result.id}
              style={{
                border: "2px solid #201915",
                borderRadius: 22,
                padding: 22,
                marginBottom: 18,
                background: index === 0 ? "#d7ff73" : "#fffdf7",
              }}
            >
              <p style={{ margin: 0, fontWeight: 800 }}>#{index + 1} · {result.cluster}</p>
              <h3 style={{ fontSize: 28, margin: "8px 0" }}>{result.title}</h3>
              <p style={{ margin: "0 0 8px" }}>分数：{result.score}</p>
              <p>匹配点：{resultList(result.matchedTags)}</p>
              {Array.isArray(result.blockedBy) && result.blockedBy.length > 0 && <p>可能冲突：{result.blockedBy.join(" / ")}</p>}
              {Array.isArray(result.explanation) && result.explanation.length > 0 && (
                <ul>
                  {result.explanation.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                </ul>
              )}
              <p>可能不适合：{resultList(result.notFor)}</p>
              <p>相似游戏：{resultList(result.similar)}</p>
            </article>
          ))}
          <button
            onClick={resetQuestionnaire}
            style={{
              marginTop: 10,
              padding: "12px 20px",
              borderRadius: 999,
              border: "2px solid #201915",
              background: "#201915",
              color: "#fffaf0",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            重新答题
          </button>
        </section>
      )}
    </main>
  );
}
