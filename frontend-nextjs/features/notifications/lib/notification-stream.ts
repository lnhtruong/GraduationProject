import { API_URL } from "@/lib/env";
import { authStorageHelper } from "@/store/auth";

type StreamEvent = {
  event?: string;
  data?: string;
};

function buildSseHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "text/event-stream",
  };

  const token = authStorageHelper.getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (/ngrok/i.test(API_URL)) {
    headers["ngrok-skip-browser-warning"] = "true";
  }

  return headers;
}

function parseEventBlock(block: string): StreamEvent {
  let event: string | undefined;
  const dataLines: string[] = [];

  for (const line of block.split("\n")) {
    const trimmed = line.trimEnd();
    if (!trimmed || trimmed.startsWith(":")) continue;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    const field = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).replace(/^\s/, "");

    if (field === "event") {
      event = value;
    } else if (field === "data") {
      dataLines.push(value);
    }
  }

  return {
    event,
    data: dataLines.length > 0 ? dataLines.join("\n") : undefined,
  };
}

export function subscribeToUserNotifications(options: {
  userId: number;
  onEvent: (eventName: string, payload: unknown) => void;
  onError?: (error: Error) => void;
}): () => void {
  const controller = new AbortController();

  void (async () => {
    try {
      const token = authStorageHelper.getAccessToken();
      if (!token) {
        throw new Error("Missing access token");
      }

      const response = await fetch(
        `${API_URL}/media/sse/users/${options.userId}/events`,
        {
          method: "GET",
          headers: buildSseHeaders(),
          signal: controller.signal,
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("SSE response has no body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!controller.signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, "\n");

        let index = buffer.indexOf("\n\n");
        while (index !== -1) {
          const block = buffer.slice(0, index).trim();
          buffer = buffer.slice(index + 2);
          index = buffer.indexOf("\n\n");

          if (!block) continue;

          const parsed = parseEventBlock(block);
          if (!parsed.event || !parsed.data) continue;

          try {
            options.onEvent(parsed.event, JSON.parse(parsed.data));
          } catch (error) {
            options.onError?.(
              new Error(
                `Parse error: ${error instanceof Error ? error.message : String(error)}`,
              ),
            );
          }
        }
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      options.onError?.(
        new Error(
          `SSE error: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    }
  })();

  return () => controller.abort();
}
