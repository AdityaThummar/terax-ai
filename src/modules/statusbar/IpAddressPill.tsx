import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  GlobeIcon,
  Loading03Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchLocalIp } from "./lib/ip";

export function IpAddressPill() {
  const [ip, setIp] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async (copyToClipboard = false) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const freshIp = await fetchLocalIp();
      setIp(freshIp);

      if (copyToClipboard) {
        await navigator.clipboard.writeText(freshIp);
        if (copiedTimeoutRef.current) {
          clearTimeout(copiedTimeoutRef.current);
        }
        setCopied(true);
        copiedTimeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, 2000);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : "Failed to fetch IP");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh(false);
    return () => {
      abortControllerRef.current?.abort();
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, [refresh]);

  const handleClick = () => {
    void refresh(true);
  };

  const tooltipText = copied
    ? "Refreshed and copied to clipboard"
    : loading && !ip
      ? "Fetching IP address..."
      : loading
        ? "Refreshing IP address..."
        : error && !ip
          ? "Failed to fetch IP. Click to retry."
          : `Local IP: ${ip} (Click to refresh and copy)`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "flex h-6 cursor-pointer select-none items-center gap-1.5 rounded-md border border-border/60 bg-card px-2 font-mono text-[11px] text-muted-foreground transition-colors",
            "hover:border-border hover:bg-accent hover:text-foreground",
            "animate-in fade-in-0 duration-150 ease-out",
          )}
          aria-label="Local IP address"
        >
          {copied ? (
            <HugeiconsIcon
              icon={Tick02Icon}
              size={12}
              strokeWidth={2}
              className="text-emerald-500"
            />
          ) : loading ? (
            <HugeiconsIcon
              icon={Loading03Icon}
              size={12}
              strokeWidth={2}
              className="animate-spin text-muted-foreground"
            />
          ) : (
            <HugeiconsIcon
              icon={GlobeIcon}
              size={12}
              strokeWidth={1.75}
              className={cn(error && !ip && "text-destructive")}
            />
          )}

          <span>
            {copied ? (
              <span className="text-emerald-500 font-medium">Copied!</span>
            ) : ip ? (
              ip
            ) : loading ? (
              "Fetching IP..."
            ) : (
              "IP Offline"
            )}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[11px]">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}
