import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  REPORTS_DIR,
  ROOT,
  ensureReportsDir,
  writeMarkdownReport,
} from "./gameseek-diagnostics-utils";

const SCRIPTS = [
  {
    id: "simulation",
    command: "scripts/simulate-user-answers.ts",
    json: "v0.3.4-user-answer-simulation.json",
    md: "v0.3.4-user-answer-simulation.md",
  },
  {
    id: "noise",
    command: "scripts/test-answer-noise.ts",
    json: "v0.3.4-answer-noise.json",
    md: "v0.3.4-answer-noise.md",
  },
  {
    id: "ab",
    command: "scripts/test-confusable-ab.ts",
    json: "v0.3.4-confusable-ab.json",
    md: "v0.3.4-confusable-ab.md",
  },
  {
    id: "questions",
    command: "scripts/analyze-question-discrimination.ts",
    json: "v0.3.4-question-discrimination.json",
    md: "v0.3.4-question-discrimination.md",
  },
  {
    id: "subclusters",
    command: "scripts/analyze-subclusters.ts",
    json: "v0.3.4-subcluster-analysis.json",
    md: "v0.3.4-subcluster-analysis.md",
  },
];

function runScript(scriptPath: string) {
  const tsxBin = path.join(ROOT, "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");
  const result = process.platform === "win32"
    ? spawnSync(`"${tsxBin}" "${scriptPath}"`, {
        cwd: ROOT,
        stdio: "inherit",
        shell: true,
      })
    : spawnSync(tsxBin, [scriptPath], {
        cwd: ROOT,
        stdio: "inherit",
        shell: false,
      });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${scriptPath} failed with status ${result.status}`);
  }
}

function readJson(fileName: string) {
  const filePath = path.join(REPORTS_DIR, fileName);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

ensureReportsDir();

for (const script of SCRIPTS) {
  runScript(script.command);
}

const simulation = readJson("v0.3.4-user-answer-simulation.json");
const noise = readJson("v0.3.4-answer-noise.json");
const ab = readJson("v0.3.4-confusable-ab.json");
const questions = readJson("v0.3.4-question-discrimination.json");
const subclusters = readJson("v0.3.4-subcluster-analysis.json");

const requiredFiles = SCRIPTS.flatMap((script) => [script.json, script.md]);
const missingFiles = requiredFiles.filter((fileName) => !fs.existsSync(path.join(REPORTS_DIR, fileName)));
if (missingFiles.length) {
  throw new Error(`Missing robustness report files: ${missingFiles.join(", ")}`);
}

const summary = [
  "# GameSeek Mini v0.3.4 Recommendation Robustness Summary",
  "",
  "v0.3.4 is diagnostics-only. Unless the baseline tests fail, low robustness metrics are not release failures; they are inputs for v0.3.5 / v0.4 calibration and question design.",
  "",
  "## Generated Reports",
  "",
  ...requiredFiles.map((fileName) => `- \`reports/${fileName}\``),
  "",
  "## Headline Findings",
  "",
  `- User simulation levels: ${Object.keys(simulation.levels ?? {}).join(", ")}`,
  `- Noise levels: ${Object.keys(noise.byNoiseLevel ?? {}).join(", ")}`,
  `- Confusable A/B pairs tested: ${ab.pairs}`,
  `- Confusable A/B status counts: ${JSON.stringify(ab.statusCounts ?? {})}`,
  `- Question baseline Top6Recall: ${questions.baseline?.top6Recall}`,
  `- Sub-cluster high-risk confusions: ${(subclusters.highRiskConfusions ?? []).length}`,
  `- Sub-cluster overloaded clusters: ${JSON.stringify(subclusters.overloadedClusters ?? [])}`,
  "",
  "## Interpretation Rule",
  "",
  "- A weak simulation/noise/A-B result should not be fixed in v0.3.4.",
  "- Use this report to choose the next bounded calibration or question-space task.",
].join("\n");

writeMarkdownReport("v0.3.4-recommendation-robustness-summary.md", summary);

console.log(
  JSON.stringify(
    {
      passed: true,
      generatedReports: [...requiredFiles, "v0.3.4-recommendation-robustness-summary.md"],
      missingFiles,
    },
    null,
    2,
  ),
);
