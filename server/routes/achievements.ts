import { Express } from 'express';
import { db } from '@db';
import { achievements, userAchievements, userProgress, users } from '@shared/schema';
import { and, eq, sql } from 'drizzle-orm';

export function registerAchievementRoutes(app: Express) {
  // Get all achievements
  app.get('/api/achievements', async (req, res) => {
    try {
      const allAchievements = await db.query.achievements.findMany({
        orderBy: (achievements, { asc }) => [asc(achievements.name)]
      });
      
      return res.status(200).json(allAchievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return res.status(500).json({ error: 'Failed to fetch achievements' });
    }
  });

  // Get user's achievements
  app.get('/api/user-achievements', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const userAchievementsWithDetails = await db.query.userAchievements.findMany({
        where: eq(userAchievements.userId, req.user.id),
        with: {
          achievement: true
        },
        orderBy: (userAchievements, { desc }) => [desc(userAchievements.unlockedAt)]
      });
      
      return res.status(200).json(userAchievementsWithDetails);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return res.status(500).json({ error: 'Failed to fetch user achievements' });
    }
  });

  // Get user's progress
  app.get('/api/user-progress', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const progressData = await db.query.userProgress.findMany({
        where: eq(userProgress.userId, req.user.id)
      });
      
      const userData = await db.query.users.findFirst({
        where: eq(users.id, req.user.id),
        columns: {
          xpPoints: true,
          level: true
        }
      });
      
      return res.status(200).json({
        progress: progressData,
        xpPoints: userData?.xpPoints || 0,
        level: userData?.level || 1
      });
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return res.status(500).json({ error: 'Failed to fetch user progress' });
    }
  });

  // Update section progress
  app.post('/api/user-progress/:sectionKey', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sectionKey } = req.params;
    const { status, progress } = req.body;

    if (!sectionKey || !status || typeof progress !== 'number') {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // Check if progress record exists
      const existingProgress = await db.query.userProgress.findFirst({
        where: and(
          eq(userProgress.userId, req.user.id),
          eq(userProgress.sectionKey, sectionKey)
        )
      });

      let updatedProgress;

      if (existingProgress) {
        // Update existing record
        [updatedProgress] = await db.update(userProgress)
          .set({ 
            status, 
            progress,
            updatedAt: new Date()
          })
          .where(and(
            eq(userProgress.userId, req.user.id),
            eq(userProgress.sectionKey, sectionKey)
          ))
          .returning();
      } else {
        // Create new record
        [updatedProgress] = await db.insert(userProgress)
          .values({
            userId: req.user.id,
            sectionKey,
            status,
            progress
          })
          .returning();
      }

      // Check for section completion achievements
      await checkSectionCompletionAchievements(req.user.id, sectionKey, status, progress);
      
      return res.status(200).json(updatedProgress);
    } catch (error) {
      console.error('Error updating progress:', error);
      return res.status(500).json({ error: 'Failed to update progress' });
    }
  });

  // Earn achievement
  app.post('/api/achievements/:achievementId/earn', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { achievementId } = req.params;
    
    try {
      // Check if achievement exists
      const achievement = await db.query.achievements.findFirst({
        where: eq(achievements.id, parseInt(achievementId))
      });

      if (!achievement) {
        return res.status(404).json({ error: 'Achievement not found' });
      }

      // Check if user already has this achievement
      const existingUserAchievement = await db.query.userAchievements.findFirst({
        where: and(
          eq(userAchievements.userId, req.user.id),
          eq(userAchievements.achievementId, achievement.id)
        )
      });

      if (existingUserAchievement) {
        return res.status(409).json({ error: 'Achievement already earned' });
      }

      // Award the achievement and add XP
      const [userAchievement] = await db.insert(userAchievements)
        .values({
          userId: req.user.id,
          achievementId: achievement.id
        })
        .returning();

      // Add XP points to user
      await db.update(users)
        .set({ 
          xpPoints: sql`${users.xpPoints} + ${achievement.xpPoints}`,
          // Level up logic - simple formula: level = 1 + (xp / 100)
          level: sql`1 + floor((${users.xpPoints} + ${achievement.xpPoints}) / 100)`
        })
        .where(eq(users.id, req.user.id));

      // Get updated user
      const updatedUser = await db.query.users.findFirst({
        where: eq(users.id, req.user.id),
        columns: {
          xpPoints: true,
          level: true
        }
      });

      return res.status(201).json({
        achievement: userAchievement,
        xpPoints: updatedUser?.xpPoints || 0,
        level: updatedUser?.level || 1
      });
    } catch (error) {
      console.error('Error earning achievement:', error);
      return res.status(500).json({ error: 'Failed to earn achievement' });
    }
  });
}

// Helper functions for achievement logic
async function checkSectionCompletionAchievements(userId: number, sectionKey: string, status: string, progress: number) {
  try {
    if (status === 'completed' && progress === 100) {
      // Find section completion achievements for this section
      const sectionAchievements = await db.query.achievements.findMany({
        where: sql`${achievements.type} = 'section_completion' AND ${achievements.triggerCondition}->>'section' = ${sectionKey}`
      });

      for (const achievement of sectionAchievements) {
        // Check if user already has this achievement
        const existingAchievement = await db.query.userAchievements.findFirst({
          where: and(
            eq(userAchievements.userId, userId),
            eq(userAchievements.achievementId, achievement.id)
          )
        });

        if (!existingAchievement) {
          // Award the achievement
          await db.insert(userAchievements)
            .values({
              userId,
              achievementId: achievement.id
            });

          // Add XP points
          await db.update(users)
            .set({ 
              xpPoints: sql`${users.xpPoints} + ${achievement.xpPoints}`,
              level: sql`1 + floor((${users.xpPoints} + ${achievement.xpPoints}) / 100)`
            })
            .where(eq(users.id, userId));
        }
      }

      // Check if all sections are completed (Resume Completionist achievement)
      await checkAllSectionsCompleted(userId);
    }
  } catch (error) {
    console.error('Error checking section completion achievements:', error);
  }
}

async function checkAllSectionsCompleted(userId: number) {
  try {
    // Get all user progress
    const allProgress = await db.query.userProgress.findMany({
      where: eq(userProgress.userId, userId)
    });

    // Check if all required sections are completed
    const requiredSections = ['personal_info', 'work_history', 'education', 'skills', 'professional_summary'];
    const completedSections = allProgress.filter(p => p.status === 'completed' && p.progress === 100);
    
    const allRequired = requiredSections.every(section => 
      completedSections.some(p => p.sectionKey === section)
    );

    if (allRequired) {
      // Find the "Resume Completionist" achievement
      const achievement = await db.query.achievements.findFirst({
        where: sql`${achievements.type} = 'quality' AND ${achievements.name} = 'Resume Completionist'`
      });

      if (achievement) {
        // Check if user already has this achievement
        const existingAchievement = await db.query.userAchievements.findFirst({
          where: and(
            eq(userAchievements.userId, userId),
            eq(userAchievements.achievementId, achievement.id)
          )
        });

        if (!existingAchievement) {
          // Award the achievement
          await db.insert(userAchievements)
            .values({
              userId,
              achievementId: achievement.id
            });

          // Add XP points
          await db.update(users)
            .set({ 
              xpPoints: sql`${users.xpPoints} + ${achievement.xpPoints}`,
              level: sql`1 + floor((${users.xpPoints} + ${achievement.xpPoints}) / 100)`
            })
            .where(eq(users.id, userId));
        }
      }
    }
  } catch (error) {
    console.error('Error checking all sections completed:', error);
  }
}