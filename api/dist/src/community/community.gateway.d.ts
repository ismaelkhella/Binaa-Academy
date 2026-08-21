import { OnGatewayConnection } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { CommunityService } from './community.service';
interface AuthedSocket extends Socket {
    data: {
        user?: {
            sub: string;
            role: string;
        };
    };
}
export declare class CommunityGateway implements OnGatewayConnection {
    private jwt;
    private config;
    private community;
    server: Server;
    private readonly logger;
    constructor(jwt: JwtService, config: ConfigService, community: CommunityService);
    handleConnection(client: AuthedSocket): void;
    private extractToken;
    handleJoin(client: AuthedSocket, body: {
        subjectId?: string;
    }): Promise<{
        event: string;
        data: {
            code: string;
            message: string;
            subjectId?: undefined;
        };
    } | {
        event: string;
        data: {
            message: string;
            code?: undefined;
            subjectId?: undefined;
        };
    } | {
        event: string;
        data: {
            subjectId: string;
            code?: undefined;
            message?: undefined;
        };
    } | {
        event: string;
        data: {
            message: any;
            subjectId: string;
            code?: undefined;
        };
    }>;
    handleLeave(client: AuthedSocket, body: {
        subjectId?: string;
    }): Promise<{
        event: string;
        data: {
            subjectId: string | undefined;
        };
    }>;
    broadcastNewMessage(subjectId: string, message: unknown): void;
    broadcastDeletedMessage(subjectId: string, messageId: string): void;
    private room;
}
export {};
