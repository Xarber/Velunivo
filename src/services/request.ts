/** React Native's AbortSignal has no static timeout method. Keep cancellation portable. */
export async function requestJson(url: string, options: RequestInit = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const body = await response.json();
    return { response, body };
  } finally { clearTimeout(timer); }
}
