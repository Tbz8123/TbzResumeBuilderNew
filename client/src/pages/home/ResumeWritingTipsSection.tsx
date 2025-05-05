import { ArrowRight } from "lucide-react";
import { SectionContainer, SectionHeading, CardStyles } from "@/components/ui/CardStyles";
import { Image } from "@/components/ui/ImageComponents";
import { AppButton } from "@/components/ui/ButtonStyles";

const ResumeWritingTipsSection = () => {
  const articles = [
    {
      title: "How to Write a Resume",
      description: "Step-by-step guide to creating a resume that gets you hired",
      image: "https://images.unsplash.com/photo-1586473219010-2ffc57b0d282?w=300&q=80",
    },
    {
      title: "Resume Formats",
      description: "Choosing the right format for your experience level",
      image: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=300&q=80",
    },
    {
      title: "Top Skills to Include",
      description: "The most in-demand skills employers are looking for",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&q=80",
    },
    {
      title: "Common Mistakes to Avoid",
      description: "Don't let these errors cost you your dream job",
      image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=300&q=80",
    },
  ];

  return (
    <SectionContainer background="white">
      <SectionHeading
        title="Resume Writing Tips and Guidance"
        subtitle="Expert advice to help you create a resume that gets results"
      />
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {articles.map((article, index) => (
          <CardStyles key={index} variant="blog">
            <a href="#" className="block">
              <div className="h-40 bg-gray-200">
                <Image 
                  src={article.image} 
                  alt={article.title} 
                  aspectRatio="video"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{article.title}</h3>
                <p className="text-gray-dark text-sm mb-3">{article.description}</p>
                <span className="text-primary font-medium inline-flex items-center text-sm">
                  Read more
                  <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </div>
            </a>
          </CardStyles>
        ))}
      </div>
      
      <div className="text-center mt-8">
        <AppButton variant="primary" href="#blog">
          Visit Our Blog
        </AppButton>
      </div>
    </SectionContainer>
  );
};

export default ResumeWritingTipsSection;
