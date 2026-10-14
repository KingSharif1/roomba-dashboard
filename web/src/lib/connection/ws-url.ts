/** Map an http(s) robot origin to the Pi's status socket. */
export function toWebSocketUrl(httpUrl: string): string {
  const url = new URL(httpUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Robot URL must be http or https");
  }
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  const path = url.pathname.replace(/\/+$/, "");
  url.pathname = `${path}/live`;
  url.search = "";
  url.hash = "";
  return url.toString();
}
