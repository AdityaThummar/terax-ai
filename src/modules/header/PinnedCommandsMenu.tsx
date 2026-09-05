import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Add01Icon,
  Cancel01Icon,
  Delete01Icon,
  PencilEdit02Icon,
  PinIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useRef, useState } from "react";
import {
  usePinnedCommandsStore,
  type PinnedCommand,
} from "./pinnedCommandsStore";

type Props = {
  onInsertCommand: (text: string) => void;
};

export function PinnedCommandsMenu({ onInsertCommand }: Props) {
  const { commands, addCommand, editCommand, deleteCommand } =
    usePinnedCommandsStore();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addValue, setAddValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const commitAdd = useCallback(() => {
    const v = addValue.trim();
    if (v) {
      addCommand(v);
    }
    setAddValue("");
    setAdding(false);
  }, [addValue, addCommand]);

  const commitEdit = useCallback(() => {
    if (editingId) {
      const v = editValue.trim();
      if (v) {
        editCommand(editingId, v);
      } else {
        deleteCommand(editingId);
      }
    }
    setEditingId(null);
    setEditValue("");
  }, [editingId, editValue, editCommand, deleteCommand]);

  const startEditing = useCallback((cmd: PinnedCommand) => {
    setEditingId(cmd.id);
    setEditValue(cmd.text);
    setAdding(false);
  }, []);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        if (!next && (adding || editingId)) return;
        setOpen(next);
        if (!next) {
          setAdding(false);
          setAddValue("");
          setEditingId(null);
          setEditValue("");
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Pinned commands"
        >
          <HugeiconsIcon icon={PinIcon} size={14} strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-52"
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (adding || editingId) {
            e.preventDefault();
          }
        }}
      >
        {commands.length === 0 && !adding && (
          <div className="px-2 py-1.5 text-[12px] text-muted-foreground">
            No pinned commands
          </div>
        )}

        {commands.map((cmd) => (
          <DropdownMenuItem
            key={cmd.id}
            className="group gap-1.5"
            onSelect={(e) => {
              e.preventDefault();
              if (editingId === cmd.id) return;
              onInsertCommand(cmd.text);
              setOpen(false);
            }}
          >
            {editingId === cmd.id ? (
              <form
                className="flex w-full items-center gap-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  commitEdit();
                }}
              >
                <Input
                  ref={editInputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-6 flex-1 bg-muted/80 text-[12px]"
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setEditingId(null);
                      setEditValue("");
                    }
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    commitEdit();
                  }}
                >
                  <HugeiconsIcon icon={Tick02Icon} size={11} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(null);
                    setEditValue("");
                  }}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={11} strokeWidth={2} />
                </button>
              </form>
            ) : (
              <>
                <span className="flex-1 truncate text-[13px]">{cmd.text}</span>
                <button
                  type="button"
                  className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(cmd);
                  }}
                  title="Edit"
                >
                  <HugeiconsIcon
                    icon={PencilEdit02Icon}
                    size={11}
                    strokeWidth={2}
                  />
                </button>
                <button
                  type="button"
                  className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCommand(cmd.id);
                  }}
                  title="Delete"
                >
                  <HugeiconsIcon
                    icon={Delete01Icon}
                    size={11}
                    strokeWidth={2}
                  />
                </button>
              </>
            )}
          </DropdownMenuItem>
        ))}

        {adding && (
          <DropdownMenuItem
            className="gap-1.5"
            onSelect={(e) => e.preventDefault()}
          >
            <form
              className="flex w-full items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                commitAdd();
              }}
            >
              <Input
                ref={addInputRef}
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                placeholder="Type a command..."
                className="h-6 flex-1 bg-muted/80 text-[12px]"
                autoFocus
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setAdding(false);
                    setAddValue("");
                  }
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  commitAdd();
                }}
              >
                <HugeiconsIcon icon={Tick02Icon} size={11} strokeWidth={2} />
              </button>
              <button
                type="button"
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setAdding(false);
                  setAddValue("");
                }}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={11} strokeWidth={2} />
              </button>
            </form>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          className="gap-1.5 text-muted-foreground"
          onSelect={(e) => {
            e.preventDefault();
            setAdding(true);
          }}
        >
          <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
          <span className="flex-1 text-[13px]">Add Command</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
