import { CheckCircle } from "lucide-react";
import { STATS } from "@/lib/constants";
import { SectionContainer } from "@/components/ui/CardStyles";
import { Image } from "@/components/ui/ImageComponents";
import { CTAButton } from "@/components/ui/ButtonStyles";

const HeroSection = () => {
  return (
    <SectionContainer background="white" className="py-12 md:py-20">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Professional Resume & Cover Letter Tools For Any Job
          </h1>
          <p className="text-lg md:text-xl text-gray-dark mb-8">
            Powered by AI to help you land your dream job faster. Create stunning, ATS-friendly resumes in minutes.
          </p>
          <CTAButton href="#get-started">
            Get Started
          </CTAButton>

          {/* Stats Counter */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-gray-dark">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="rounded-lg shadow-xl overflow-hidden bg-white p-1">
            <Image 
              src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&q=80" 
              alt="Resume builder interface"
              rounded="lg"
            />
          </div>
          <div className="absolute -top-5 -right-5 bg-yellow-100 p-3 rounded-lg shadow-md rotate-6">
            <CheckCircle className="h-4 w-4 text-green-500 inline mr-1" />
            <span className="text-sm font-medium">ATS-Optimized</span>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
};

export default HeroSection;
