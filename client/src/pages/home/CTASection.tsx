import { SectionContainer, SectionHeading } from "@/components/ui/CardStyles";
import { AppButton } from "@/components/ui/ButtonStyles";
import { BRAND } from "@/lib/constants";

const CTASection = () => {
  return (
    <SectionContainer background="primary" className="text-center">
      <h2 className="text-3xl font-bold mb-6">Ready to Create Your Professional Resume?</h2>
      <p className="text-xl mb-8 max-w-2xl mx-auto">
        Join millions of job seekers who've found success with {BRAND.name}
      </p>
      <AppButton 
        variant="outline" 
        className="bg-white text-primary hover:bg-gray-100 font-bold shadow-md"
        size="lg"
        href="/experience-level"
      >
        Create Your Resume Now
      </AppButton>
    </SectionContainer>
  );
};

export default CTASection;
