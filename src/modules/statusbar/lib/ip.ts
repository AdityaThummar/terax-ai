import { invoke } from "@tauri-apps/api/core";

const IP_V4_REGEX =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const IP_V6_REGEX =
  /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

export function isValidIp(value: string): boolean {
  const trimmed = value.trim();
  return IP_V4_REGEX.test(trimmed) || IP_V6_REGEX.test(trimmed);
}

const ENDPOINTS = [
  "https://api64.ipify.org?format=json",
  "https://api.ipify.org?format=json",
];

export async function fetchPublicIp(
  signal?: AbortSignal,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  let lastError: Error | null = null;

  for (const url of ENDPOINTS) {
    try {
      const response = await fetchFn(url, {
        headers: { Accept: "application/json" },
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as { ip?: unknown };
      if (typeof data?.ip === "string" && isValidIp(data.ip)) {
        return data.ip.trim();
      }

      throw new Error("Invalid IP payload");
    } catch (err) {
      if (signal?.aborted) {
        throw err;
      }
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error("Failed to fetch IP address");
}

export async function fetchLocalIp(): Promise<string> {
  const ip = await invoke<string>("net_local_ip");
  if (!isValidIp(ip)) {
    throw new Error("Invalid IP received from system");
  }
  return ip;
}
