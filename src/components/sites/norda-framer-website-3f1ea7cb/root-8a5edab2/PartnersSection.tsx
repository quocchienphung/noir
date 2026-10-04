import Image from "next/image";
import { cn } from "@/lib/utils";
import { partners } from "@/data/sites/norda-framer-website-3f1ea7cb/home";
import { imageAsset } from "@/lib/sites/norda-framer-website-3f1ea7cb/media";
import { Columns } from "../shared/Columns";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/root-8a5edab2/partners.module.css";

/** "Our Partners": title + intro, two rows of four logo tiles framed by faint corner brackets, outro copy. */
export function PartnersSection() {
  return (
    <section className={s.partners} aria-labelledby="nd-partners-title">
      <Columns plus className={s.titleRow} mainClassName={s.titleMain}>
        <h2 id="nd-partners-title" className={cn(site.display, s.title)}>
          {partners.title[0]}
          <br />
          {partners.title[1]}
        </h2>
        <p className={cn(site.body, s.intro)}>{partners.intro}</p>
      </Columns>

      <div className={s.logos}>
        {partners.rows.map((row, r) => (
          <ul key={r} className={s.logoRow}>
            {row.map((id, i) => {
              const a = imageAsset(id);
              return (
                <li key={`${id}-${i}`} className={s.tile}>
                  <Image src={a.src} alt="Partner logotype" width={a.width} height={a.height} sizes="240px" className={s.logo} />
                  <span className={s.corners} aria-hidden="true">
                    <span className={s.cBL} />
                    <span className={s.cBR} />
                    <span className={s.cTL} />
                    <span className={s.cTR} />
                  </span>
                </li>
              );
            })}
          </ul>
        ))}
      </div>

      <Columns plus className={s.outroRow}>
        <p className={cn(site.body, s.outro)}>{partners.outro}</p>
      </Columns>
    </section>
  );
}
