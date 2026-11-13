import type { Metadata } from "next";
import ExportsClient from "./ExportsClient";

export const metadata: Metadata = { title: "Exports" };

export default function ExportsPage() {
  return <ExportsClient />;
}
