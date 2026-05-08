import { NextRequest, NextResponse } from "next/server";
import { recommend } from "@/lib/gameseek/scoring";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const answers = body.answers ?? {};

  const results = recommend(answers, 6);

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
