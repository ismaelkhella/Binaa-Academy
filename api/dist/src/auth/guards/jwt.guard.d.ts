import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
export declare class StudentJwtGuard implements CanActivate {
    private jwt;
    private config;
    constructor(jwt: JwtService, config: ConfigService);
    canActivate(context: ExecutionContext): boolean;
    private extractToken;
}
export declare class AdminJwtGuard implements CanActivate {
    private jwt;
    private config;
    constructor(jwt: JwtService, config: ConfigService);
    canActivate(context: ExecutionContext): boolean;
    private extractToken;
}
export declare class TeacherJwtGuard implements CanActivate {
    private jwt;
    private config;
    constructor(jwt: JwtService, config: ConfigService);
    canActivate(context: ExecutionContext): boolean;
    private extractToken;
}
export declare class AppUserJwtGuard implements CanActivate {
    private jwt;
    private config;
    constructor(jwt: JwtService, config: ConfigService);
    canActivate(context: ExecutionContext): boolean;
    private extractToken;
}
export declare class UserJwtGuard implements CanActivate {
    private jwt;
    private config;
    constructor(jwt: JwtService, config: ConfigService);
    canActivate(context: ExecutionContext): boolean;
}
