import { PrismaService } from '../prisma/prisma.service';
export declare class ChatService {
    private prisma;
    constructor(prisma: PrismaService);
    getTeacherDashboard(userId: string): Promise<{
        teacher: {
            id: string;
            name: string;
            bio: string | null;
            avatarUrl: string | null;
        };
        studentsCount: number;
        subjectsCount: number;
        videosCount: number;
        engagementRate: number;
    }>;
    studentGetTeachers(userId: string): Promise<any[]>;
    studentGetConversations(userId: string): Promise<({
        teacher: {
            name: string;
            id: string;
            bio: string | null;
        };
        messages: {
            id: string;
            createdAt: Date;
            chatId: string;
            senderId: string;
            content: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        studentId: string;
    })[]>;
    studentGetOrCreateConversation(userId: string, teacherId: string): Promise<{
        teacher: {
            name: string;
            id: string;
            createdAt: Date;
            userId: string;
            bio: string | null;
            avatarUrl: string | null;
            commissionRate: number;
        };
        messages: {
            id: string;
            createdAt: Date;
            chatId: string;
            senderId: string;
            content: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        studentId: string;
    }>;
    studentGetMessages(userId: string, chatId: string): Promise<{
        id: string;
        createdAt: Date;
        chatId: string;
        senderId: string;
        content: string;
    }[]>;
    studentSendMessage(userId: string, chatId: string, content: string): Promise<{
        id: string;
        createdAt: Date;
        chatId: string;
        senderId: string;
        content: string;
    }>;
    teacherGetConversations(userId: string): Promise<({
        student: {
            phone: string;
            name: string | null;
            id: string;
        };
        messages: {
            id: string;
            createdAt: Date;
            chatId: string;
            senderId: string;
            content: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        studentId: string;
    })[]>;
    teacherGetMessages(userId: string, chatId: string): Promise<{
        id: string;
        createdAt: Date;
        chatId: string;
        senderId: string;
        content: string;
    }[]>;
    teacherSendMessage(userId: string, chatId: string, content: string): Promise<{
        id: string;
        createdAt: Date;
        chatId: string;
        senderId: string;
        content: string;
    }>;
}
