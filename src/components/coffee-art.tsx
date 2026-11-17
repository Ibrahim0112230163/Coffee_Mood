import type { MenuItem, Temperature } from "@/lib/types";

export type ArtKind = "latte" | "espresso" | "mocha" | "iced" | "americano" | "macchiato" | "tea";

export function pickArt(name: string, temperature?: Temperature): ArtKind {
  const n = name.toLowerCase();
  if (temperature === "iced" || /\b(iced|cold|frapp|brew)\b/.test(n)) return "iced";
  if (/(espresso|doppio|ristretto|cortado|shot)/.test(n)) return "espresso";
  if (/(mocha|chocolate|cocoa)/.test(n)) return "mocha";
  if (/macchiato/.test(n)) return "macchiato";
  if (/(americano|black|drip|filter|long black)/.test(n)) return "americano";
  if (/(tea|chai|chamomile|matcha|herbal)/.test(n)) return "tea";
  return "latte";
}

function Steam({ x = 100, y = 58 }: { x?: number; y?: number }) {
  return (
    <g stroke="#fffaf3" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.9">
      {[-16, 0, 16].map((dx, i) => (
        <path
          key={dx}
          d={`M${x + dx} ${y} q -6 -10 0 -20 q 6 -10 0 -20`}
          className="animate-steam"
          style={{ animationDelay: `${i * 0.6}s`, transformBox: "fill-box", transformOrigin: "bottom" }}
        />
      ))}
    </g>
  );
}

function Saucer({ y = 160, w = 78 }: { y?: number; w?: number }) {
  return (
    <>
      <ellipse cx="100" cy={y + 4} rx={w} ry="13" fill="#2b1a12" opacity="0.12" />
      <ellipse cx="100" cy={y} rx={w} ry="12" fill="#fffaf3" />
      <ellipse cx="100" cy={y - 2} rx={w - 26} ry="6" fill="#f1e4d3" />
    </>
  );
}

/** Wide ceramic cup used by latte / cappuccino / americano / tea. */
function Cup({ fill, foam, art }: { fill: string; foam?: string; art?: "heart" | "rosetta" | "none" }) {
  return (
    <g>
      <Saucer />
      <path d="M150 108 c 22 0 22 34 -4 34" stroke="#fffaf3" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M44 96 h112 c0 40 -22 62 -56 62 s-56 -22 -56 -62z" fill="#fffaf3" />
      <path d="M44 96 h112 c0 40 -22 62 -56 62 s-56 -22 -56 -62z" fill="#2b1a12" opacity="0.05" transform="translate(4 0)" />
      <ellipse cx="100" cy="96" rx="56" ry="15" fill="#f1e4d3" />
      <ellipse cx="100" cy="97" rx="49" ry="11.5" fill={foam ?? fill} />
      {foam && <ellipse cx="100" cy="97" rx="49" ry="11.5" fill="none" stroke={fill} strokeWidth="5" opacity="0.8" />}
      {art === "heart" && (
        <path d="M100 103 c -14 -6 -18 -14 -10 -16 c 4 -1 8 1 10 4 c 2 -3 6 -5 10 -4 c 8 2 4 10 -10 16z" fill={fill} opacity="0.9" />
      )}
      {art === "rosetta" && (
        <g fill={fill} opacity="0.85">
          <ellipse cx="88" cy="97" rx="9" ry="4" />
          <ellipse cx="100" cy="97" rx="7" ry="3.4" />
          <ellipse cx="110" cy="97" rx="5" ry="2.6" />
          <rect x="84" y="96.4" width="34" height="1.4" rx="0.7" />
        </g>
      )}
    </g>
  );
}

function Espresso() {
  return (
    <g>
      <Saucer y={162} w={58} />
      <path d="M133 120 c 16 0 16 24 -2 24" stroke="#fffaf3" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M68 108 h64 c0 32 -12 50 -32 50 s-32 -18 -32 -50z" fill="#fffaf3" />
      <ellipse cx="100" cy="108" rx="32" ry="9" fill="#f1e4d3" />
      <ellipse cx="100" cy="109" rx="27" ry="6.5" fill="#b8733d" />
      <ellipse cx="96" cy="108" rx="10" ry="2.4" fill="#d79a5e" opacity="0.8" />
    </g>
  );
}

function Mocha() {
  return (
    <g>
      <Saucer />
      <path d="M146 92 c 26 0 26 40 -2 40" stroke="#4a2c21" strokeWidth="9" fill="none" strokeLinecap="round" />
      <rect x="52" y="78" width="96" height="82" rx="16" fill="#4a2c21" />
      <rect x="52" y="78" width="22" height="82" rx="11" fill="#fffaf3" opacity="0.08" />
      <path d="M58 82 c -6 -16 12 -22 18 -14 c 2 -16 26 -18 28 -2 c 6 -14 28 -8 22 8 c 14 -2 16 14 4 14 h-66 c -10 0 -14 -8 -6 -6z" fill="#fffaf3" />
      <path d="M70 74 q 10 6 20 0 t 20 0 t 20 0" stroke="#6f3b1f" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="84" cy="66" r="2.6" fill="#6f3b1f" />
      <circle cx="112" cy="62" r="2.6" fill="#6f3b1f" />
    </g>
  );
}

function Macchiato() {
  return (
    <g>
      <Saucer y={166} w={62} />
      <path d="M64 70 h72 l-8 92 h-56z" fill="#fffaf3" opacity="0.55" />
      <path d="M68 108 h64 l-4.6 50 h-54.8z" fill="#f1e4d3" />
      <path d="M67 92 h66 l-1.4 16 h-63.2z" fill="#b8733d" />
      <path d="M66 78 h68 l-1 14 h-66z" fill="#fffaf3" />
      <path d="M72 80 q 7 5 14 0 t 14 0 t 14 0 t 14 0" stroke="#c8834a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M64 70 h72 l-8 92 h-56z" fill="none" stroke="#fffaf3" strokeWidth="3" />
    </g>
  );
}

function Iced({ coffee }: { coffee: string }) {
  return (
    <g>
      <ellipse cx="100" cy="172" rx="46" ry="8" fill="#2b1a12" opacity="0.12" />
      <rect x="112" y="24" width="8" height="70" rx="4" fill="#e07a3f" transform="rotate(12 116 60)" />
      <path d="M60 60 h80 l-9 108 h-62z" fill="#fffaf3" opacity="0.5" />
      <path d="M63 96 h74 l-6 72 h-62z" fill={coffee} />
      <path d="M62 82 h76 l-1.2 14 h-73.6z" fill="#f1e4d3" />
      <path d="M64 120 q 18 8 36 0 t 36 0 l-1 10 q-18 8 -35 0 t-35 0z" fill="#f1e4d3" opacity="0.55" />
      {[[76, 88], [98, 104], [116, 86], [86, 128]].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="16" height="16" rx="4" fill="#ffffff" opacity="0.55" transform={`rotate(${(x + y) % 30} ${x + 8} ${y + 8})`} />
      ))}
      <path d="M60 60 h80 l-9 108 h-62z" fill="none" stroke="#fffaf3" strokeWidth="3" />
      <path d="M68 66 l6 96" stroke="#ffffff" strokeWidth="3" opacity="0.5" strokeLinecap="round" />
    </g>
  );
}

const ART: Record<ArtKind, { bg: string; ring: string; hot: boolean; render: () => React.ReactNode }> = {
  latte: { bg: "#e9c9a1", ring: "#d9b083", hot: true, render: () => <Cup fill="#a8693a" foam="#f6e7d2" art="heart" /> },
  americano: { bg: "#d8bfa3", ring: "#c4a582", hot: true, render: () => <Cup fill="#3b2116" art="none" /> },
  tea: { bg: "#e6d5a8", ring: "#d3bf86", hot: true, render: () => <Cup fill="#d9a85b" foam="#f3e3c3" art="rosetta" /> },
  espresso: { bg: "#d9b48f", ring: "#c39a72", hot: true, render: () => <Espresso /> },
  mocha: { bg: "#d7a98a", ring: "#c08e6c", hot: true, render: () => <Mocha /> },
  macchiato: { bg: "#ecc89b", ring: "#dcb17d", hot: true, render: () => <Macchiato /> },
  iced: { bg: "#cfe0dc", ring: "#b5cdc7", hot: false, render: () => <Iced coffee="#a8693a" /> },
};

interface CoffeeArtProps {
  kind: ArtKind;
  className?: string;
  steam?: boolean;
  title?: string;
}

export function CoffeeArt({ kind, className, steam = true, title }: CoffeeArtProps) {
  const art = ART[kind];
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={title ?? `${kind} illustration`}>
      <circle cx="100" cy="104" r="92" fill={art.bg} />
      <circle cx="100" cy="104" r="78" fill="none" stroke={art.ring} strokeWidth="1.5" strokeDasharray="2 6" />
      {art.hot && steam && <Steam />}
      {art.render()}
    </svg>
  );
}

/** Shop photo when uploaded, otherwise a matching illustration. */
export function CoffeeImage({
  item,
  temperature,
  className = "",
  sizes = "(max-width: 768px) 100vw, 400px",
}: {
  item: Pick<MenuItem, "name" | "image_url">;
  temperature?: Temperature;
  className?: string;
  sizes?: string;
}) {
  if (item.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- tenant-uploaded images live on each project's own storage host
      <img src={item.image_url} alt={item.name} sizes={sizes} className={`object-cover ${className}`} loading="lazy" />
    );
  }
  return <CoffeeArt kind={pickArt(item.name, temperature)} className={className} title={item.name} />;
}
