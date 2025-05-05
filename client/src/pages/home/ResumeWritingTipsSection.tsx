import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Resume Writing Tips and Guidance</h2>
          <p className="text-lg text-gray-dark max-w-2xl mx-auto">
            Expert advice to help you create a resume that gets results
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {articles.map((article, index) => (
            <a key={index} href="#" className="bg-gray-light rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="h-40 bg-gray-200">
                <img 
                  src={article.image} 
                  alt={article.title} 
                  className="w-full h-full object-cover"
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
          ))}
        </div>
        
        <div className="text-center mt-8">
          <Button asChild variant="default" className="py-2 px-6">
            <a href="#blog">Visit Our Blog</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ResumeWritingTipsSection;
