import React from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { User } from '@shared/schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileText, Users, Database, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Logo from '@/components/Logo';

const AdminPage: React.FC = () => {
  const [, setLocation] = useLocation();
  
  // Check if user is admin
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });
  
  const isAdmin = user?.isAdmin;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="mb-10">
          <Logo size="medium" />
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access the admin area. Please contact an administrator if you believe this is an error.
          </AlertDescription>
        </Alert>
        <Button 
          className="mt-6" 
          variant="outline" 
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Home
        </Button>
      </div>
    );
  }
  
  const adminModules = [
    {
      title: 'Resume Templates',
      description: 'Manage resume templates, versions, and customize appearances.',
      icon: <FileText className="h-6 w-6" />,
      path: '/templates',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      title: 'Job Titles & Descriptions',
      description: 'Manage job titles and their associated description examples.',
      icon: <Database className="h-6 w-6" />,
      path: '/admin/jobs',
      color: 'bg-purple-100 text-purple-700',
    },
    {
      title: 'User Management',
      description: 'Manage user accounts, permissions, and roles.',
      icon: <Users className="h-6 w-6" />,
      path: '/admin/users',
      color: 'bg-green-100 text-green-700',
      disabled: true,
    },
  ];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          className="mr-4"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>
      
      <p className="text-gray-600 mb-8">
        Welcome to the admin dashboard. Here you can manage various aspects of the TbzResumeBuilder platform.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminModules.map((module) => (
          <Card key={module.title} className={module.disabled ? 'opacity-60' : ''}>
            <CardHeader>
              <div className={`p-2 rounded-md w-fit ${module.color}`}>
                {module.icon}
              </div>
              <CardTitle className="mt-4">{module.title}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => setLocation(module.path)}
                disabled={module.disabled}
              >
                {module.disabled ? 'Coming Soon' : 'Manage'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminPage;