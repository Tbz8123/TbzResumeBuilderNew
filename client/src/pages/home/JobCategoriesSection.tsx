import {
  Briefcase,
  Wrench,
  LineChart,
  BookOpen,
  Heart,
  ShoppingBag,
  Headphones,
  Code,
  UtensilsCrossed,
  Users,
  ArrowRight
} from "lucide-react";
import { SectionContainer, SectionHeading, CardStyles } from "@/components/ui/CardStyles";

const JobCategoriesSection = () => {
  const categories = [
    { name: "Accounting", icon: <Briefcase className="text-2xl text-primary mb-2" /> },
    { name: "Engineering", icon: <Wrench className="text-2xl text-primary mb-2" /> },
    { name: "Marketing", icon: <LineChart className="text-2xl text-primary mb-2" /> },
    { name: "Education", icon: <BookOpen className="text-2xl text-primary mb-2" /> },
    { name: "Healthcare", icon: <Heart className="text-2xl text-primary mb-2" /> },
    { name: "Sales", icon: <ShoppingBag className="text-2xl text-primary mb-2" /> },
    { name: "Customer Service", icon: <Headphones className="text-2xl text-primary mb-2" /> },
    { name: "IT & Software", icon: <Code className="text-2xl text-primary mb-2" /> },
    { name: "Food Service", icon: <UtensilsCrossed className="text-2xl text-primary mb-2" /> },
    { name: "Management", icon: <Users className="text-2xl text-primary mb-2" /> },
  ];

  return (
    <SectionContainer background="light">
      <SectionHeading
        title="Resume Templates for All Types of Roles"
        subtitle="Industry-specific templates designed for your career path"
      />
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {categories.map((category, index) => (
          <CardStyles key={index} variant="default" className="p-4 text-center">
            <a href="#" className="block">
              {category.icon}
              <h3 className="font-medium">{category.name}</h3>
            </a>
          </CardStyles>
        ))}
      </div>
      
      <div className="text-center">
        <a href="#view-all" className="text-primary hover:text-primary-dark font-medium inline-flex items-center">
          View all categories
          <ArrowRight className="h-5 w-5 ml-1" />
        </a>
      </div>
    </SectionContainer>
  );
};

export default JobCategoriesSection;
