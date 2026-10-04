import { assets, type AssetId } from "@/data/sites/norda-framer-website-3f1ea7cb/assets";
import type { MediaAsset } from "@/types/sites/norda-framer-website-3f1ea7cb";

export interface ImageAsset {
  src: string;
  width: number;
  height: number;
}

/** Looks up a downloaded image by asset id with its intrinsic size (throws on unknown ids at build time). */
export function imageAsset(id: string): ImageAsset {
  const a = (assets as Record<string, MediaAsset>)[id as AssetId];
  if (!a || a.kind === "video") throw new Error(`Unknown image asset: ${id}`);
  return { src: a.src, width: a.width ?? 1, height: a.height ?? 1 };
}
