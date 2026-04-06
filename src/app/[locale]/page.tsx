import { useTranslations } from "next-intl";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { CTASection } from "@/components/home/CTASection";

export default function HomePage() {
  const t = useTranslations();

  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <HowItWorksSection />
      <CTASection />
    </>
  );
}
