/** Small bridge so the call window knows the "Voice plays on" choice made in the dashboard Settings (stored by stella-os-impl). */
export type VoiceOut = "Device" | "Pi" | "Both";

export function voiceOut(): VoiceOut {
  try {
    const v = JSON.parse(localStorage.getItem("stella-os-v3") || "{}")?.cfg?.voiceOut;
    return v === "Pi" || v === "Both" ? v : "Device";
  } catch {
    return "Device";
  }
}
