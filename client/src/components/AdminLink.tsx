import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@shared/schema';

const AdminLink: React.FC = () => {
  // Check if user is admin
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });
  
  // Only show admin link if user is an admin
  if (isLoading || !user?.isAdmin) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        variant="outline" 
        size="sm" 
        className="rounded-full bg-white shadow-md border-gray-200 hover:bg-gray-50"
        asChild
      >
        <Link href="/admin/dashboard">
          <Shield className="h-4 w-4 mr-2 text-purple-600" />
          Admin Dashboard
        </Link>
      </Button>
    </div>
  );
};

export default AdminLink;