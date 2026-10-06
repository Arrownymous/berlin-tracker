import { ImageResponse } from "next/og";
import { AppMark } from "./app-mark";

export function generateImageMetadata() {
  return [192, 512].map((n) => ({ id: String(n), size: { width: n, height: n }, contentType: "image/png" }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const n = Number(await id);
  return new ImageResponse(<AppMark size={n} />, { width: n, height: n });
}
