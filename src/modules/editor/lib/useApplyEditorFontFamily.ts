import { resolveFontFamily } from "@/lib/fonts";
import { usePreferencesStore } from "@/modules/settings/preferences";
import { useEffect } from "react";

const CSS_VAR = "--editor-font-family";

export function useApplyEditorFontFamily(): void {
  const fontFamily = usePreferencesStore((s) => s.editorFontFamily);

  useEffect(() => {
    document.documentElement.style.setProperty(
      CSS_VAR,
      resolveFontFamily(fontFamily),
    );
  }, [fontFamily]);
}
