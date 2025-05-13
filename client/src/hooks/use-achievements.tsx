import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Achievement, UserAchievement } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface UserProgressEntry {
  id: number;
  userId: number;
  sectionKey: string;
  status: string;
  progress: number;
  updatedAt: string;
  createdAt: string;
}

interface UserProgressData {
  progress: UserProgressEntry[];
  xpPoints: number;
  level: number;
}

interface AchievementContextType {
  achievements: Achievement[] | undefined;
  userAchievements: (UserAchievement & { achievement: Achievement })[] | undefined;
  userProgress: UserProgressData | undefined;
  isLoading: boolean;
  updateSectionProgress: (sectionKey: string, status: string, progress: number) => Promise<void>;
  earnAchievement: (achievementId: number) => Promise<void>;
  refreshUserAchievements: () => void;
}

export const AchievementContext = createContext<AchievementContextType | null>(null);

export function AchievementProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const isAuthenticated = !!user;

  // Query for all achievements
  const { 
    data: achievements,
    isLoading: isAchievementsLoading 
  } = useQuery({
    queryKey: ['/api/achievements'],
    enabled: true, // Everyone can see achievements
  });

  // Query for user's achievements
  const { 
    data: userAchievements,
    isLoading: isUserAchievementsLoading,
    refetch: refetchUserAchievements
  } = useQuery({
    queryKey: ['/api/user-achievements'],
    enabled: isAuthenticated,
  });

  // Query for user's progress
  const { 
    data: userProgress,
    isLoading: isUserProgressLoading,
    refetch: refetchUserProgress
  } = useQuery({
    queryKey: ['/api/user-progress'],
    enabled: isAuthenticated,
  });

  // Mutation to update section progress
  const updateSectionProgressMutation = useMutation({
    mutationFn: async ({
      sectionKey,
      status,
      progress,
    }: {
      sectionKey: string;
      status: string;
      progress: number;
    }) => {
      const response = await fetch(`/api/user-progress/${sectionKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, progress }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update progress');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate user progress and achievements queries
      queryClient.invalidateQueries({ queryKey: ['/api/user-progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-achievements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] }); // To update XP in user profile
      
      toast({
        title: 'Progress updated',
        description: 'Your progress has been saved',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation to earn an achievement
  const earnAchievementMutation = useMutation({
    mutationFn: async (achievementId: number) => {
      const response = await fetch(`/api/achievements/${achievementId}/earn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to earn achievement');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Find the achievement that was earned
      const achievement = achievements?.find(
        (a) => a.id === data.achievement.achievementId
      );

      if (achievement) {
        toast({
          title: '🏆 Achievement Unlocked!',
          description: `${achievement.name}: ${achievement.description}. +${achievement.xpPoints} XP!`,
          duration: 5000,
        });
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/user-achievements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] }); // To update XP in user profile
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const isLoading = isAchievementsLoading || isUserAchievementsLoading || isUserProgressLoading;

  // Wrap mutations in more convenient functions
  const updateSectionProgress = async (sectionKey: string, status: string, progress: number) => {
    await updateSectionProgressMutation.mutateAsync({ sectionKey, status, progress });
  };

  const earnAchievement = async (achievementId: number) => {
    await earnAchievementMutation.mutateAsync(achievementId);
  };

  const refreshUserAchievements = () => {
    refetchUserAchievements();
    refetchUserProgress();
  };

  const value = useMemo(
    () => ({
      achievements,
      userAchievements,
      userProgress,
      isLoading,
      updateSectionProgress,
      earnAchievement,
      refreshUserAchievements,
    }),
    [
      achievements,
      userAchievements,
      userProgress,
      isLoading,
      updateSectionProgress,
      earnAchievement,
      refreshUserAchievements,
    ]
  );

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
}

export function useAchievements() {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
}