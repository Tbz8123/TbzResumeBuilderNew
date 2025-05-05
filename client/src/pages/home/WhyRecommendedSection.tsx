import { Award, Wand2, Bot, Clock } from "lucide-react";

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
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Professionals Recommend Us</h2>
          <p className="text-lg text-gray-dark max-w-2xl mx-auto">
            Join millions of job seekers who've successfully landed their dream jobs
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-light rounded-lg p-6">
              <div className="text-primary mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-dark">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyRecommendedSection;
