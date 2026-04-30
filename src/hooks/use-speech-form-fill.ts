"use client";

/**
 * POLANITAS — useSpeechFormFill
 *
 * Subscribe to voice form-fill events dispatched by SpeechToAction.
 * Call this in a page that has a form to enable hands-free form filling.
 *
 * Usage:
 *   useSpeechFormFill((action) => {
 *     if (action.type === "set-topic") setTopic(action.value);
 *   });
 */

import { useEffect } from "react";
import type { VoiceFormAction } from "@/lib/voice-form-filler";

export function useSpeechFormFill(
  handler: (action: VoiceFormAction) => void
) {
  useEffect(() => {
    function onEvent(e: Event) {
      const action = (e as CustomEvent<VoiceFormAction>).detail;
      handler(action);
    }
    window.addEventListener("polanitas:form-fill", onEvent);
    return () => window.removeEventListener("polanitas:form-fill", onEvent);
  }, [handler]);
}
