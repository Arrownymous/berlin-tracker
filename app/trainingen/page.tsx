import type { Metadata } from "next";
import Workouts from "@/components/Workouts";

export const metadata: Metadata = { title: "Trainingen · Berlin 2027" };

export default function Page() {
  return <Workouts />;
}
