// Server-Sent Events(text/event-stream) 응답 파서.
// apiClient는 응답을 완전히 버퍼링한 뒤 반환하므로 스트리밍 응답에는 쓸 수 없다.
// 이 함수는 raw fetch로 받은 Response를 직접 읽어 `data:` 라인 페이로드를 콜백으로 전달한다.
// SSE 표준의 event:/id:/retry: 필드는 사용하지 않는다 (이 프로젝트 백엔드가 data:만 사용).

export async function readEventStream(
  response: Response,
  onMessage: (payload: string) => void
): Promise<void> {
  if (!response.body) {
    throw new Error("Response body is not readable.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

      let separatorIndex = buffer.indexOf("\n\n");
      while (separatorIndex !== -1) {
        const rawEvent = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);

        const dataLines = rawEvent
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim());

        if (dataLines.length > 0) {
          onMessage(dataLines.join("\n"));
        }

        separatorIndex = buffer.indexOf("\n\n");
      }
    }
  } finally {
    reader.releaseLock();
  }
}
