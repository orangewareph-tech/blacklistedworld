import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getTurnstileSiteKey } from "@/lib/security.functions";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

const SCRIPT_ID = "cf-turnstile-script";

export function Turnstile({
  onToken,
}: {
  onToken: (token: string | null) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [siteKey, setSiteKey] = useState<string>("");
  const fetchKey = useServerFn(getTurnstileSiteKey);

  useEffect(() => {
    fetchKey().then((r) => setSiteKey(r.siteKey)).catch(() => setSiteKey(""));
  }, [fetchKey]);

  useEffect(() => {
    if (!siteKey || !ref.current) return;

    const render = () => {
      if (!window.turnstile || !ref.current || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        theme: "dark",
        callback: (token) => onToken(token),
        "error-callback": () => onToken(null),
        "expired-callback": () => onToken(null),
      });
    };

    if (window.turnstile) {
      render();
    } else if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.defer = true;
      s.onload = render;
      document.head.appendChild(s);
    } else {
      const iv = setInterval(() => {
        if (window.turnstile) {
          clearInterval(iv);
          render();
        }
      }, 100);
      return () => clearInterval(iv);
    }

    return () => {
      try {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
      } catch {
        // ignore
      }
    };
  }, [siteKey, onToken]);

  if (!siteKey) {
    return (
      <p className="text-xs text-muted-foreground">
        Anti-bot verification unavailable. Please contact support.
      </p>
    );
  }

  return <div ref={ref} className="my-2" />;
}
