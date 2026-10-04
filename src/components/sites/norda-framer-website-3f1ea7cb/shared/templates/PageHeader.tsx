import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { ImageRef } from "@/types/sites/norda-framer-website-3f1ea7cb";
import { imageAsset } from "@/lib/sites/norda-framer-website-3f1ea7cb/media";
import { Columns } from "../Columns";
import { FitText } from "../FitText";
import { HalfSpeed } from "../HalfSpeed";
import { ArrowDownIcon, PlusMarker } from "../icons";
import { RollText } from "../RollText";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/page-header.module.css";

export interface PageTitleSpec {
  text: string;
  /** viewBox widths differ because tracking is -0.07em (desktop/tablet) vs -0.05em (phone). */
  viewBoxWidth: { wide: number; phone: number };
  viewBoxHeight: number;
  fontSize: number;
  /** Layout box aspect ratio (MEASURED: box height is smaller than the SVG, which overflows centred). */
  boxRatio: number;
  /** Phone title spans the full width instead of 66%. */
  phoneFullWidth?: boolean;
}

/**
 * Listing/about/contact page header. MEASURED: 100vh image header, intro text row, oversized fit-text
 * title (66% of the content width) and a "SCROLL" link to #main-container; the header scrolls at half speed.
 */
export function PageHeader({
  image,
  objectPosition = "50% 50%",
  intro,
  title,
  tone = "light",
}: {
  image: ImageRef;
  objectPosition?: string;
  intro: string;
  title: PageTitleSpec;
  tone?: "light" | "dark";
}) {
  const img = imageAsset(image.asset);
  const fit = (vbW: number, ls: string, cls: string) => (
    <FitText
      lines={[title.text]}
      viewBox={`0 0 ${vbW} ${title.viewBoxHeight}`}
      fontSize={title.fontSize}
      letterSpacing={ls}
      lineHeight="110%"
      className={cn(s.titleSvg, cls)}
    />
  );
  return (
    <header className={cn(s.header, tone === "dark" && s.dark)}>
      <HalfSpeed className={s.inner}>
        <Image
          src={img.src}
          alt={image.alt}
          fill
          sizes="100vw"
          preload
          className={s.bg}
          style={{ objectPosition } as CSSProperties}
        />
        <div className={s.content}>
          <Columns plus className={s.introRow} mainClassName={s.introMain}>
            <PlusMarker className={s.phonePlus} aria-hidden="true" />
            <p className={cn(site.body, s.intro)}>{intro}</p>
          </Columns>
          <div className={s.titleRow}>
            <h1
              className={cn(s.title, title.phoneFullWidth && s.titlePhoneFull)}
              style={{ "--nd-title-ratio": title.boxRatio } as CSSProperties}
            >
              <span className={site.visuallyHidden}>{title.text}</span>
              {fit(title.viewBoxWidth.wide, "-0.07em", s.titleWide)}
              {fit(title.viewBoxWidth.phone, "-0.05em", s.titlePhone)}
            </h1>
            <a href="#main-container" className={s.scroll}>
              <ArrowDownIcon className={s.scrollIcon} />
              <RollText text="SCROLL" className={site.label} />
            </a>
          </div>
        </div>
      </HalfSpeed>
    </header>
  );
}
