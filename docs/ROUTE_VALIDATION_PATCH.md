# API route validation patch

Copy `src/lib/gameseek/validateAnswers.ts` into the repo, then update `src/app/api/recommend/route.ts` so validation happens before calling `recommend`.

Minimal shape:

```ts
import { NextResponse } from "next/server";
import { recommend } from "@/lib/gameseek/scoring";
import { validateAnswerMap } from "@/lib/gameseek/validateAnswers";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const answersInput = body && typeof body === "object" && "answers" in body
    ? (body as { answers?: unknown }).answers
    : {};

  const validation = validateAnswerMap(answersInput);
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error, details: validation.details },
      { status: validation.status },
    );
  }

  const recommendations = recommend(validation.answers);
  return NextResponse.json({ recommendations });
}
```

Important behavior:

- `{ answers: {} }` returns 200-ish normal response, not 5xx.
- Illegal question id returns 400.
- Illegal option id returns 400.
- Array answer values are rejected with 400 because current `AnswerMap` is single-select string.
- One answered question is allowed.
- Full 12 answered questions are allowed.
