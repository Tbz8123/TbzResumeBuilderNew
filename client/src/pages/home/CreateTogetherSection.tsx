import { Check } from "lucide-react";
import { SectionContainer } from "@/components/ui/CardStyles";
import { AppButton } from "@/components/ui/ButtonStyles";

const CreateTogetherSection = () => {
  const benefits = [
    "Consistent branding across all application documents",
    "Save time with pre-filled information between documents",
    "AI-powered writing assistance for both documents",
    "66% higher interview rate with matching documents",
  ];

  return (
    <SectionContainer background="white">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-bold mb-4">Create Resume & Cover Letter Together</h2>
          <p className="text-lg text-gray-dark mb-6">
            Boost your chances of getting hired by creating matching resume and cover letter that impress employers.
          </p>
          
          <ul className="space-y-4 mb-8">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-1" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
          
          <AppButton variant="primary" href="#start-now">
            Start Now
          </AppButton>
        </div>
        
        <div className="relative">
          <div className="flex justify-center">
            {/* Resume Preview */}
            <div className="bg-white rounded-lg shadow-lg p-4 w-64 z-10 transform -rotate-6">
              <div className="h-20 bg-primary rounded-t-md mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-4/5"></div>
              </div>
            </div>
            
            {/* Cover Letter Preview */}
            <div className="bg-white rounded-lg shadow-lg p-4 w-64 ml-6 z-20 transform rotate-6">
              <div className="h-8 bg-primary rounded-t-md mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="mt-4 space-y-1">
                <div className="h-2 bg-gray-200 rounded"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
                <div className="h-2 bg-gray-200 rounded w-4/5"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="absolute -bottom-6 -right-6 bg-yellow-100 p-3 rounded-lg shadow-md rotate-12">
            <span className="text-sm font-medium">Perfect Match!</span>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
};

export default CreateTogetherSection;
