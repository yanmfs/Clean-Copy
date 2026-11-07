import { CircleCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { platform } from "../../platform";

// The window that shows this is created by the Rust side, which passes the first message in the URL.
export function Hud() {
  const [message, setMessage] = useState(() => new URLSearchParams(location.search).get("m") ?? "");

  useEffect(() => {
    document.documentElement.classList.add("hud");
    const unlisten = platform.onHudMessage(setMessage);
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, []);

  return (
    <div
      role="status"
      className="anim-fade m-1 flex h-12 items-center gap-2.5 rounded-panel border border-border bg-surface/95 px-4 text-sm font-medium shadow-lg"
    >
      <CircleCheck aria-hidden className="size-5 shrink-0 text-accent-text" />
      <span className="truncate">{message}</span>
    </div>
  );
}
