import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FORMATTER_LABELS, FORMATTERS } from "@/modules/editor/lib/externalFormat";
import { EXPOSED_LANGUAGES } from "@/modules/editor/lib/languageDefinitions";
import { usePreferencesStore } from "@/modules/settings/preferences";
import {
  AUTO_SAVE_DELAY_MAX,
  AUTO_SAVE_DELAY_MIN,
  clampAutoSaveDelay,
  EDITOR_FONT_SIZES,
  type EditorFormatter,
  setEditorAutoSave,
  setEditorAutoSaveDelay,
  setEditorCustomFormatCommand,
  setEditorFontFamily,
  setEditorFontSize,
  setEditorFormatOnSave,
  setEditorFormatter,
  setEditorFormatterByLang,
  setEditorWordWrap,
  setVimMode,
} from "@/modules/settings/store";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { LspServersGroup } from "../components/LspServersGroup";
import { SectionHeader } from "../components/SectionHeader";
import { SettingRow } from "../components/SettingRow";

const AUTO_SAVE_STEP = 100;

export function EditorSection() {
  const editorFontSize = usePreferencesStore((s) => s.editorFontSize);
  const editorFontFamily = usePreferencesStore((s) => s.editorFontFamily);
  const vimMode = usePreferencesStore((s) => s.vimMode);
  const editorWordWrap = usePreferencesStore((s) => s.editorWordWrap);
  const editorAutoSave = usePreferencesStore((s) => s.editorAutoSave);
  const editorAutoSaveDelay = usePreferencesStore((s) => s.editorAutoSaveDelay);
  const editorFormatOnSave = usePreferencesStore((s) => s.editorFormatOnSave);
  const editorFormatter = usePreferencesStore((s) => s.editorFormatter);
  const editorFormatterByLang = usePreferencesStore(
    (s) => s.editorFormatterByLang,
  );
  const usesCustom =
    editorFormatter === "custom" ||
    Object.values(editorFormatterByLang).includes("custom");

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Editor"
        description="Editing behavior, saving, and language servers."
      />

      <div className="flex flex-col gap-2">
        <Label>Font options</Label>
        <SettingRow title="Font family" description="Monospace font for the code editor. Leave blank to auto-detect.">
          <FontFamilySelect
            value={editorFontFamily}
            onCommit={(v) => void setEditorFontFamily(v)}
          />
        </SettingRow>
        <SettingRow title="Font size" description="Code editor text size.">
          <Select
            value={String(editorFontSize)}
            onValueChange={(v) => void setEditorFontSize(Number(v))}
          >
            <SelectTrigger size="sm" className="h-8 w-28 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EDITOR_FONT_SIZES.map((size) => (
                <SelectItem
                  key={size}
                  value={String(size)}
                  className="text-[12px]"
                >
                  {size} px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Editing</Label>
        <SettingRow
          title="Vim mode"
          description="Enable Vim keybindings in the code editor."
        >
          <Switch
            checked={vimMode}
            onCheckedChange={(v) => void setVimMode(v)}
          />
        </SettingRow>
        <SettingRow
          title="Word wrap"
          description="Wrap long lines instead of scrolling horizontally."
        >
          <Switch
            checked={editorWordWrap}
            onCheckedChange={(v) => void setEditorWordWrap(v)}
          />
        </SettingRow>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Saving</Label>
        <SettingRow
          title="Auto save"
          description="Automatically save files after a delay when changes are detected."
        >
          <Switch
            checked={editorAutoSave}
            onCheckedChange={(v) => void setEditorAutoSave(v)}
          />
        </SettingRow>
        {editorAutoSave && (
          <AutoSaveDelayInput
            value={editorAutoSaveDelay}
            onChange={(v) => void setEditorAutoSaveDelay(v)}
          />
        )}
        <SettingRow
          title="Format on save"
          description="Format the file on explicit save (Cmd+S / :w) with the formatter below."
        >
          <Switch
            checked={editorFormatOnSave}
            onCheckedChange={(v) => void setEditorFormatOnSave(v)}
          />
        </SettingRow>
        {editorFormatOnSave && (
          <>
            <SettingRow
              title="Formatter"
              description="Language server formats the buffer before writing; external tools run on the saved file from your PATH."
            >
              <FormatterSelect
                value={editorFormatter}
                onChange={(v) => void setEditorFormatter(v)}
              />
            </SettingRow>
            {usesCustom && <CustomFormatCommandInput />}
            <FormatterOverrides />
          </>
        )}
      </div>

      <LspServersGroup />
    </div>
  );
}

const FORMATTER_OPTIONS: EditorFormatter[] = [
  "lsp",
  ...(Object.keys(FORMATTERS) as EditorFormatter[]),
  "custom",
];

function FormatterSelect({
  value,
  onChange,
}: {
  value: EditorFormatter;
  onChange: (v: EditorFormatter) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as EditorFormatter)}>
      <SelectTrigger className="h-8 w-40 text-[12px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {FORMATTER_OPTIONS.map((id) => (
          <SelectItem key={id} value={id}>
            {FORMATTER_LABELS[id]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CustomFormatCommandInput() {
  const stored = usePreferencesStore((s) => s.editorCustomFormatCommand);
  const [draft, setDraft] = useState(stored);

  useEffect(() => {
    setDraft(stored);
  }, [stored]);

  return (
    <SettingRow
      title="Custom command"
      description="Runs on the saved file; {file} is replaced with the quoted path (appended when omitted)."
    >
      <Input
        value={draft}
        placeholder="mytool --fix {file}"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== stored) void setEditorCustomFormatCommand(draft);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="h-8 w-64 font-mono text-[12px] md:text-[12px]"
      />
    </SettingRow>
  );
}

function FormatterOverrides() {
  const byLang = usePreferencesStore((s) => s.editorFormatterByLang);
  const entries = Object.entries(byLang);
  const unused = EXPOSED_LANGUAGES.filter((l) => !(l.ext in byLang));

  const update = (next: Record<string, EditorFormatter>) =>
    void setEditorFormatterByLang(next);

  return (
    <>
      <SettingRow
        title="Language overrides"
        description="Use a different formatter for specific languages (e.g. Ruff for Python)."
      >
        <button
          type="button"
          disabled={unused.length === 0}
          className="h-8 rounded-md border border-border px-3 text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          onClick={() => {
            const first = unused[0];
            if (first) update({ ...byLang, [first.ext]: "lsp" });
          }}
        >
          Add override
        </button>
      </SettingRow>
      {entries.map(([lang, formatter]) => (
        <div
          key={lang}
          className="flex items-center justify-end gap-2 rounded-md border border-border/50 bg-muted/20 px-3 py-1.5"
        >
          <Select
            value={lang}
            onValueChange={(nextLang) => {
              if (nextLang === lang) return;
              const next = { ...byLang };
              delete next[lang];
              next[nextLang] = formatter;
              update(next);
            }}
          >
            <SelectTrigger className="h-7 w-44 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPOSED_LANGUAGES.filter(
                (l) => l.ext === lang || !(l.ext in byLang),
              ).map((l) => (
                <SelectItem key={l.ext} value={l.ext}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormatterSelect
            value={formatter}
            onChange={(v) => update({ ...byLang, [lang]: v })}
          />
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Remove override"
            onClick={() => {
              const next = { ...byLang };
              delete next[lang];
              update(next);
            }}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2} />
          </button>
        </div>
      ))}
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-medium tracking-tight text-muted-foreground">
      {children}
    </span>
  );
}

function AutoSaveDelayInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const n = Number(draft);
    if (!Number.isFinite(n)) {
      setDraft(String(value));
      return;
    }
    const clamped = clampAutoSaveDelay(n);
    setDraft(String(clamped));
    if (clamped !== value) onChange(clamped);
  };

  return (
    <SettingRow
      title="Auto save delay"
      description="Delay before unsaved changes are saved automatically."
    >
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={AUTO_SAVE_DELAY_MIN}
          max={AUTO_SAVE_DELAY_MAX}
          step={AUTO_SAVE_STEP}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          className="h-8 w-20 rounded-md border border-border bg-background px-2.5 text-right text-[12px] md:text-[12px] tabular-nums outline-none focus:border-foreground/40 focus-visible:ring-0 focus-visible:border-foreground/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[11px] text-muted-foreground">ms</span>
      </div>
    </SettingRow>
  );
}

const POPULAR_FONT_FAMILIES: { value: string; label: string }[] = [
  { value: "", label: "Auto-detect" },
  { value: "JetBrains Mono", label: "JetBrains Mono" },
  { value: "JetBrainsMono Nerd Font", label: "JetBrainsMono Nerd Font" },
  { value: "Fira Code", label: "Fira Code" },
  { value: "FiraCode Nerd Font", label: "FiraCode Nerd Font" },
  { value: "CaskaydiaCove Nerd Font", label: "CaskaydiaCove Nerd Font" },
  { value: "Hack Nerd Font", label: "Hack Nerd Font" },
  { value: "Iosevka Nerd Font", label: "Iosevka Nerd Font" },
  { value: "MesloLGS NF", label: "MesloLGS NF" },
  { value: "SF Mono", label: "SF Mono" },
  { value: "Cascadia Code", label: "Cascadia Code" },
  { value: "Source Code Pro", label: "Source Code Pro" },
  { value: "__custom__", label: "Custom..." },
];

const KNOWN_FONT_VALUES = new Set(
  POPULAR_FONT_FAMILIES.filter((f) => f.value !== "__custom__").map(
    (f) => f.value,
  ),
);

function FontFamilySelect({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (v: string) => void;
}) {
  const isKnown = KNOWN_FONT_VALUES.has(value);
  const selectValue = !value ? "" : isKnown ? value : "__custom__";
  const [customDraft, setCustomDraft] = useState(!isKnown ? value : "");
  const [showCustom, setShowCustom] = useState(!isKnown && !!value);

  useEffect(() => {
    const known = KNOWN_FONT_VALUES.has(value);
    if (!known && value) {
      setCustomDraft(value);
      setShowCustom(true);
    } else {
      setShowCustom(false);
    }
  }, [value]);

  const handleSelectChange = (v: string) => {
    if (v === "__custom__") {
      setShowCustom(true);
      setCustomDraft("");
      return;
    }
    setShowCustom(false);
    onCommit(v);
  };

  const commitCustom = () => {
    const next = customDraft.trim();
    setCustomDraft(next);
    if (next !== value) onCommit(next);
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Select value={selectValue} onValueChange={handleSelectChange}>
        <SelectTrigger size="sm" className="h-8 w-52 text-[12px]">
          <SelectValue placeholder="Auto-detect" />
        </SelectTrigger>
        <SelectContent>
          {POPULAR_FONT_FAMILIES.map((f) => (
            <SelectItem key={f.value} value={f.value} className="text-[12px]">
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showCustom && (
        <input
          type="text"
          value={customDraft}
          placeholder="e.g. Monaspace Neon"
          onChange={(e) => setCustomDraft(e.target.value)}
          onBlur={commitCustom}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="h-8 w-52 rounded-md border border-border bg-background px-2.5 text-[12px] outline-none focus:border-foreground/40"
        />
      )}
    </div>
  );
}
