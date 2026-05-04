"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type LogEntry = {
  id: string;
  event: string;
  payload: unknown;
  at: string;
};

const MEDIA_SERVICE_BASE_URL = `http://localhost:8000`;

console.log("check host: ", MEDIA_SERVICE_BASE_URL);

export default function SseTestClient() {
  const [userIdInput, setUserIdInput] = useState("1");
  const [status, setStatus] = useState<
    "idle" | "connected" | "disconnected" | "error"
  >("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  const pushLog = useCallback((event: string, payload: unknown) => {
    setLogs((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        event,
        payload,
        at: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 29),
    ]);
  }, []);

  const closeStream = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setStatus("disconnected");
  }, []);

  const openStream = useCallback(() => {
    const userId = Number(userIdInput);
    if (!Number.isInteger(userId) || userId <= 0) {
      pushLog("validation", "userId must be a positive integer");
      return;
    }

    closeStream();

    const streamUrl = `${MEDIA_SERVICE_BASE_URL}/api/media/sse/users/${userId}/events`;
    const source = new EventSource(streamUrl);
    eventSourceRef.current = source;

    source.onopen = () => {
      setStatus("connected");
      pushLog("connection:open", { streamUrl });
    };

    source.addEventListener("video:progress", (event) => {
      pushLog("video:progress", JSON.parse((event as MessageEvent).data));
    });

    source.addEventListener("video:completed", (event) => {
      pushLog("video:completed", JSON.parse((event as MessageEvent).data));
    });

    source.addEventListener("upload-video:completed", (event) => {
      pushLog(
        "upload-video:completed",
        JSON.parse((event as MessageEvent).data),
      );
    });

    source.addEventListener("video:error", (event) => {
      pushLog("video:error", JSON.parse((event as MessageEvent).data));
    });

    source.onerror = () => {
      setStatus("error");
      pushLog("connection:error", "SSE connection error");
      source.close();
    };
  }, [closeStream, pushLog, userIdInput]);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  return (
    <main style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
      <h1>SSE Test Page</h1>
      <p>Listen to media events by userId.</p>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <input
          value={userIdInput}
          onChange={(e) => setUserIdInput(e.target.value)}
          placeholder="userId"
          style={{ padding: "8px 10px", minWidth: 180 }}
        />
        <button
          type="button"
          onClick={openStream}
          style={{ padding: "8px 12px" }}
        >
          Connect SSE
        </button>
        <button
          type="button"
          onClick={closeStream}
          style={{ padding: "8px 12px" }}
        >
          Disconnect
        </button>
        <strong>Status: {status}</strong>
      </div>

      <pre
        style={{
          background: "#0f172a",
          color: "#e2e8f0",
          padding: 16,
          borderRadius: 8,
          maxHeight: 520,
          overflow: "auto",
        }}
      >
        {logs.length === 0 ? "No events yet." : JSON.stringify(logs, null, 2)}
      </pre>
    </main>
  );
}
