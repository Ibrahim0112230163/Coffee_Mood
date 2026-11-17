import { BarChart3, Brain, Camera, Coffee, Lock, Palette, QrCode, ScanFace, Settings2, Sparkles, Store } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { CoffeeArt, type ArtKind } from "@/components/coffee-art";
import { buttonClass } from "@/components/ui";

const STEPS = [
  { icon: ScanFace, title: "Detect", text: "With permission, the camera reads visible facial expressions right in the browser." },
  { icon: Brain, title: "Understand", text: "We suggest a mood, and the customer confirms it or picks their own." },
  { icon: Sparkles, title: "Recommend", text: "Your café's own rules pick drinks from your live menu." },
  { icon: Coffee, title: "Enjoy", text: "Order in a tap, with size, hot or iced, and the price up front." },
];

const FEATURES = [
  { icon: Store, title: "Your café, your menu", text: "Add drinks, photos, sizes, prices and caffeine info. Turn items on and off in seconds." },
  { icon: Settings2, title: "Mood rules you control", text: "Choose which drinks match each mood, in what order, with your own messages." },
  { icon: Palette, title: "Fully on-brand", text: "Your name, logo and colours on a customer page that feels like your café." },
  { icon: QrCode, title: "QR code ready", text: "Print a QR code for tables and counters. Every café gets its own link." },
  { icon: BarChart3, title: "Insights that matter", text: "See popular moods, top drinks and how often recommendations get accepted." },
  { icon: Lock, title: "Private by design", text: "No footage leaves the device. No face data is stored, ever." },
];

const SHOWCASE: { kind: ArtKind; mood: string; drink: string }[] = [
  { kind: "macchiato", mood: "😊 Happy", drink: "Caramel Macchiato" },
  { kind: "mocha", mood: "🥺 A bit down", drink: "Hot Chocolate Mocha" },
  { kind: "espresso", mood: "😴 Tired", drink: "Double Espresso" },
  { kind: "iced", mood: "🤩 Excited", drink: "Iced Caramel Latte" },
];

export default function Home() {
  return (
    <div className="grain flex min-h-dvh flex-col bg-cream">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <BrandMark className="text-xl" />
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/login" className={buttonClass("ghost", "sm")}>
            Sign in
          </Link>
          <Link href="/signup" className={buttonClass("dark", "sm")}>
            List your café
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-8 sm:px-6 md:grid-cols-[1.15fr_1fr] md:pt-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-foam px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-coffee ring-1 ring-latte">
              <Sparkles className="size-3.5 text-ember" /> Emotion-aware coffee recommendations
            </p>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
              Your Mood.
              <br />
              Your Coffee.
              <br />
              <span className="italic text-caramel">Your Moment.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-coffee">
              Coffie Mood gives any café a delightful AI experience. Customers scan a QR code, smile at the camera, and get a drink from your menu that suits how they feel.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/shop/demo" className={buttonClass("dark", "lg")}>
                <Camera className="size-5" /> Try the demo café
              </Link>
              <Link href="/signup" className={buttonClass("secondary", "lg")}>
                Set up your café, free
              </Link>
            </div>
          </div>

          <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-4">
            {SHOWCASE.map((s, i) => (
              <div
                key={s.drink}
                className={`animate-float rounded-3xl bg-foam p-4 shadow-soft ring-1 ring-latte ${i % 2 ? "translate-y-8" : ""}`}
                style={{ animationDelay: `${i * 0.8}s` }}
              >
                <CoffeeArt kind={s.kind} className="w-full" title={s.drink} />
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-coffee">{s.mood}</p>
                <p className="font-display text-lg font-semibold leading-tight">{s.drink}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-espresso py-20 text-foam">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Detect. Understand. <span className="italic text-honey">Recommend. Enjoy.</span>
            </h2>
            <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="rounded-3xl bg-mocha/60 p-6 ring-1 ring-foam/10">
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-full bg-honey text-espresso">
                      <Icon className="size-5" />
                    </span>
                    <span className="font-display text-4xl text-foam/20">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 font-display text-2xl font-semibold">{title}</h3>
                  <p className="mt-2 text-latte/80">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* For cafés */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-ember">For coffee shops</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            An AI experience for your café, without building any AI.
          </h2>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-3xl bg-foam p-6 shadow-soft ring-1 ring-latte/70">
                <Icon className="size-6 text-caramel" />
                <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-coffee">{text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-14 flex flex-col items-start gap-4 rounded-[2rem] bg-sand p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <h3 className="font-display text-3xl font-semibold">Ready to pour some mood magic?</h3>
              <p className="mt-2 text-coffee">Create your café in a minute. We&apos;ll start you with a ready-made menu you can edit.</p>
            </div>
            <Link href="/signup" className={buttonClass("dark", "lg", "shrink-0")}>
              Get started
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-latte/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-coffee sm:flex-row sm:px-6">
          <BrandMark />
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-espresso">
              Privacy
            </Link>
            <Link href="/shop/demo" className="hover:text-espresso">
              Demo
            </Link>
            <Link href="/login" className="hover:text-espresso">
              Café sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
