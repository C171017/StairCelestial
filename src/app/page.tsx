"use client";

import dynamic from "next/dynamic";
import { AudioConsentGate } from "@/components/ui/AudioConsentGate";
import { SiteAudioProvider } from "@/hooks/useSiteAudio";

const StairwayScene = dynamic(
  () =>
    import("@/components/scene/StairwayScene").then((mod) => mod.StairwayScene),
  {
    ssr: false,
    loading: () => null,
  },
);

export default function HomePage() {
  return (
    <SiteAudioProvider>
      <main
        id="portfolio-scroll-surface"
        className="relative h-dvh w-dvw overflow-hidden bg-[#030508] touch-none"
      >
        <div className="relative z-0 h-full w-full">
          <StairwayScene />
        </div>
        <AudioConsentGate />
      </main>
    </SiteAudioProvider>
  );
}
