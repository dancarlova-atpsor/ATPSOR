import { HeroAssociation } from "@/components/home/HeroAssociation";
import { MissionSection } from "@/components/home/MissionSection";
import { ProblemsSection } from "@/components/home/ProblemsSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { JoinCTA } from "@/components/home/JoinCTA";

export default function HomePage() {
  return (
    <>
      <HeroAssociation />
      <MissionSection />
      <ProblemsSection />
      <ServicesSection />
      <JoinCTA />
    </>
  );
}
