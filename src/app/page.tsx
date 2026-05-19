"use client";

import dynamic from "next/dynamic";
import { ProjectOverlay } from "@/components/ui/ProjectOverlay";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

const StairwayScene = dynamic(
  () =>
    import("@/components/scene/StairwayScene").then((mod) => mod.StairwayScene),
  {
    ssr: false,
    loading: () => <LoadingScreen />,
  },
);

export default function HomePage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#030508]">
      <StairwayScene />
      <ProjectOverlay />
    </main>
  );
}
