import { NextRequest, NextResponse } from "next/server";
import { rankAll } from "@/lib/gameseek/scoring";
import { rankAllWithFollowUps } from "@/lib/gameseek/followupScoring";
import { selectFollowUpQuestions, getFollowUpDiagnostic } from "@/lib/gameseek/followupSelector";
import { validateFollowUpAnswerMap } from "@/lib/gameseek/followupQuestions";
import { validateAnswerMap } from "@/lib/gameseek/validateAnswers";

function toResult(r: ReturnType<typeof rankAll>[number]) {
  return {
    id: r.game.id,
    title: r.game.title,
    cluster: r.game.cluster,
    primarySubCluster: r.game.primarySubCluster,
    secondarySubClusters: r.game.secondarySubClusters,
    score: r.score,
    matchedTags: r.matchedTags,
    blockedBy: r.blockedBy,
    explanation: r.explanation,
    notFor: r.game.notFor,
    similar: r.game.similar
  };
}

export async function POST(req: NextRequest) {
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const answersInput =
    body && typeof body === "object" && "answers" in body
      ? (body as { answers?: unknown }).answers
      : {};

  const validation = validateAnswerMap(answersInput);
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error, details: validation.details },
      { status: validation.status },
    );
  }

  const followUpAnswersInput =
    body && typeof body === "object" && "followUpAnswers" in body
      ? (body as { followUpAnswers?: unknown }).followUpAnswers
      : undefined;

  const followUpValidation = validateFollowUpAnswerMap(followUpAnswersInput);
  if (!followUpValidation.ok) {
    return NextResponse.json(
      { error: followUpValidation.error },
      { status: followUpValidation.status },
    );
  }

  const hasFollowUpAnswers = Object.keys(followUpValidation.answers).length > 0;
  const ranked = hasFollowUpAnswers
    ? rankAllWithFollowUps(validation.answers, followUpValidation.answers)
    : rankAll(validation.answers);
  const followUpQuestions = hasFollowUpAnswers ? [] : selectFollowUpQuestions(ranked);
  const resultRows = ranked.slice(0, 6).map(toResult);

  return NextResponse.json({
    results: resultRows,
    recommendations: resultRows,
    needsFollowUp: followUpQuestions.length > 0,
    followUpQuestions,
    diagnostic: getFollowUpDiagnostic(ranked),
  });
}
