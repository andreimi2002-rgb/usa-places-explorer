import type { Metadata } from "next";
import { buildGameData } from "@/features/lifesim/data";
import { Game } from "@/features/lifesim/ui/game";

export const metadata: Metadata = { title: "America 360: Life" };

export default function PlayPage() {
  return <Game data={buildGameData()} />;
}
