import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand";

export const metadata: Metadata = { title: "Privacy" };

const SECTIONS = [
  {
    title: "The camera is always optional",
    body: "The camera only turns on after you press a button and your browser asks for permission. You can stop it at any time, and you can always pick your mood yourself instead.",
  },
  {
    title: "Analysis happens on your device",
    body: "Facial expression analysis runs inside your browser using an on-device model (MediaPipe Face Landmarker). Video frames are read in memory, turned into a handful of expression measurements, and discarded. No image or video is ever saved, uploaded or shared, and the camera switches off as soon as the estimate is ready.",
  },
  {
    title: "We don't identify anyone",
    body: "Coffie Mood does not recognise faces, create face profiles, or link a session to a person. The model measures expressions such as a smile or raised eyebrows. It cannot tell who you are.",
  },
  {
    title: "It's an estimate, not a diagnosis",
    body: "Expressions don't always reflect feelings. Our suggestion is a playful guess to help choose a drink. It is not a psychological or medical assessment, and you can always correct it.",
  },
  {
    title: "What the café sees",
    body: "Cafés receive anonymous counts: which mood label was suggested and confirmed, which drink was recommended and whether it was chosen. If you place an order, they receive the order items and the optional name you type for pickup.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="grain min-h-dvh bg-cream px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/">
          <BrandMark className="text-xl" />
        </Link>
        <h1 className="mt-10 font-display text-5xl font-semibold tracking-tight">Privacy, brewed in.</h1>
        <p className="mt-4 text-lg text-coffee">Here is exactly what happens when you use Coffie Mood.</p>
        <div className="mt-10 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="font-display text-2xl font-semibold">{s.title}</h2>
              <p className="mt-2 leading-relaxed text-mocha">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
