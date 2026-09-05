const UI_FALLBACK = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, Roboto, 'Helvetica Neue', sans-serif";

export function resolveUiFontFamily(userInput: string): string {
  const name = userInput.trim();
  if (!name) return UI_FALLBACK;
  if (name.includes(",")) return `${name}, ${UI_FALLBACK}`;
  return `'${name}', ${UI_FALLBACK}`;
}
