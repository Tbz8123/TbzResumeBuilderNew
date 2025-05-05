import { CheckCircle } from "lucide-react";
import { STATS } from "@/lib/constants";
import { FullWidthSection, LargeHeading, Subheading, AppleButton } from "@/components/ui/AppleStyles";
import { AnimatedSection, AnimatedText, AnimatedImage, AnimatedCounter } from "@/components/AnimationComponents";
import { ParallaxImage } from "@/components/ParallaxSection";

const HeroSection = () => {
  return (
    <FullWidthSection 
      className="py-16 md:py-24 lg:py-32 overflow-hidden"
      backgroundColor="bg-gradient-to-b from-gray-50 to-white"
      fullHeight
    >
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <AnimatedSection animation="fadeInLeft">
          <AnimatedText
            text="Professional Resume & Cover Letter Tools For Any Job"
            tag="h1"
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            animation="fadeInUp"
            delay={0.2}
            staggerChildren
            highlightWords={["Professional", "Resume", "Cover Letter"]}
            highlightClass="text-primary font-bold"
          />
          
          <AnimatedText
            text="Powered by AI to help you land your dream job faster. Create stunning, ATS-friendly resumes in minutes."
            tag="p"
            className="text-lg md:text-xl text-gray-700 mb-8"
            animation="fadeInUp"
            delay={0.4}
          />
          
          <AnimatedSection animation="fadeInUp" delay={0.6}>
            <AppleButton 
              href="#get-started" 
              variant="primary" 
              size="large"
              className="bg-primary hover:bg-primary-dark text-white"
            >
              Get Started
            </AppleButton>
          </AnimatedSection>

          {/* Stats Counter */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, index) => (
              <AnimatedSection key={index} animation="fadeInUp" delay={0.8 + index * 0.1}>
                <div className="text-center">
                  <AnimatedCounter
                    end={parseInt(stat.value.replace(/[^0-9]/g, ''))}
                    prefix={stat.value.includes('+') ? '' : ''}
                    suffix={stat.value.includes('+') ? '+' : ''}
                    className="text-3xl md:text-4xl font-bold text-primary"
                    duration={2.5}
                  />
                  <p className="text-sm font-medium text-gray-600 mt-2">{stat.label}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>
        
        <AnimatedSection animation="fadeInRight" delay={0.4}>
          <div className="relative">
            <ParallaxImage
              src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&q=80"
              alt="Resume builder interface"
              className="rounded-xl shadow-2xl overflow-hidden"
              speed={0.1}
            />
            
            <AnimatedSection
              animation="fadeIn"
              delay={1.2}
              className="absolute -top-5 -right-5 bg-yellow-100 p-4 rounded-lg shadow-lg rotate-6 z-10"
            >
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm font-bold">ATS-Optimized</span>
              </div>
            </AnimatedSection>
            
            {/* Apple-style floating UI elements */}
            <AnimatedSection
              animation="fadeInUp"
              delay={1.4}
              className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg z-10"
            >
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-sm font-medium">Increased interview chances by 65%</span>
              </div>
            </AnimatedSection>
          </div>
        </AnimatedSection>
      </div>
    </FullWidthSection>
  );
};

export default HeroSection;
