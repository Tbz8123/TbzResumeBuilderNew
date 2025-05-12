import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { AnimatedSection, AnimatedItem } from '@/components/AnimatedSection';
import { FileText, Users, Settings, Code, Layers, LayoutGrid, FileEdit, Plus, Database, Palette, Server, Shield, Briefcase, BookText } from 'lucide-react';

const AdminHomePage = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      setLocation('/auth');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    // Instead of null, return a loading state which will redirect via the useEffect
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }

  // Define admin page categories and features
  const adminCategories = [
    {
      id: 'templates',
      name: 'Template Management',
      description: 'Create, edit and manage resume templates',
      icon: <FileText className="h-6 w-6" />,
      items: [
        {
          title: 'All Templates',
          description: 'View and manage all resume templates',
          icon: <Layers className="h-5 w-5" />,
          path: '/admin/templates/management',
          color: 'bg-blue-500'
        },
        {
          title: 'Create New Template',
          description: 'Add a new resume template',
          icon: <Plus className="h-5 w-5" />,
          path: '/admin/templates/advanced-edit?new=true',
          color: 'bg-green-500'
        },
        {
          title: 'Basic Editor',
          description: 'Simple template editor interface',
          icon: <FileEdit className="h-5 w-5" />,
          path: '/admin/templates/edit',
          color: 'bg-purple-500'
        },
        {
          title: 'Advanced Editor',
          description: 'Full-featured template editor with code access',
          icon: <Code className="h-5 w-5" />,
          path: '/admin/templates/advanced-edit',
          color: 'bg-orange-500'
        }
      ]
    },
    {
      id: 'content',
      name: 'Content Management',
      description: 'Manage job titles, descriptions, and other content',
      icon: <BookText className="h-6 w-6" />,
      items: [
        {
          title: 'Job Titles & Descriptions',
          description: 'Manage job titles and their associated descriptions',
          icon: <Briefcase className="h-5 w-5" />,
          path: '/admin/jobs',
          color: 'bg-emerald-500'
        },
        {
          title: 'Education Content',
          description: 'Manage education categories and examples',
          icon: <BookText className="h-5 w-5" />,
          path: '/admin/education',
          color: 'bg-blue-500'
        },
        {
          title: 'Skills Management',
          description: 'Manage skills and their categories',
          icon: <Layers className="h-5 w-5" />,
          path: '/admin/skills',
          color: 'bg-purple-500'
        },
        {
          title: 'Professional Summaries',
          description: 'Manage professional summary titles and descriptions',
          icon: <FileText className="h-5 w-5" />,
          path: '/admin/professional-summary',
          color: 'bg-cyan-500'
        },
        {
          title: 'Job API Test',
          description: 'Test job descriptions API functionality',
          icon: <Server className="h-5 w-5" />,
          path: '/admin/jobs/test-api',
          color: 'bg-indigo-500'
        }
      ]
    },
    {
      id: 'system',
      name: 'System Management',
      description: 'Manage system settings and configurations',
      icon: <Settings className="h-6 w-6" />,
      items: [
        {
          title: 'Users',
          description: 'Manage user accounts and permissions',
          icon: <Users className="h-5 w-5" />,
          path: '/admin/users',
          color: 'bg-indigo-500'
        },
        {
          title: 'Settings',
          description: 'Configure system settings',
          icon: <Settings className="h-5 w-5" />,
          path: '/admin/settings',
          color: 'bg-teal-500'
        },
        {
          title: 'Database',
          description: 'Database management and maintenance',
          icon: <Database className="h-5 w-5" />,
          path: '/admin/database',
          color: 'bg-cyan-500'
        },
        {
          title: 'Theme',
          description: 'Customize the application appearance',
          icon: <Palette className="h-5 w-5" />,
          path: '/admin/theme',
          color: 'bg-pink-500'
        }
      ]
    }
  ];

  return (
    <div className="container mx-auto py-10">
      <AnimatedSection animation="fadeInUp" className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Developer Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome to the TbzResumeBuilder developer portal. Manage templates, users and system settings.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-primary" />
            <span className="text-sm font-medium">Logged in as Admin: {user.username}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="col-span-full shadow-md border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Server className="h-5 w-5 mr-2 text-primary" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg flex flex-col">
                  <span className="text-xs text-green-600 font-medium">API</span>
                  <div className="flex items-center mt-1">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm font-medium">Operational</span>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg flex flex-col">
                  <span className="text-xs text-green-600 font-medium">Database</span>
                  <div className="flex items-center mt-1">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg flex flex-col">
                  <span className="text-xs text-green-600 font-medium">Storage</span>
                  <div className="flex items-center mt-1">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm font-medium">Available</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AnimatedSection>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="w-full mb-6 flex justify-center">
          {adminCategories.map(category => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="flex items-center"
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {adminCategories.map(category => (
          <TabsContent key={category.id} value={category.id}>
            <AnimatedSection>
              <h2 className="text-2xl font-semibold mb-6">{category.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.items.map((item, index) => (
                  <AnimatedItem 
                    key={item.title} 
                    delay={index * 0.1}
                    animation="fadeInUp"
                  >
                    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
                      <CardHeader>
                        <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center text-white mb-3`}>
                          {item.icon}
                        </div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription>
                          {item.description}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="mt-auto pt-2">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setLocation(item.path)}
                        >
                          <LayoutGrid className="h-4 w-4 mr-2" /> Access
                        </Button>
                      </CardFooter>
                    </Card>
                  </AnimatedItem>
                ))}
              </div>
            </AnimatedSection>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminHomePage;