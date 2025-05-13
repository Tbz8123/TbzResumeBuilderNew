import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  Info,
  LockIcon,
  Star,
  Trophy,
  User,
  Briefcase,
  GraduationCap,
  HardHat,
  FileText,
  Files,
  Layout,
} from 'lucide-react';
import { useAchievements } from '@/hooks/use-achievements';
import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const iconMap: Record<string, React.ReactNode> = {
  Star: <Star className="h-6 w-6" />,
  User: <User className="h-6 w-6" />,
  Briefcase: <Briefcase className="h-6 w-6" />,
  GraduationCap: <GraduationCap className="h-6 w-6" />,
  Award: <Award className="h-6 w-6" />,
  FileText: <FileText className="h-6 w-6" />,
  Trophy: <Trophy className="h-6 w-6" />,
  CheckCircle: <CheckCircle className="h-6 w-6" />,
  Files: <Files className="h-6 w-6" />,
  Layout: <Layout className="h-6 w-6" />,
  Info: <Info className="h-6 w-6" />,
};

export interface AchievementsDisplayProps {
  minimized?: boolean;
}

export function AchievementsDisplay({ minimized = false }: AchievementsDisplayProps) {
  const { achievements, userAchievements, userProgress, isLoading } = useAchievements();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  if (!user) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Achievements
          </CardTitle>
          <CardDescription>Sign in to track your achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <LockIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Achievements
          </CardTitle>
          <CardDescription>Loading achievements...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedAchievements = userAchievements || [];
  const allAchievements = achievements || [];
  const totalAchievements = allAchievements.length;
  const earnedCount = earnedAchievements.length;
  const progressPercentage = totalAchievements > 0 ? (earnedCount / totalAchievements) * 100 : 0;

  // Filter achievements based on active tab
  const filteredAchievements = allAchievements.filter(achievement => {
    if (activeTab === 'all') return true;
    if (activeTab === 'earned') {
      return earnedAchievements.some(ua => ua.achievementId === achievement.id);
    }
    if (activeTab === 'locked') {
      return !earnedAchievements.some(ua => ua.achievementId === achievement.id);
    }
    return achievement.type === activeTab;
  });

  const xpPoints = userProgress?.xpPoints || 0;
  const level = userProgress?.level || 1;
  
  // For the next level calculate when it will be reached
  const xpForNextLevel = level * 100;
  const currentLevelMinXP = (level - 1) * 100;
  const xpProgress = ((xpPoints - currentLevelMinXP) / (xpForNextLevel - currentLevelMinXP)) * 100;

  if (minimized) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium">
              Level {level} • {xpPoints} XP
            </div>
            <div className="text-xs text-muted-foreground">
              {xpForNextLevel - xpPoints} XP to Level {level + 1}
            </div>
          </div>
          <Progress value={xpProgress} className="h-2" />
          
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm">
              {earnedCount} of {totalAchievements} unlocked
            </div>
            <Button variant="link" size="sm" onClick={() => setIsDialogOpen(true)} className="p-0">
              View All
            </Button>
          </div>
          
          {/* Show the last 3 earned achievements */}
          {earnedAchievements.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {earnedAchievements.slice(0, 3).map((userAchievement) => (
                <Badge 
                  key={userAchievement.id} 
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {iconMap[userAchievement.achievement.icon] || <Award className="h-3 w-3" />}
                  <span className="text-xs">{userAchievement.achievement.name}</span>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Achievements
          </CardTitle>
          <CardDescription>
            Track your progress and earn rewards as you build your resume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Level {level}</h3>
                <span className="text-sm text-muted-foreground">
                  {xpPoints} XP • {xpForNextLevel - xpPoints} XP to Level {level + 1}
                </span>
              </div>
              <Progress value={xpProgress} className="h-2.5" />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Achievements Progress</h3>
                <span className="text-sm text-muted-foreground">
                  {earnedCount} of {totalAchievements} unlocked
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2.5" />
            </div>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="earned">Earned</TabsTrigger>
              <TabsTrigger value="locked">Locked</TabsTrigger>
              <TabsTrigger value="section_completion">Sections</TabsTrigger>
              <TabsTrigger value="milestone">Milestones</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredAchievements.map((achievement) => {
                  const isEarned = earnedAchievements.some(
                    (ua) => ua.achievementId === achievement.id
                  );
                  const earnedDate = isEarned
                    ? earnedAchievements.find((ua) => ua.achievementId === achievement.id)?.unlockedAt
                    : null;

                  return (
                    <Card
                      key={achievement.id}
                      className={`border ${
                        isEarned ? 'border-yellow-500/50 bg-yellow-50/30 dark:bg-yellow-950/10' : ''
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <div className={`rounded-full p-1.5 ${isEarned ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-muted text-muted-foreground'}`}>
                            {iconMap[achievement.icon] || <Award className="h-5 w-5" />}
                          </div>
                          {achievement.name}
                          {isEarned && (
                            <Badge variant="outline" className="ml-auto border-yellow-500 text-yellow-600 dark:text-yellow-400">
                              Earned
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </CardContent>
                      <CardFooter className="flex items-center justify-between pt-0">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Trophy className="mr-1 h-4 w-4 text-yellow-500" />
                          +{achievement.xpPoints} XP
                        </div>
                        {isEarned && earnedDate && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3" />
                            {new Date(earnedDate).toLocaleDateString()}
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Achievements
            </DialogTitle>
            <DialogDescription>
              Your achievements and progress in building your resume
            </DialogDescription>
          </DialogHeader>

          <div className="mb-6 space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Level {level}</h3>
                <span className="text-sm text-muted-foreground">
                  {xpPoints} XP • {xpForNextLevel - xpPoints} XP to Level {level + 1}
                </span>
              </div>
              <Progress value={xpProgress} className="h-2.5" />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Achievements Progress</h3>
                <span className="text-sm text-muted-foreground">
                  {earnedCount} of {totalAchievements} unlocked
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2.5" />
            </div>
          </div>

          <Tabs defaultValue="all">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="earned">Earned</TabsTrigger>
              <TabsTrigger value="locked">Locked</TabsTrigger>
              <TabsTrigger value="section_completion">Sections</TabsTrigger>
              <TabsTrigger value="milestone">Milestones</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {allAchievements.map((achievement) => {
                  const isEarned = earnedAchievements.some(
                    (ua) => ua.achievementId === achievement.id
                  );
                  const earnedDate = isEarned
                    ? earnedAchievements.find((ua) => ua.achievementId === achievement.id)?.unlockedAt
                    : null;

                  return (
                    <Card
                      key={achievement.id}
                      className={`border ${
                        isEarned ? 'border-yellow-500/50 bg-yellow-50/30 dark:bg-yellow-950/10' : ''
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <div className={`rounded-full p-1.5 ${isEarned ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-muted text-muted-foreground'}`}>
                            {iconMap[achievement.icon] || <Award className="h-5 w-5" />}
                          </div>
                          {achievement.name}
                          {isEarned && (
                            <Badge variant="outline" className="ml-auto border-yellow-500 text-yellow-600 dark:text-yellow-400">
                              Earned
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </CardContent>
                      <CardFooter className="flex items-center justify-between pt-0">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Trophy className="mr-1 h-4 w-4 text-yellow-500" />
                          +{achievement.xpPoints} XP
                        </div>
                        {isEarned && earnedDate && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3" />
                            {new Date(earnedDate).toLocaleDateString()}
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="earned" className="mt-0">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {earnedAchievements.map((userAchievement) => (
                  <Card
                    key={userAchievement.id}
                    className="border border-yellow-500/50 bg-yellow-50/30 dark:bg-yellow-950/10"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className="rounded-full bg-yellow-100 p-1.5 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300">
                          {iconMap[userAchievement.achievement.icon] || <Award className="h-5 w-5" />}
                        </div>
                        {userAchievement.achievement.name}
                        <Badge variant="outline" className="ml-auto border-yellow-500 text-yellow-600 dark:text-yellow-400">
                          Earned
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-muted-foreground">
                        {userAchievement.achievement.description}
                      </p>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between pt-0">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Trophy className="mr-1 h-4 w-4 text-yellow-500" />
                        +{userAchievement.achievement.xpPoints} XP
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {new Date(userAchievement.unlockedAt).toLocaleDateString()}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
                {earnedAchievements.length === 0 && (
                  <div className="col-span-2 flex flex-col items-center justify-center py-12">
                    <AlertTriangle className="mb-2 h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">No achievements earned yet</h3>
                    <p className="text-center text-muted-foreground">
                      Complete sections of your resume to earn achievements and gain XP.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="locked" className="mt-0">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {allAchievements
                  .filter(
                    (achievement) =>
                      !earnedAchievements.some((ua) => ua.achievementId === achievement.id)
                  )
                  .map((achievement) => (
                    <Card key={achievement.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <div className="rounded-full bg-muted p-1.5 text-muted-foreground">
                            {iconMap[achievement.icon] || <Award className="h-5 w-5" />}
                          </div>
                          {achievement.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Trophy className="mr-1 h-4 w-4 text-yellow-500" />
                          +{achievement.xpPoints} XP
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="section_completion" className="mt-0">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {allAchievements
                  .filter((achievement) => achievement.type === 'section_completion')
                  .map((achievement) => {
                    const isEarned = earnedAchievements.some(
                      (ua) => ua.achievementId === achievement.id
                    );
                    const earnedDate = isEarned
                      ? earnedAchievements.find((ua) => ua.achievementId === achievement.id)
                          ?.unlockedAt
                      : null;

                    return (
                      <Card
                        key={achievement.id}
                        className={`border ${
                          isEarned ? 'border-yellow-500/50 bg-yellow-50/30 dark:bg-yellow-950/10' : ''
                        }`}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <div
                              className={`rounded-full p-1.5 ${
                                isEarned
                                  ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {iconMap[achievement.icon] || <Award className="h-5 w-5" />}
                            </div>
                            {achievement.name}
                            {isEarned && (
                              <Badge
                                variant="outline"
                                className="ml-auto border-yellow-500 text-yellow-600 dark:text-yellow-400"
                              >
                                Earned
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </CardContent>
                        <CardFooter className="flex items-center justify-between pt-0">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Trophy className="mr-1 h-4 w-4 text-yellow-500" />
                            +{achievement.xpPoints} XP
                          </div>
                          {isEarned && earnedDate && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="mr-1 h-3 w-3" />
                              {new Date(earnedDate).toLocaleDateString()}
                            </div>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
              </div>
            </TabsContent>

            <TabsContent value="milestone" className="mt-0">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {allAchievements
                  .filter((achievement) => achievement.type === 'milestone')
                  .map((achievement) => {
                    const isEarned = earnedAchievements.some(
                      (ua) => ua.achievementId === achievement.id
                    );
                    const earnedDate = isEarned
                      ? earnedAchievements.find((ua) => ua.achievementId === achievement.id)
                          ?.unlockedAt
                      : null;

                    return (
                      <Card
                        key={achievement.id}
                        className={`border ${
                          isEarned ? 'border-yellow-500/50 bg-yellow-50/30 dark:bg-yellow-950/10' : ''
                        }`}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <div
                              className={`rounded-full p-1.5 ${
                                isEarned
                                  ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {iconMap[achievement.icon] || <Award className="h-5 w-5" />}
                            </div>
                            {achievement.name}
                            {isEarned && (
                              <Badge
                                variant="outline"
                                className="ml-auto border-yellow-500 text-yellow-600 dark:text-yellow-400"
                              >
                                Earned
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </CardContent>
                        <CardFooter className="flex items-center justify-between pt-0">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Trophy className="mr-1 h-4 w-4 text-yellow-500" />
                            +{achievement.xpPoints} XP
                          </div>
                          {isEarned && earnedDate && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="mr-1 h-3 w-3" />
                              {new Date(earnedDate).toLocaleDateString()}
                            </div>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}