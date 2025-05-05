import { ArrowRight, FileText, Edit, Download } from "lucide-react";
import { SectionContainer, SectionHeading, CardStyles } from "@/components/ui/CardStyles";

const HowItWorksSection = () => {
  const steps = [
    {
      number: 1,
      title: "Pick a template",
      description: "Choose from over 1000+ professionally designed templates",
      icon: <FileText className="w-12 h-12 text-primary-light" />,
    },
    {
      number: 2,
      title: "Enter your info",
      description: "Our AI-powered tools help you write the perfect content",
      icon: <Edit className="w-12 h-12 text-primary-light" />,
    },
    {
      number: 3,
      title: "Download or print",
      description: "Instantly download your resume in PDF, Word, or print it",
      icon: <Download className="w-12 h-12 text-primary-light" />,
    },
  ];

  return (
    <SectionContainer background="light">
      <SectionHeading
        title="How It Works"
        subtitle="Create a professional resume and cover letter in minutes with our easy three-step process"
      />

      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {steps.map((step, index) => (
          <CardStyles key={index} variant="default" className="p-6 text-center relative">
            <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              {step.number}
            </div>
            {index < steps.length - 1 && (
              <div className="absolute top-12 right-0 hidden md:block">
                <ArrowRight className="w-8 h-8 text-gray-300" />
              </div>
            )}
            <h3 className="text-xl font-bold mb-3">{step.title}</h3>
            <p className="text-gray-dark">{step.description}</p>
            <div className="mt-4">
              {step.icon}
            </div>
          </CardStyles>
        ))}
      </div>
    </SectionContainer>
  );
};

export default HowItWorksSection;
