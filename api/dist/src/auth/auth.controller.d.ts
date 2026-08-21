import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, SetupProfileDto, AdminLoginDto, AdminChangePasswordDto, RefreshTokenDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
    setupProfile(req: {
        user: {
            sub: string;
        };
    }, dto: SetupProfileDto): Promise<{
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
    adminChangePassword(req: {
        admin: {
            sub: string;
        };
    }, dto: AdminChangePasswordDto): Promise<{
        message: string;
    }>;
    refresh(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
        token: string;
    }>;
    logout(dto: RefreshTokenDto): Promise<{
        message: string;
    }>;
}
