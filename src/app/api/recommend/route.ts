import { NextRequest, NextResponse } from "next/server";
import { recommend } from "@/lib/gameseek/scoring";
import { validateAnswerMap } from "@/lib/gameseek/validateAnswers";

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

  const results = recommend(validation.answers, 6);

  return NextResponse.json({
    results: results.map(r => ({
      id: r.game.id,
      title: r.game.title,
      cluster: r.game.cluster,
      score: r.score,
      matchedTags: r.matchedTags,
      blockedBy: r.blockedBy,
      explanation: r.explanation,
      notFor: r.game.notFor,
      similar: r.game.similar
    }))
  });
}
