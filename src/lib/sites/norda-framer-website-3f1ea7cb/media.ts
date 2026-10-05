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

/** CSS width / height of an image box per breakpoint (phone < 810 ≤ tablet < 1200 ≤ desktop). */
export interface ResponsiveLength {
  desktop: string;
  tablet: string;
  phone: string;
}

/** Content width: viewport minus both gutters (64 / 48 / 24). */
export const CONTENT_WIDTH: ResponsiveLength = {
  desktop: "calc(100vw - 128px)",
  tablet: "calc(100vw - 96px)",
  phone: "calc(100vw - 48px)",
};

/** Main (2fr) column of the three-column rule (624px at 1440, ≈603px at 1024). */
export const MAIN_WIDTH: ResponsiveLength = {
  desktop: "calc(50vw - 96px)",
  tablet: "calc(66.67vw - 72px)",
  phone: "calc(100vw - 48px)",
};

const all = (v: string): ResponsiveLength => ({ desktop: v, tablet: v, phone: v });

/**
 * `sizes` for an `object-fit: cover` image. A cover image renders at the larger of the box width and the
 * box height × the image's aspect ratio, so tall boxes must request more pixels than their width suggests
 * (with width-only `sizes`, phone covers were upscaled up to ×4). `extraHeight` adds parallax overscan.
 */
export function coverSizes(
  id: string,
  width: ResponsiveLength | string,
  height: ResponsiveLength | string,
  extraHeight = "0px",
): string {
  const { width: w, height: h } = imageAsset(id);
  const ratio = (w / h).toFixed(4);
  const W = typeof width === "string" ? all(width) : width;
  const H = typeof height === "string" ? all(height) : height;
  const size = (bw: string, bh: string) => `max(${bw}, calc((${bh} + ${extraHeight}) * ${ratio}))`;
  return [
    `(min-width: 1200px) ${size(W.desktop, H.desktop)}`,
    `(min-width: 810px) ${size(W.tablet, H.tablet)}`,
    size(W.phone, H.phone),
  ].join(", ");
}
