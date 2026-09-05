import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";
import { osNotify } from "../lib/notify";

interface NotificationPayload {
  title: string;
  body: string;
}

export function NotificationListener() {
  useEffect(() => {
    let alive = true;
    let unlisten: (() => void) | undefined;
    listen<NotificationPayload>("terax:notification", (e) => {
      const { title, body } = e.payload;
      void osNotify(title, body);
    })
      .then((u) => {
        if (alive) unlisten = u;
        else u();
      })
      .catch(() => {});
    return () => {
      alive = false;
      unlisten?.();
    };
  }, []);

  return null;
}
