import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanType } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const isDemoStudent = user.phone === '0599123456';

    // 1. Student Name
    const firstName = user.name ? user.name.split(' ')[0] : 'طالب';

    // 2. General Progress
    let generalProgress = 68; // default / demo override
    if (!isDemoStudent && user.grade && user.branch) {
      // Calculate real general progress as the average progress of all subjects
      const subjects = await this.prisma.subject.findMany({
        where: { grade: user.grade, branch: user.branch },
        include: {
          videos: { where: { status: 'PUBLISHED' } },
        },
      });

      let totalSubjectProgress = 0;
      let subjectsWithVideos = 0;

      for (const sub of subjects) {
        const totalVideos = sub.videos.length;
        if (totalVideos === 0) continue;
        subjectsWithVideos++;

        const videoIds = sub.videos.map((v) => v.id);
        const completedViews = await this.prisma.videoView.count({
          where: {
            userId,
            videoId: { in: videoIds },
            completed: true,
          },
        });

        totalSubjectProgress += (completedViews / totalVideos) * 100;
      }

      generalProgress = subjectsWithVideos > 0 ? Math.round(totalSubjectProgress / subjectsWithVideos) : 0;
    }

    // 3. Continue Learning ("متابعة التعلم")
    // Find the latest partially-watched video view for this student
    const latestPartialView = await this.prisma.videoView.findFirst({
      where: {
        userId,
        completed: false,
      },
      include: {
        video: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        lastViewed: 'desc',
      },
    });

    let continueLearning = null;
    if (latestPartialView?.video) {
      const video = latestPartialView.video;
      continueLearning = {
        videoId: video.id,
        videoTitle: video.title,
        subjectName: video.subject.name,
        unitName: `${video.subject.name} - الوحدة الأولى`,
        lessonText: video.title,
        durationSec: video.durationSec,
        timeLeftMin: 12, // mock time left
        progressPercent: 45, // mock progress
      };
    } else {
      // Fallback/Default if no watch history exists
      continueLearning = {
        videoId: 'default-video',
        videoTitle: 'الدرس الثالث: قوانين نيوتن للحركة',
        subjectName: 'الفيزياء',
        unitName: 'الفيزياء - الوحدة الأولى',
        lessonText: 'الدرس الثالث: قوانين نيوتن للحركة',
        durationSec: 3300,
        timeLeftMin: 12,
        progressPercent: 45,
      };
    }

    // 4. Today's Goals progress
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayGoals = await this.prisma.dailyGoal.findMany({
      where: {
        userId,
        dueDate: { gte: startOfToday, lte: endOfToday },
      },
    });

    const totalGoals = todayGoals.length;
    const completedGoals = todayGoals.filter((g) => g.completed).length;
    const goalsPercentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    let goalsText = `لقد أنجزت ${completedGoals} من أصل ${totalGoals} أهداف اليوم.`;
    if (completedGoals === 2 && totalGoals === 5) {
      goalsText = 'رائع! لقد أنجزت هدفين من أصل خمسة اليوم.';
    }

    const goalsSummary = {
      completedCount: completedGoals,
      totalCount: totalGoals,
      percentage: goalsPercentage,
      text: goalsText,
    };

    // 5. Daily Quiz Card
    const dailyQuiz = {
      id: 'daily-quiz-math-1',
      title: 'الاختبار اليومي متاح الآن',
      description: 'اختبر معلوماتك في الرياضيات واحصل على نقاط إضافية.',
      isAvailable: true,
      buttonText: 'ابدأ الاختبار',
      points: 20,
    };

    // 6. Suggested Subjects for Today
    const matchingSubjects = await this.prisma.subject.findMany({
      where: {
        grade: user.grade ?? undefined,
        branch: user.branch ?? undefined,
      },
      include: {
        teacher: { select: { name: true } },
      },
      take: 4,
    });

    const suggestedSubjects = matchingSubjects.map((sub, idx) => {
      const rating = parseFloat((4.5 + ((idx * 0.1) % 0.5)).toFixed(1));
      return {
        id: sub.id,
        subjectName: sub.name,
        teacherName: sub.teacher?.name ?? 'غير محدد',
        rating,
      };
    });

    // 7. Subject Shopping Section (تسوق المواد)
    const studentWithSubs = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { isActive: true, isFrozen: false, endDate: { gt: new Date() } },
          include: {
            plan: true,
            subjects: true,
          },
        },
      },
    });

    const activeSubjectIds = new Set(
      studentWithSubs?.subscriptions
        .filter((sub) => sub.plan.type !== PlanType.TRIAL)
        .flatMap((sub) => sub.subjects.map((ss) => ss.subjectId)) || []
    );

    const cartItemIds = new Set(
      (await this.prisma.cartItem.findMany({
        where: { userId },
        select: { subjectId: true },
      })).map((item) => item.subjectId)
    );

    const shoppingSubjectsRaw = await this.prisma.subject.findMany({
      where: {
        grade: user.grade ?? undefined,
        branch: user.branch ?? undefined,
      },
      include: {
        teacher: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { name: 'asc' },
    });

    const subjectShopping = shoppingSubjectsRaw.map((sub, idx) => {
      const isSubscribed = activeSubjectIds.has(sub.id);
      const isInCart = cartItemIds.has(sub.id);
      const rating = parseFloat((4.5 + ((idx * 0.1) % 0.5)).toFixed(1));

      return {
        id: sub.id,
        name: sub.name,
        priceIls: sub.priceIls,
        isSubscribed,
        isInCart,
        teacher: sub.teacher ? {
          id: sub.teacher.id,
          name: sub.teacher.name,
          avatarUrl: sub.teacher.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
          rating,
        } : null,
      };
    });

    return {
      studentName: firstName,
      generalProgress,
      continueLearning,
      todayGoals: goalsSummary,
      dailyQuiz,
      suggestedSubjects,
      subjectShopping,
    };
  }
}
