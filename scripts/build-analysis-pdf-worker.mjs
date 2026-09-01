// Turbopack의 `new Worker(new URL(..., import.meta.url))` 처리에 버그가 있어
// (워커 청크 URL 계산 중 "chunkPath.split is not a function" 예외) 이 워커는
// Turbopack 그래프 밖에서 esbuild로 단일 파일로 미리 번들링해 public/workers/에 정적
// 자산으로 두고 문자열 경로로 로드한다. 워커 소스나 그 의존 모듈(AnalysisPdfDocument 등)을
// 고치면 `node scripts/build-analysis-pdf-worker.mjs`를 다시 실행해야 한다.
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { rm } from "node:fs/promises";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

await build({
  entryPoints: [path.join(rootDir, "src/components/debt-relief/result/analysisPdfWorker.tsx")],
  outfile: path.join(rootDir, "public/workers/analysis-pdf-worker.js"),
  bundle: true,
  minify: true,
  format: "esm",
  platform: "browser",
  target: "es2020",
  jsx: "automatic",
  jsxImportSource: "react",
  mainFields: ["browser", "module", "main"],
  conditions: ["browser"],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  alias: {
    "@": path.join(rootDir, "src"),
  },
  logLevel: "info",
});

// 워커에는 DOM이 없어 CSS가 적용될 곳이 없다. 의존 모듈 중 하나가 CSS를 import해서
// esbuild가 부산물로 만들어내는 파일이라 그냥 지운다(loader:"empty"로도 억제가 안 됨).
await rm(path.join(rootDir, "public/workers/analysis-pdf-worker.css"), { force: true });
