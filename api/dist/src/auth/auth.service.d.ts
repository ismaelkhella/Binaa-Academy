import { OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, SetupProfileDto, AdminLoginDto, AdminChangePasswordDto } from './dto/auth.dto';
export declare class AuthService implements OnModuleInit {
    private prisma;
    private jwt;
    private config;
    private readonly logger;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService);
    onModuleInit(): Promise<void>;
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        token: string;
        user: {
            id: string;
            phone: string;
            name: string | null;
            grade: import(".prisma/client").$Enums.Grade | null;
            branch: import(".prisma/client").$Enums.Branch | null;
            parentPhone: string | null;
            role: string;
            createdAt: Date;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        token: string;
        user: {
            id: string;
            phone: string;
            name: string | null;
            grade: import(".prisma/client").$Enums.Grade | null;
            branch: import(".prisma/client").$Enums.Branch | null;
            parentPhone: string | null;
            role: string;
            createdAt: Date;
        };
        teacher: {
            id: string;
            name: string;
            bio: string | null;
            avatarUrl: string | null;
        } | null;
    }>;
    setupProfile(userId: string, dto: SetupProfileDto): Promise<{
        user: {
            id: string;
            phone: string;
            name: string | null;
            grade: import(".prisma/client").$Enums.Grade | null;
            branch: import(".prisma/client").$Enums.Branch | null;
            parentPhone: string | null;
            role: string;
            createdAt: Date;
        };
    }>;
    adminLogin(dto: AdminLoginDto): Promise<{
        token: string;
        admin: {
            id: string;
            email: string;
            name: string;
        };
    }>;
    adminChangePassword(adminId: string, dto: AdminChangePasswordDto): Promise<{
        message: string;
    }>;
    private signStudentToken;
    private sanitizeUser;
    refresh(rawToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        token: string;
    }>;
    logout(rawToken: string): Promise<{
        message: string;
    }>;
    private createRefreshToken;
    private hashToken;
}
