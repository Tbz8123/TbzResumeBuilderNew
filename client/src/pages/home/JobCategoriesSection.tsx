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
  Users
} from "lucide-react";

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
    <section className="bg-gray-light py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Resume Templates for All Types of Roles</h2>
          <p className="text-lg text-gray-dark max-w-2xl mx-auto">
            Industry-specific templates designed for your career path
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {categories.map((category, index) => (
            <a key={index} href="#" className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition">
              {category.icon}
              <h3 className="font-medium">{category.name}</h3>
            </a>
          ))}
        </div>
        
        <div className="text-center">
          <a href="#view-all" className="text-primary hover:text-primary-dark font-medium inline-flex items-center">
            View all categories
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};

export default JobCategoriesSection;
