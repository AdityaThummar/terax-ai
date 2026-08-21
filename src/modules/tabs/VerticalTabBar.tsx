import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { AgentIcon } from "@/modules/agents/lib/agentIcon";
import { fileIconUrl } from "@/modules/explorer/lib/iconResolver";
import {
  leafIds,
  ptyIdForLeaf,
  tabAgentStatus,
  useAgentActivityStore,
} from "@/modules/terminal";
import {
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  ComputerTerminal02Icon,
  GitCompareIcon,
  Globe02Icon,
  IncognitoIcon,
  Message02Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
import { labelFor } from "./lib/tabLabel";
import type { Tab } from "./lib/useTabs";

type Props = {
  tabs: Tab[];
  activeId: number;
  onSelect: (id: number) => void;
  onClose: (id: number) => void;
  onPin: (id: number) => void;
  onRename: (id: number, title: string) => void;
  onReorder: (fromId: number, toGapIndex: number) => void;
};

export function VerticalTabBar({
  tabs,
  activeId,
  onSelect,
  onClose,
  onPin,
  onRename,
  onReorder,
}: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropGap, setDropGap] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointerId: number;
    startY: number;
    fromId: number;
    active: boolean;
  } | null>(null);

  const gapAtY = (clientY: number) => {
    const els = Array.from(
      scrollRef.current?.querySelectorAll<HTMLElement>("[data-tab-id]") ?? [],
    );
    for (let i = 0; i < els.length; i++) {
      const r = els[i].getBoundingClientRect();
      if (clientY < r.top + r.height / 2) return i;
    }
    return els.length;
  };

  const endDrag = (currentTarget: Element) => {
    const st = drag.current;
    if (st) currentTarget.releasePointerCapture?.(st.pointerId);
    drag.current = null;
    setDraggingId(null);
    setDropGap(null);
    document.body.style.userSelect = "";
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>(`[data-tab-id="${activeId}"]`);
    active?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  return (
    <div
      ref={scrollRef}
      className="flex h-full min-h-0 flex-col overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex flex-col gap-0.5 p-1">
        {tabs.map((t, i) => {
          const isPreview =
            (t.kind === "editor" || t.kind === "git-diff") && t.preview;
          const isActive = t.id === activeId;
          const srcIndex = tabs.findIndex((x) => x.id === draggingId);
          const showGap = (gap: number) =>
            draggingId !== null &&
            dropGap === gap &&
            gap !== srcIndex &&
            gap !== srcIndex + 1;

          const handleDragStart = (e: React.PointerEvent) => {
            if (e.button !== 0) return;
            drag.current = {
              pointerId: e.pointerId,
              startY: e.clientY,
              fromId: t.id,
              active: false,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
          };

          const handleDragMove = (e: React.PointerEvent) => {
            const st = drag.current;
            if (!st || st.pointerId !== e.pointerId) return;
            if (!st.active) {
              if (Math.abs(e.clientY - st.startY) < 4) return;
              st.active = true;
              setDraggingId(st.fromId);
              document.body.style.userSelect = "none";
            }
            e.preventDefault();
            setDropGap(gapAtY(e.clientY));
          };

          const handleDragEnd = (e: React.PointerEvent) => {
            const st = drag.current;
            if (st?.active && dropGap !== null) {
              onReorder(st.fromId, dropGap);
            } else if (st && !st.active) {
              onSelect(t.id);
            }
            endDrag(e.currentTarget);
          };

          const handleDoubleClick = () => {
            if (isPreview) {
              onPin(t.id);
            } else if (t.kind === "terminal") {
              setEditingId(t.id);
            }
          };

          const handleAuxClick = (e: React.MouseEvent) => {
            if (e.button === 1 && tabs.length > 1) {
              e.preventDefault();
              e.stopPropagation();
              onClose(t.id);
            }
          };

          const tabRow = (
            <div
              data-tab-id={t.id}
              onPointerDown={handleDragStart}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
              onPointerCancel={handleDragEnd}
              onDoubleClick={handleDoubleClick}
              onAuxClick={handleAuxClick}
              className={cn(
                "group relative flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-md px-2 text-xs transition-colors",
                draggingId === t.id && "opacity-50",
                isActive
                  ? "bg-foreground/[0.07] text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.045] hover:text-foreground/80",
              )}
            >
              <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-opacity duration-150">
                <span
                  className={cn(
                    "absolute inset-0 rounded-full bg-primary",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                />
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <VerticalTabIcon tab={t} />
                {editingId === t.id && t.kind === "terminal" ? (
                  <TabRenameInput
                    initial={labelFor(t)}
                    onCommit={(value) => {
                      onRename(t.id, value);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <span
                    className={cn(
                      "truncate",
                      isPreview && "italic",
                    )}
                  >
                    {labelFor(t)}
                  </span>
                )}
                {t.kind === "editor" && t.dirty && (
                  <span
                    aria-label="Unsaved changes"
                    className="size-1.5 shrink-0 rounded-full bg-foreground/70"
                  />
                )}
              </span>
              {tabs.length > 1 && (
                <span
                  role="button"
                  aria-label="Close tab"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(t.id);
                  }}
                  className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-accent hover:opacity-100 group-hover:opacity-60"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={11}
                    strokeWidth={2}
                  />
                </span>
              )}
            </div>
          );

          return (
            <div key={t.id}>
              {showGap(i) && <DropIndicator />}
              {t.kind === "terminal" ? (
                <ContextMenu>
                  <ContextMenuTrigger asChild>{tabRow}</ContextMenuTrigger>
                  <ContextMenuContent
                    className="min-w-32 p-1"
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    <ContextMenuItem
                      className="gap-2 rounded-xl px-2.5 py-1.5 text-[13px]"
                      onSelect={() => setEditingId(t.id)}
                    >
                      <HugeiconsIcon
                        icon={PencilEdit02Icon}
                        size={13}
                        strokeWidth={1.75}
                      />
                      <span className="flex-1">Rename</span>
                    </ContextMenuItem>
                    {tabs.length > 1 && (
                      <>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          className="gap-2 rounded-xl px-2.5 py-1.5 text-[13px]"
                          onSelect={() => onClose(t.id)}
                        >
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            size={13}
                            strokeWidth={1.75}
                          />
                          <span className="flex-1">Close</span>
                        </ContextMenuItem>
                      </>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
              ) : (
                tabRow
              )}
              {i === tabs.length - 1 && showGap(tabs.length) && (
                <DropIndicator />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DropIndicator() {
  return (
    <span
      aria-hidden
      className="mx-1 my-0.5 h-0.5 shrink-0 self-stretch rounded-full bg-primary"
    />
  );
}

function useTabAgentStatus(tab: Tab) {
  const phases = useAgentActivityStore((s) => s.phases);
  const agents = useAgentActivityStore((s) => s.agents);
  if (tab.kind !== "terminal" || tab.private) {
    return { state: null, agent: null } as const;
  }
  const ptyIds: number[] = [];
  for (const leaf of leafIds(tab.paneTree)) {
    const id = ptyIdForLeaf(leaf);
    if (id !== null) ptyIds.push(id);
  }
  return tabAgentStatus(phases, agents, ptyIds);
}

function VerticalTabIcon({ tab }: { tab: Tab }) {
  const agentStatus = useTabAgentStatus(tab);
  if (tab.kind === "editor" || tab.kind === "markdown") {
    const url =
      tab.kind === "editor" && tab.overrideLanguage
        ? fileIconUrl(`dummy.${tab.overrideLanguage}`)
        : fileIconUrl(tab.title);
    return url ? (
      <img
        src={url}
        alt=""
        className="size-3.5 shrink-0 object-contain"
        onError={(e) => {
          const img = e.currentTarget;
          if (img.dataset.fallback) return;
          img.dataset.fallback = "1";
          img.src = fileIconUrl("dummy.txt");
        }}
      />
    ) : null;
  }
  if (tab.kind === "preview") {
    return (
      <HugeiconsIcon
        icon={Globe02Icon}
        size={14}
        strokeWidth={2}
        className="shrink-0"
      />
    );
  }
  if (tab.kind === "ai-diff") {
    return (
      <HugeiconsIcon
        icon={GitCompareIcon}
        size={14}
        strokeWidth={2}
        className="shrink-0"
      />
    );
  }
  if (tab.kind === "terminal" && tab.private) {
    return (
      <HugeiconsIcon
        icon={IncognitoIcon}
        size={14}
        strokeWidth={2}
        className="shrink-0"
      />
    );
  }
  if (tab.kind === "git-diff" || tab.kind === "git-commit-file") {
    return (
      <HugeiconsIcon
        icon={GitCompareIcon}
        size={14}
        strokeWidth={2}
        className="shrink-0"
      />
    );
  }
  if (tab.kind === "git-history") {
    return (
      <HugeiconsIcon
        icon={Clock01Icon}
        size={14}
        strokeWidth={2}
        className="shrink-0"
      />
    );
  }
  if (agentStatus.state === "attention") {
    return (
      <HugeiconsIcon
        icon={Message02Icon}
        size={14}
        strokeWidth={2}
        className="shrink-0"
      />
    );
  }
  if (agentStatus.state === "finished") {
    return (
      <HugeiconsIcon
        icon={CheckmarkCircle01Icon}
        size={14}
        strokeWidth={2}
        className="shrink-0"
      />
    );
  }
  if (agentStatus.state === "working" && agentStatus.agent) {
    return (
      <AgentIcon agent={agentStatus.agent} size={14} className="shrink-0" />
    );
  }
  return (
    <HugeiconsIcon
      icon={ComputerTerminal02Icon}
      size={14}
      strokeWidth={2}
      className="shrink-0"
    />
  );
}

function TabRenameInput({
  initial,
  onCommit,
  onCancel,
}: {
  initial: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.select();
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const finish = (fn: () => void) => {
    if (done.current) return;
    done.current = true;
    fn();
  };

  const commit = (value: string, explicit: boolean) => {
    if (!explicit && value.trim() === initial.trim()) finish(onCancel);
    else finish(() => onCommit(value));
  };

  return (
    <input
      ref={ref}
      defaultValue={initial}
      aria-label="Rename tab"
      className={cn(
        "w-28 min-w-0 rounded-sm bg-background px-1 text-xs text-foreground",
        "outline-none ring-1 ring-border focus:ring-ring",
      )}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") commit(e.currentTarget.value, true);
        else if (e.key === "Escape") finish(onCancel);
      }}
      onBlur={(e) => {
        if (!document.hasFocus()) return;
        commit(e.currentTarget.value, false);
      }}
    />
  );
}
