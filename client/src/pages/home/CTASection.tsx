import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-16 bg-primary text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Create Your Professional Resume?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Join millions of job seekers who've found success with TbzResumeBuilder
        </p>
        <Button 
          variant="outline" 
          className="bg-white text-primary hover:bg-gray-100 font-bold py-3 px-8 text-lg shadow-md"
          asChild
        >
          <a href="#get-started">Get Started Now</a>
        </Button>
      </div>
    </section>
  );
};

export default CTASection;
