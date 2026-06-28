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

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.adminUser.upsert({
    where: { email: 'admin@bina.ps' },
    update: {},
    create: {
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
    await prisma.subscriptionPlan.upsert({
      where: { type: plan.type },
      update: plan,
      create: plan,
    });
  }

  const teacherUser = await prisma.user.upsert({
    where: { phone: '0599000001' },
    update: {},
    create: {
      phone: '0599000001',
      name: 'أ. محمد أحمد',
      role: UserRole.TEACHER,
      grade: Grade.GRADE_11,
      branch: Branch.SCIENTIFIC,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      name: 'أ. محمد أحمد',
      bio: 'معلم فيزياء - 15 سنة خبرة',
      commissionRate: 0.3,
    },
  });

  for (const grade of [Grade.GRADE_11, Grade.GRADE_12]) {
    for (const name of SCIENTIFIC_SUBJECTS) {
      const subject = await prisma.subject.upsert({
        where: { name_grade_branch: { name, grade, branch: Branch.SCIENTIFIC } },
        update: {},
        create: {
          name,
          grade,
          branch: Branch.SCIENTIFIC,
          teacherId: name === 'الفيزياء' ? teacher.id : undefined,
        },
      });

      if (name === 'الفيزياء') {
        for (let i = 1; i <= 3; i++) {
          await prisma.video.create({
            data: {
              subjectId: subject.id,
              teacherId: teacher.id,
              title: `الوحدة ${i} - مقدمة في ${name}`,
              description: `شرح شامل للوحدة ${i}`,
              streamUrl: `https://example.com/videos/physics-${grade}-u${i}.m3u8`,
              durationSec: 3300,
              unitNumber: i,
              orderInUnit: 1,
              status: 'PUBLISHED',
            },
          });
        }
      }
    }

    for (const name of LITERARY_SUBJECTS) {
      await prisma.subject.upsert({
        where: { name_grade_branch: { name, grade, branch: Branch.LITERARY } },
        update: {},
        create: { name, grade, branch: Branch.LITERARY },
      });
    }
  }

  const demoStudent = await prisma.user.upsert({
    where: { phone: '0599123456' },
    update: {},
    create: {
      phone: '0599123456',
      name: 'أحمد خالد',
      grade: Grade.GRADE_11,
      branch: Branch.SCIENTIFIC,
      parentPhone: '0599987654',
      role: UserRole.STUDENT,
    },
  });

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

  console.log('Seed completed.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
