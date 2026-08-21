import { ChatService } from './chat.service';
export declare class TeacherChatController {
    private chatService;
    constructor(chatService: ChatService);
    getDashboard(req: {
        user: {
            sub: string;
        };
    }): Promise<{
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
    getConversations(req: {
        user: {
            sub: string;
        };
    }): Promise<({
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
    getMessages(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<{
        id: string;
        createdAt: Date;
        chatId: string;
        senderId: string;
        content: string;
    }[]>;
    sendMessage(req: {
        user: {
            sub: string;
        };
    }, id: string, body: {
        content: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        chatId: string;
        senderId: string;
        content: string;
    }>;
}
