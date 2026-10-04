import { CHROME_REVEAL_ATTR } from "@/lib/sites/norda-framer-website-3f1ea7cb/chrome";
import { HomeHero } from "@/components/sites/norda-framer-website-3f1ea7cb/root-8a5edab2/HomeHero";
import { AboutSection } from "@/components/sites/norda-framer-website-3f1ea7cb/root-8a5edab2/AboutSection";
import { VideoAwards } from "@/components/sites/norda-framer-website-3f1ea7cb/root-8a5edab2/VideoAwards";
import { ServicesSection } from "@/components/sites/norda-framer-website-3f1ea7cb/root-8a5edab2/ServicesSection";
import { PartnersSection } from "@/components/sites/norda-framer-website-3f1ea7cb/root-8a5edab2/PartnersSection";
import { FeaturedArticle } from "@/components/sites/norda-framer-website-3f1ea7cb/root-8a5edab2/FeaturedArticle";
import { Testimonials } from "@/components/sites/norda-framer-website-3f1ea7cb/root-8a5edab2/Testimonials";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/root-8a5edab2/home.module.css";

// Source: https://norda.framer.website/ (page key root-8a5edab2)
export default function HomePage() {
  return (
    <>
      <HomeHero />
      <main className={s.main} {...{ [CHROME_REVEAL_ATTR]: "" }} data-nd-menu-delay="3">
        <AboutSection />
        <VideoAwards />
        <ServicesSection />
        <PartnersSection />
        <FeaturedArticle />
        <Testimonials />
      </main>
    </>
  );
}
