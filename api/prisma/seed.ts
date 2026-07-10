import { PrismaClient, Grade, Branch, PlanType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SCIENTIFIC_SUBJECTS = [
  'اللغة العربية',
  'اللغة الإنجليزية',
  'الرياضيات',
  'الفيزياء',
  'الكيمياء',
  'الأحياء',
  'التكنولوجيا',
];

const LITERARY_SUBJECTS = [
  'اللغة العربية',
  'اللغة الإنجليزية',
  'الرياضيات',
  'التاريخ',
  'الجغرافيا',
  'القضايا الاجتماعية',
  'التكنولوجيا',
];

const SUBJECT_PRICES: Record<string, number> = {
  'اللغة العربية': 40.0,
  'اللغة الإنجليزية': 45.0,
  'الرياضيات': 60.0,
  'الفيزياء': 65.0,
  'الكيمياء': 55.0,
  'الأحياء': 50.0,
  'التكنولوجيا': 45.0,
  'التاريخ': 35.0,
  'الجغرافيا': 35.0,
  'القضايا الاجتماعية': 30.0,
};

// Helper to get dates for the current week's days
function getDayOfCurrentWeek(dayOffset: number): Date {
  const current = new Date();
  const day = current.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const diff = current.getDate() - day + dayOffset;
  const result = new Date(current.setDate(diff));
  result.setHours(12, 0, 0, 0);
  return result;
}

async function main() {
  console.log('Starting seed cleanup...');
  const studentPassword = await bcrypt.hash('student123', 10);
  // Clean up existing data to make the seed script idempotent
  await prisma.videoView.deleteMany({});
  await prisma.dailyGoal.deleteMany({});
  await prisma.quizResult.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.studySession.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.video.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.adminUser.deleteMany({});
  await prisma.subscriptionPlan.deleteMany({});

  console.log('Seeding Admin and Plans...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.adminUser.create({
    data: {
      email: 'admin@bina.ps',
      passwordHash: adminPassword,
      name: 'مدير النظام',
    },
  });

  const plans = [
    { type: PlanType.TRIAL, nameAr: 'تجربة مجانية', durationDays: 365, priceIls: 0, videosPerSubject: 2 },
    { type: PlanType.MONTHLY, nameAr: 'اشتراك شهري', durationDays: 30, priceIls: 49, videosPerSubject: 15 },
    { type: PlanType.QUARTERLY, nameAr: 'اشتراك فصلي', durationDays: 90, discountPercent: 10, priceIls: 132, videosPerSubject: 20 },
    { type: PlanType.YEARLY, nameAr: 'اشتراك سنوي', durationDays: 365, discountPercent: 10, priceIls: 529, videosPerSubject: 999 },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.create({ data: plan });
  }

  console.log('Seeding Teachers...');
  const teacherUser = await prisma.user.create({
    data: {
      phone: '0599000001',
      name: 'د. عمر حسان',
      role: UserRole.TEACHER,
      grade: Grade.GRADE_11,
      branch: Branch.SCIENTIFIC,
      passwordHash: studentPassword,
    },
  });

  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      name: 'د. عمر حسان',
      bio: 'معلم فيزياء - 15 سنة خبرة',
      commissionRate: 0.3,
    },
  });

  // Additional mock teachers for subjects
  const teachersData = [
    { name: 'أ. محمد علي', bio: 'معلم لغة عربية' },
    { name: 'أ. سارة أحمد', bio: 'معلمة لغة إنجليزية' },
    { name: 'أ. خالد محمود', bio: 'معلم رياضيات' },
    { name: 'أ. ريم فارس', bio: 'معلمة كيمياء' },
    { name: 'د. يوسف النجار', bio: 'معلم أحياء' },
    { name: 'م. ليلى خليل', bio: 'معلمة تكنولوجيا' },
  ];

  const teacherMap: Record<string, string> = { 'الفيزياء': teacher.id };

  for (const tData of teachersData) {
    const u = await prisma.user.create({
      data: {
        phone: `0599000${Math.floor(100 + Math.random() * 900)}`,
        name: tData.name,
        role: UserRole.TEACHER,
      },
    });
    const t = await prisma.teacher.create({
      data: {
        userId: u.id,
        name: tData.name,
        bio: tData.bio,
      },
    });
    // map names to subject teachers
    if (tData.name.includes('محمد علي')) teacherMap['اللغة العربية'] = t.id;
    else if (tData.name.includes('سارة أحمد')) teacherMap['اللغة الإنجليزية'] = t.id;
    else if (tData.name.includes('خالد محمود')) teacherMap['الرياضيات'] = t.id;
    else if (tData.name.includes('ريم فارس')) teacherMap['الكيمياء'] = t.id;
    else if (tData.name.includes('يوسف النجار')) teacherMap['الأحياء'] = t.id;
    else if (tData.name.includes('ليلى خليل')) teacherMap['التكنولوجيا'] = t.id;
  }

  console.log('Seeding Subjects and Videos...');
  const subjectMap: Record<string, any> = {};

  for (const grade of [Grade.GRADE_11, Grade.GRADE_12]) {
    for (const name of SCIENTIFIC_SUBJECTS) {
      const sTeacherId = teacherMap[name];
      const subject = await prisma.subject.create({
        data: {
          name,
          grade,
          branch: Branch.SCIENTIFIC,
          teacherId: sTeacherId,
          priceIls: SUBJECT_PRICES[name] ?? 50.0,
        },
      });

      if (grade === Grade.GRADE_11) {
        subjectMap[name] = subject;
      }

      // Configure video count for scientific subjects to align progress percentages
      let videoCount = 3;
      if (name === 'اللغة العربية') videoCount = 8;
      else if (name === 'الفيزياء') videoCount = 5; // 2 completed / 5 total = 40%
      else if (name === 'اللغة الإنجليزية') videoCount = 6; // 1 completed / 6 total = 16.7%
      else if (name === 'التكنولوجيا') videoCount = 20; // 18 completed / 20 total = 90%
      else if (name === 'الأحياء') videoCount = 20; // 1 completed / 20 total = 5%
      else if (name === 'الرياضيات') videoCount = 12;
      else if (name === 'الكيمياء') videoCount = 8;

      for (let i = 1; i <= videoCount; i++) {
        let title = `الدرس ${i}: مقدمة في ${name}`;
        if (name === 'الفيزياء') {
          if (i === 1) title = 'الدرس الأول: مقدمة في الحركة';
          else if (i === 2) title = 'الدرس الثاني: السرعة والتسارع';
          else if (i === 3) title = 'الدرس الثالث: القانون الثاني لنيوتن';
          else title = `الدرس ${i}: موضوع إضافي في الفيزياء`;
        }

        const video = await prisma.video.create({
          data: {
            subjectId: subject.id,
            teacherId: sTeacherId,
            title,
            description: `شرح تفصيلي ومبسط لـ ${title}`,
            streamUrl: `https://example.com/videos/${subject.id}-${i}.m3u8`,
            durationSec: (name === 'الفيزياء' && i === 3) ? 1710 : (1800 + i * 120),
            pdfUrl: (name === 'الفيزياء' && i === 3) ? 'https://example.com/docs/newton-second-law.pdf' : null,
            unitNumber: 1,
            orderInUnit: i,
            status: 'PUBLISHED',
          },
        });

        if (name === 'الفيزياء' && i === 3) {
          await prisma.videoChapter.createMany({
            data: [
              {
                videoId: video.id,
                title: 'مقدمة في القوى والحركة',
                startSec: 0,
                endSec: 330,
                order: 1,
                isPremium: false,
              },
              {
                videoId: video.id,
                title: 'العلاقة بين القوة والكتلة',
                startSec: 330,
                endSec: 945,
                order: 2,
                isPremium: false,
              },
              {
                videoId: video.id,
                title: 'تمارين تطبيقية وتجارب',
                startSec: 945,
                endSec: 1450,
                order: 3,
                isPremium: true,
              },
              {
                videoId: video.id,
                title: 'ملخص الوحدة وأهم القوانين',
                startSec: 1450,
                endSec: 1710,
                order: 4,
                isPremium: true,
              },
            ],
          });
        }
      }
    }

    for (const name of LITERARY_SUBJECTS) {
      await prisma.subject.create({
        data: {
          name,
          grade,
          branch: Branch.LITERARY,
          priceIls: SUBJECT_PRICES[name] ?? 50.0,
        },
      });
    }
  }

  console.log('Seeding Demo Student...');
  const demoStudent = await prisma.user.create({
    data: {
      phone: '0599123456',
      name: 'أحمد خالد',
      grade: Grade.GRADE_11,
      branch: Branch.SCIENTIFIC,
      parentPhone: '0599987654',
      role: UserRole.STUDENT,
      passwordHash: studentPassword,
    },
  });

  // Setup Trial subscription for the student
  const trialPlan = await prisma.subscriptionPlan.findUnique({ where: { type: PlanType.TRIAL } });
  if (trialPlan) {
    await prisma.subscription.create({
      data: {
        userId: demoStudent.id,
        planId: trialPlan.id,
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('Seeding Student Video Views (Progress)...');
  // Seeding video views to yield the progress percentages matching the screenshot:
  const subjectsToProgress = [
    { name: 'اللغة العربية', completedCount: 5 }, // 5 / 8 = 62.5% (~63%)
    { name: 'الفيزياء', completedCount: 2 }, // 2 / 5 = 40.0% (and 3rd is in-progress)
    { name: 'اللغة الإنجليزية', completedCount: 1 }, // 1 / 6 = 16.7% (~15%)
    { name: 'التكنولوجيا', completedCount: 18 }, // 18 / 20 = 90.0%
    { name: 'الأحياء', completedCount: 1 }, // 1 / 20 = 5.0%
  ];

  for (const subProg of subjectsToProgress) {
    const subject = subjectMap[subProg.name];
    if (!subject) continue;

    const videos = await prisma.video.findMany({
      where: { subjectId: subject.id },
      orderBy: { orderInUnit: 'asc' },
    });

    // Mark completed videos
    for (let j = 0; j < subProg.completedCount; j++) {
      if (videos[j]) {
        await prisma.videoView.create({
          data: {
            userId: demoStudent.id,
            videoId: videos[j].id,
            viewCount: 1,
            completed: true,
            lastViewed: new Date(Date.now() - j * 3600000),
          },
        });
      }
    }

    // Physics 3rd video is partially watched
    if (subProg.name === 'الفيزياء' && videos[2]) {
      await prisma.videoView.create({
        data: {
          userId: demoStudent.id,
          videoId: videos[2].id,
          viewCount: 1,
          completed: false, // in-progress
          lastViewed: new Date(),
        },
      });
    }
  }

  console.log('Seeding Student Daily Goals...');
  const goals = [
    { title: 'مشاهدة فيديو الفيزياء (قوانين نيوتن)', completed: true },
    { title: 'حل تقييم الرياضيات (التفاضل)', completed: true },
    { title: 'قراءة فصل من كتاب الكيمياء', completed: false },
    { title: 'مراجعة كلمات اللغة الإنجليزية', completed: false },
    { title: 'إرسال الواجب الأسبوعي', completed: false },
  ];

  for (const goal of goals) {
    await prisma.dailyGoal.create({
      data: {
        userId: demoStudent.id,
        title: goal.title,
        completed: goal.completed,
        dueDate: new Date(),
      },
    });
  }

  console.log('Seeding Student Quizzes and Quiz Results...');
  const quizData = [
    { title: 'اختبار الجبر', subjectName: 'الرياضيات', score: 9, offsetDays: 0 },
    { title: 'مفاهيم الديناميكا', subjectName: 'الفيزياء', score: 8, offsetDays: 1 },
    { title: 'قواعد النحو', subjectName: 'اللغة العربية', score: 6, offsetDays: 2 },
  ];

  for (const q of quizData) {
    const subject = subjectMap[q.subjectName];
    const quiz = await prisma.quiz.create({
      data: {
        title: q.title,
        subjectId: subject?.id,
        totalQuestions: 10,
      },
    });

    await prisma.quizResult.create({
      data: {
        userId: demoStudent.id,
        quizId: quiz.id,
        score: q.score,
        totalQuestions: 10,
        createdAt: new Date(Date.now() - q.offsetDays * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('Seeding Student Study Sessions (Hours)...');
  // Seeding weekly hours to match the chart: Monday = 4.5h, Sunday = 2h, etc.
  const sessions = [
    { dayOffset: 0, durationMin: 120 }, // Sunday: 2.0h
    { dayOffset: 1, durationMin: 270 }, // Monday: 4.5h
    { dayOffset: 2, durationMin: 180 }, // Tuesday: 3.0h
    { dayOffset: 3, durationMin: 90 },  // Wednesday: 1.5h
    { dayOffset: 4, durationMin: 240 }, // Thursday: 4.0h
    { dayOffset: 5, durationMin: 60 },  // Friday: 1.0h
    { dayOffset: 6, durationMin: 150 }, // Saturday: 2.5h
  ];

  for (const s of sessions) {
    await prisma.studySession.create({
      data: {
        userId: demoStudent.id,
        durationMin: s.durationMin,
        date: getDayOfCurrentWeek(s.dayOffset),
      },
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
