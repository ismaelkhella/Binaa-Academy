import { ChatService } from './chat.service';
export declare class ChatController {
    private chatService;
    constructor(chatService: ChatService);
    getTeachers(req: {
        user: {
            sub: string;
        };
    }): Promise<any[]>;
    getConversations(req: {
        user: {
            sub: string;
        };
    }): Promise<({
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
    createConversation(req: {
        user: {
            sub: string;
        };
    }, body: {
        teacherId: string;
    }): Promise<{
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
