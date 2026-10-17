/** Shared by the call window and the dashboard Settings: where Stella's voice plays. Stored on its own key so both stay in sync. */
export type VoiceOut = "Device" | "Pi" | "Both";
const KEY = "stella-voice-out";
export const VOICE_OUT_LABEL: Record<VoiceOut, string> = { Device: "This device", Pi: "Pi speaker", Both: "Both" };

export function voiceOut(): VoiceOut {
  try {
    const v = localStorage.getItem(KEY);
    return v === "Pi" || v === "Both" ? v : "Device";
  } catch {
    return "Device";
  }
}

export function setVoiceOut(v: VoiceOut) {
  try { localStorage.setItem(KEY, v); } catch { /* private mode: choice lasts until reload */ }
}

export function nextVoiceOut(v: VoiceOut): VoiceOut {
  return v === "Device" ? "Pi" : v === "Pi" ? "Both" : "Device";
}
