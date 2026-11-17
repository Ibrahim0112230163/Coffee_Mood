"use client";

import { Check, Copy, Download, ExternalLink, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button, buttonClass } from "@/components/ui";

const subscribe = () => () => {};

/** Public origin: NEXT_PUBLIC_SITE_URL when set (production), else the current browser origin. */
function useOrigin() {
  return useSyncExternalStore(
    subscribe,
    () => process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || window.location.origin,
    () => process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "",
  );
}

export function ShareCard({ slug, name, large = false }: { slug: string; name: string; large?: boolean }) {
  const origin = useOrigin();
  const url = `${origin}/shop/${slug}`;
  const [svg, setSvg] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!origin) return;
    QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#2b1a12", light: "#fffaf3" } })
      .then(setSvg)
      .catch(() => setSvg(""));
  }, [url, origin]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  async function downloadPng() {
    const dataUrl = await QRCode.toDataURL(url, { width: 1200, margin: 2, errorCorrectionLevel: "M", color: { dark: "#2b1a12", light: "#ffffff" } });
    triggerDownload(dataUrl, `${slug}-coffie-mood-qr.png`);
  }

  function downloadSvg() {
    triggerDownload(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, `${slug}-coffie-mood-qr.svg`);
  }

  return (
    <div className={`rounded-3xl bg-espresso p-6 text-foam ${large ? "sm:p-8" : ""}`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-honey">
        <QrCode className="size-4" /> Your customer link
      </div>
      <div className={`mt-4 flex flex-col gap-5 ${large ? "sm:flex-row sm:items-center" : ""}`}>
        <div
          className={`aspect-square shrink-0 overflow-hidden rounded-2xl bg-foam p-2 ${large ? "w-48" : "w-36"}`}
          aria-label={`QR code linking to ${url}`}
          role="img"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <div className="min-w-0 space-y-3">
          <p className="font-display text-xl font-semibold">{name}</p>
          <p className="break-all rounded-xl bg-mocha/70 px-3 py-2 font-mono text-xs text-latte">{url || `/shop/${slug}`}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={copy} icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />}>
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button size="sm" variant="secondary" onClick={downloadPng} icon={<Download className="size-4" />} disabled={!svg}>
              PNG
            </Button>
            <Button size="sm" variant="secondary" onClick={downloadSvg} icon={<Download className="size-4" />} disabled={!svg}>
              SVG
            </Button>
            <a href={`/shop/${slug}`} target="_blank" rel="noreferrer" className={buttonClass("ghost", "sm", "text-latte hover:bg-mocha")}>
              Open <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
