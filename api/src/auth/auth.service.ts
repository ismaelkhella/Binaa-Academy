import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RequestOtpDto, VerifyOtpDto, SetupProfileDto, AdminLoginDto } from './dto/auth.dto';
import { Grade, Branch, PlanType } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + (Number(this.config.get('OTP_EXPIRES_MINUTES')) || 5) * 60 * 1000);

    await this.prisma.otpCode.create({
      data: { phone: dto.phone, code, expiresAt },
    });

    // In production: send via Twilio/Vonage SMS
    return {
      message: 'تم إرسال رمز التحقق',
      expiresInMinutes: 5,
      ...(process.env.NODE_ENV !== 'production' && { devCode: code }),
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        phone: dto.phone,
        code: dto.code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new UnauthorizedException('رمز التحقق غير صحيح أو منتهي الصلاحية');
    }

    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

    let user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    const isNewUser = !user;

    if (!user) {
      user = await this.prisma.user.create({ data: { phone: dto.phone } });
    }

    const needsProfile = !user.grade || !user.branch;
    const token = this.signStudentToken(user.id, user.phone);

    return {
      token,
      isNewUser,
      needsProfile,
      user: this.sanitizeUser(user),
    };
  }

  async setupProfile(userId: string, dto: SetupProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { grade: dto.grade as Grade, branch: dto.branch as Branch },
    });

    const existingSub = await this.prisma.subscription.findFirst({
      where: { userId, isActive: true },
    });

    if (!existingSub) {
      const trialPlan = await this.prisma.subscriptionPlan.findUnique({
        where: { type: PlanType.TRIAL },
      });
      if (trialPlan) {
        await this.prisma.subscription.create({
          data: {
            userId,
            planId: trialPlan.id,
            endDate: new Date(Date.now() + trialPlan.durationDays * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    return { user: this.sanitizeUser(user) };
  }

  async adminLogin(dto: AdminLoginDto) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email: dto.email } });
    if (!admin || !(await bcrypt.compare(dto.password, admin.passwordHash))) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const token = this.jwt.sign(
      { sub: admin.id, email: admin.email, role: 'ADMIN' },
      { secret: this.config.get('ADMIN_JWT_SECRET') || this.config.get('JWT_SECRET'), expiresIn: '7d' },
    );

    return { token, admin: { id: admin.id, email: admin.email, name: admin.name } };
  }

  private signStudentToken(userId: string, phone: string) {
    return this.jwt.sign(
      { sub: userId, phone, role: 'STUDENT' },
      { secret: this.config.get('JWT_SECRET'), expiresIn: this.config.get('JWT_EXPIRES_IN') || '30d' },
    );
  }

  private sanitizeUser(user: { id: string; phone: string; name: string | null; grade: Grade | null; branch: Branch | null; parentPhone: string | null; role: string; createdAt: Date }) {
    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      grade: user.grade,
      branch: user.branch,
      parentPhone: user.parentPhone,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
