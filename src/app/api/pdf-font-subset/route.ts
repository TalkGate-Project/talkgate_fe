import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import subsetFont from "subset-font";
import * as fontkit from "fontkit";

/**
 * 모바일 진단서 PDF(analysisPdfWorker)가 실제로 그 문서에 쓰인 글자만 담은 프리텐다르
 * 서브셋 폰트를 받아가는 엔드포인트. 원본 프리텐다르(1MB+, 전체 한글 글리프 포함)를 Worker가
 * 그대로 파싱하면 fontkit 글리프 테이블 인덱싱 비용이 커 PDF 생성이 수십 초씩 걸린다
 * (2026-09-01 실측). 서브셋 자체는 Node 전용 라이브러리(subset-font → harfbuzzjs)라
 * 브라우저 Worker 안에서 돌릴 수 없어 이 서버 라우트에서 처리한다.
 */

export const runtime = "nodejs";

const FONT_FILES = {
  regular: "Pretendard-Regular.woff",
  semibold: "Pretendard-SemiBold.woff",
} as const;

type FontKey = keyof typeof FONT_FILES;

// 문서 하나에 쓰이는 글자 수가 이 값을 넘을 일은 없다 — 비정상적으로 큰 요청을 막는 경계값.
const MAX_TEXT_LENGTH = 200_000;

let masterFontsPromise: Promise<Record<FontKey, Buffer>> | null = null;

function loadMasterFonts(): Promise<Record<FontKey, Buffer>> {
  if (!masterFontsPromise) {
    masterFontsPromise = Promise.all(
      (Object.entries(FONT_FILES) as [FontKey, string][]).map(async ([key, fileName]) => {
        const buffer = await readFile(
          path.join(process.cwd(), "public", "fonts", "pretendard", fileName)
        );
        return [key, buffer] as const;
      })
    ).then((entries) => Object.fromEntries(entries) as Record<FontKey, Buffer>);
  }
  return masterFontsPromise;
}

// 요청한 글자가 실제로 서브셋 결과물에 다 들어갔는지 확인한다. 문서에 실제 쓰이는 텍스트를
// 모으는 쪽(analysisPdfWorker의 collectText)이 컴포넌트 구조가 바뀌면서 일부를 놓치는 사고가
// 실제로 있었다(2026-09-01, props.children만 보고 title/rows 등은 못 읽던 버그) — 그 사고가
// 재발해도 깨진 글자가 PDF에 그대로 나가는 대신 여기서 걸러지도록 한 번 더 검증한다.
function hasFullGlyphCoverage(buffer: Buffer, text: string): boolean {
  const font = fontkit.create(buffer);
  // subsetFont(..., { targetFormat: "sfnt" })는 항상 단일 폰트를 만든다 — TTC 컬렉션이 아니다.
  if (!("glyphForCodePoint" in font)) return false;
  for (const char of new Set(text)) {
    if (/\s/.test(char)) continue;
    const glyph = font.glyphForCodePoint(char.codePointAt(0) ?? 0);
    if (!glyph || glyph.id === 0) return false;
  }
  return true;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text : "";

  if (!text || text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: "invalid text" }, { status: 400 });
  }

  const masters = await loadMasterFonts();
  const [regular, semibold] = await Promise.all([
    subsetFont(masters.regular, text, { targetFormat: "sfnt" }),
    subsetFont(masters.semibold, text, { targetFormat: "sfnt" }),
  ]);

  if (!hasFullGlyphCoverage(regular, text) || !hasFullGlyphCoverage(semibold, text)) {
    console.error("PDF font subset is missing glyphs for the requested text; refusing subset.");
    return NextResponse.json({ error: "incomplete glyph coverage" }, { status: 422 });
  }

  return NextResponse.json({
    regular: regular.toString("base64"),
    semibold: semibold.toString("base64"),
  });
}
