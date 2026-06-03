import { loadPreferences } from "@/modules/settings/store";
import { homeDir } from "@tauri-apps/api/path";

let cached: string | undefined;

export async function initStartupPath(): Promise<void> {
  const [prefs, home] = await Promise.all([
    loadPreferences(),
    homeDir().catch(() => null),
  ]);
  const fallback = home ?? undefined;
  switch (prefs.startupPathMode) {
    case "last-closed":
      cached = prefs.startupLastClosedPath ?? fallback;
      break;
    case "manual":
      cached = prefs.startupManualPath ?? fallback;
      break;
    case "home":
    default:
      cached = fallback;
  }
}

export function getStartupPath(): string | undefined {
  return cached;
}
