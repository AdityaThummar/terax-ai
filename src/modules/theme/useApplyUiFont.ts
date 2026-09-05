import { resolveUiFontFamily } from "@/lib/resolveUiFontFamily";
import { usePreferencesStore } from "@/modules/settings/preferences";
import { useEffect } from "react";

const FONT_VAR = "--ui-font-family";
const SIZE_VAR = "--ui-font-size";

export function useApplyUiFont(): void {
  const fontFamily = usePreferencesStore((s) => s.uiFontFamily);
  const fontSize = usePreferencesStore((s) => s.uiFontSize);

  useEffect(() => {
    document.documentElement.style.setProperty(
      FONT_VAR,
      resolveUiFontFamily(fontFamily),
    );
  }, [fontFamily]);

  useEffect(() => {
    document.documentElement.style.setProperty(SIZE_VAR, `${fontSize}px`);
  }, [fontSize]);
}
