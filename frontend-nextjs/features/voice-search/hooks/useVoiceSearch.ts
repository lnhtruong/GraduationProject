"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface UseVoiceSearchOptions {
  onResult?: (transcript: string, isFinal: boolean) => void;
  onEnd?: (finalTranscript: string) => void;
  onError?: (error: string) => void;
  lang?: string;
}

export function useVoiceSearch(options: UseVoiceSearchOptions = {}) {
  const { onResult, onEnd, onError, lang = "vi-VN" } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const onResultRef = useRef(onResult);
  const onEndRef = useRef(onEnd);
  const onErrorRef = useRef(onError);

  // Sync callbacks and transcript values to refs to avoid stale closures
  useEffect(() => {
    onResultRef.current = onResult;
    onEndRef.current = onEnd;
    onErrorRef.current = onError;
  }, [onResult, onEnd, onError]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = lang;

      rec.onstart = () => {
        setIsListening(true);
        setError(null);
        setTranscript("");
        transcriptRef.current = "";
      };

      rec.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptSegment = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptSegment;
          } else {
            interimTranscript += transcriptSegment;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        transcriptRef.current = currentTranscript;

        if (onResultRef.current) {
          onResultRef.current(currentTranscript, finalTranscript !== "");
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        let errorMsg = "Đã xảy ra lỗi trong quá trình thu âm.";
        if (event.error === "not-allowed") {
          errorMsg = "Không có quyền truy cập micro. Vui lòng cho phép quyền truy cập micro trong cài đặt trình duyệt.";
        } else if (event.error === "no-speech") {
          errorMsg = "Không nghe thấy tiếng nói. Vui lòng thử lại.";
        }
        setError(errorMsg);
        setIsListening(false);
        if (onErrorRef.current) {
          onErrorRef.current(errorMsg);
        }
      };

      rec.onend = () => {
        setIsListening(false);
        if (onEndRef.current && transcriptRef.current.trim()) {
          onEndRef.current(transcriptRef.current.trim());
        }
      };

      recognitionRef.current = rec;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore errors during abort
        }
      }
    };
  }, [lang]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      setError(null);
      setTranscript("");
      transcriptRef.current = "";
      recognitionRef.current.start();
    } catch (err) {
      console.error("Failed to start speech recognition", err);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (err) {
      console.error("Failed to stop speech recognition", err);
    }
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
  };
}
