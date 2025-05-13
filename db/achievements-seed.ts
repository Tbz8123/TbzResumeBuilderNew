import { db } from './index';
import { achievements, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function seedAchievements() {
  console.log('Seeding achievements...');
  
  // Check if achievements already exist
  const existingAchievements = await db.query.achievements.findMany();
  if (existingAchievements.length > 0) {
    console.log(`Found ${existingAchievements.length} existing achievements. Skipping seed.`);
    return;
  }

  const achievementsList = [
    {
      name: 'Getting Started',
      description: 'Create your first resume',
      icon: 'Star',
      xpPoints: 10,
      type: 'milestone',
      triggerCondition: { type: 'create_resume', count: 1 }
    },
    {
      name: 'Personal Information Pro',
      description: 'Complete your personal information section',
      icon: 'User',
      xpPoints: 15,
      type: 'section_completion',
      triggerCondition: { section: 'personal_info', status: 'completed' }
    },
    {
      name: 'Work History Expert',
      description: 'Add at least 2 work experiences',
      icon: 'Briefcase',
      xpPoints: 20,
      type: 'section_completion',
      triggerCondition: { section: 'work_history', itemCount: 2 }
    },
    {
      name: 'Education Achiever',
      description: 'Complete your education section',
      icon: 'GraduationCap',
      xpPoints: 15,
      type: 'section_completion',
      triggerCondition: { section: 'education', status: 'completed' }
    },
    {
      name: 'Skills Master',
      description: 'Add at least 5 skills to your resume',
      icon: 'Award',
      xpPoints: 20,
      type: 'section_completion',
      triggerCondition: { section: 'skills', itemCount: 5 }
    },
    {
      name: 'Summary Writer',
      description: 'Create a professional summary',
      icon: 'FileText',
      xpPoints: 15,
      type: 'section_completion',
      triggerCondition: { section: 'professional_summary', status: 'completed' }
    },
    {
      name: 'Resume Completionist',
      description: 'Complete all sections of your resume',
      icon: 'CheckCircle',
      xpPoints: 50,
      type: 'quality',
      triggerCondition: { allSections: ['personal_info', 'work_history', 'education', 'skills', 'professional_summary'], status: 'completed' }
    },
    {
      name: 'Level 5 Resume Builder',
      description: 'Reach level 5 by earning XP points',
      icon: 'Trophy',
      xpPoints: 25,
      type: 'level',
      triggerCondition: { level: 5 }
    },
    {
      name: 'Resume Expert',
      description: 'Create 3 different resumes',
      icon: 'Files',
      xpPoints: 30,
      type: 'milestone',
      triggerCondition: { type: 'create_resume', count: 3 }
    },
    {
      name: 'Template Explorer',
      description: 'Try 3 different resume templates',
      icon: 'Layout',
      xpPoints: 20,
      type: 'milestone',
      triggerCondition: { type: 'use_template', count: 3 }
    }
  ];

  try {
    // Insert achievements
    const insertedAchievements = await db.insert(achievements).values(
      achievementsList.map(achievement => ({
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        xpPoints: achievement.xpPoints,
        type: achievement.type,
        triggerCondition: achievement.triggerCondition
      }))
    ).returning();

    console.log(`Seeded ${insertedAchievements.length} achievements`);
  } catch (error) {
    console.error('Error seeding achievements:', error);
  }
}

export async function resetUserProgress(userId: number) {
  try {
    // Reset XP and level for the user
    await db.update(users)
      .set({ xpPoints: 0, level: 1 })
      .where(eq(users.id, userId));
      
    console.log(`Reset progress for user ${userId}`);
  } catch (error) {
    console.error('Error resetting user progress:', error);
  }
}