import { Award, Wand2, Bot, Clock } from "lucide-react";
import { SectionContainer, SectionHeading, CardStyles } from "@/components/ui/CardStyles";

const WhyRecommendedSection = () => {
  const features = [
    {
      icon: <Award className="w-8 h-8" />,
      title: "High-Quality Templates",
      description: "Professionally designed templates that stand out and impress recruiters",
    },
    {
      icon: <Wand2 className="w-8 h-8" />,
      title: "Easy Customization",
      description: "Flexible editing tools to personalize every aspect of your resume",
    },
    {
      icon: <Bot className="w-8 h-8" />,
      title: "ATS-Friendly Designs",
      description: "Optimized for Applicant Tracking Systems to increase interview chances",
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Saves Time & Effort",
      description: "Create a professional resume in minutes, not hours",
    },
  ];

  return (
    <SectionContainer background="white">
      <SectionHeading
        title="Why Professionals Recommend Us"
        subtitle="Join millions of job seekers who've successfully landed their dream jobs"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <CardStyles key={index} variant="feature">
            <div className="text-primary mb-4">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
            <p className="text-gray-dark">{feature.description}</p>
          </CardStyles>
        ))}
      </div>
    </SectionContainer>
  );
};

export default WhyRecommendedSection;
