import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, SetupProfileDto, AdminLoginDto, AdminChangePasswordDto } from './dto/auth.dto';
import { Grade, Branch, PlanType } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) {
      throw new BadRequestException('رقم الهاتف مسجل بالفعل');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        passwordHash,
        name: dto.name,
        grade: dto.grade,
        branch: dto.branch,
        parentPhone: dto.parentPhone,
      },
    });

    const trialPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { type: PlanType.TRIAL },
    });
    if (trialPlan) {
      await this.prisma.subscription.create({
        data: {
          userId: user.id,
          planId: trialPlan.id,
          endDate: new Date(Date.now() + trialPlan.durationDays * 24 * 60 * 60 * 1000),
        },
      });
    }

    const token = this.signStudentToken(user.id, user.phone, user.role);

    return {
      token,
      user: this.sanitizeUser(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user || user.role !== 'STUDENT') {
      throw new UnauthorizedException('رقم الهاتف أو كلمة المرور غير صحيحة');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('هذا الحساب معطل. يرجى مراجعة الإدارة.');
    }

    if (!user.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('رقم الهاتف أو كلمة المرور غير صحيحة');
    }

    const token = this.signStudentToken(user.id, user.phone, user.role);

    return {
      token,
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
      // 24h admin sessions: password changes don't revoke already-issued
      // tokens yet, so keep the exposure window of a stolen token short.
      { secret: this.config.get('ADMIN_JWT_SECRET') || this.config.get('JWT_SECRET'), expiresIn: '1d' },
    );

    return { token, admin: { id: admin.id, email: admin.email, name: admin.name } };
  }

  async adminChangePassword(adminId: string, dto: AdminChangePasswordDto) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminId } });
    if (!admin || !(await bcrypt.compare(dto.currentPassword, admin.passwordHash))) {
      throw new UnauthorizedException('كلمة المرور الحالية غير صحيحة');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('كلمة المرور الجديدة يجب أن تختلف عن الحالية');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.adminUser.update({ where: { id: adminId }, data: { passwordHash } });
    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  private signStudentToken(userId: string, phone: string, role: string) {
    return this.jwt.sign(
      { sub: userId, phone, role },
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
