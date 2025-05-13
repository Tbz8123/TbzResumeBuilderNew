import HeroSection from "./HeroSection";
import HowItWorksSection from "./HowItWorksSection";
import WhyRecommendedSection from "./WhyRecommendedSection";
import IndustryTemplatesSection from "./IndustryTemplatesSection";
import ResumeTemplatesSection from "./ResumeTemplatesSection";
import CreateTogetherSection from "./CreateTogetherSection";
import FreshLooksSection from "./FreshLooksSection";
import JobCategoriesSection from "./JobCategoriesSection";
import ResumeWritingTipsSection from "./ResumeWritingTipsSection";
import CTASection from "./CTASection";
import { AchievementsDisplay } from "@/components/achievements/AchievementsDisplay";

const HomePage = () => {
  return (
    <>
      <HeroSection />
      
      {/* Achievements Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <AchievementsDisplay />
          </div>
        </div>
      </section>
      
      <HowItWorksSection />
      <WhyRecommendedSection />
      <IndustryTemplatesSection />
      <ResumeTemplatesSection />
      <CreateTogetherSection />
      <FreshLooksSection />
      <JobCategoriesSection />
      <ResumeWritingTipsSection />
      <CTASection />
    </>
  );
};

export default HomePage;
