import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  Briefcase, 
  Users, 
  Settings, 
  Home, 
  Layout,
} from "lucide-react";
import { User } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AdminDashboardPage = () => {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const adminSections = [
    {
      title: "Templates",
      description: "Manage resume templates, create new ones, and update existing templates.",
      icon: <FileText className="h-10 w-10 text-primary" />,
      link: "/admin/templates",
      count: "4 templates",
    },
    {
      title: "Job Titles & Descriptions",
      description: "Manage job titles and their associated descriptions for the resume wizard.",
      icon: <Briefcase className="h-10 w-10 text-primary" />,
      link: "/admin/jobs",
      count: "500+ job titles",
    },
    {
      title: "Users",
      description: "View and manage user accounts and permissions.",
      icon: <Users className="h-10 w-10 text-primary" />,
      link: "/admin/users",
      count: "Coming soon",
    },
    {
      title: "Settings",
      description: "Configure application settings and preferences.",
      icon: <Settings className="h-10 w-10 text-primary" />,
      link: "/admin/settings",
      count: "Coming soon",
    },
  ];

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back, {user?.username}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Site
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/templates/new">
              <FileText className="mr-2 h-4 w-4" />
              New Template
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {adminSections.map((section, index) => (
          <Card key={index} className="overflow-hidden border border-gray-200 hover:border-primary hover:shadow-md transition-all">
            <Link href={section.link} className="block h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  {section.icon}
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {section.count}
                  </span>
                </div>
                <CardTitle className="mt-4">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardFooter className="pt-2 border-t bg-gray-50">
                <div className="flex items-center text-primary text-sm font-medium">
                  Manage
                  <Layout className="ml-2 h-4 w-4" />
                </div>
              </CardFooter>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboardPage;