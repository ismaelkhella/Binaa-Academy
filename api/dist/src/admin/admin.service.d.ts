import { PrismaService } from '../prisma/prisma.service';
import { MuxService } from '../mux/mux.service';
import { ListStudentsQuery, UpdateStudentDto, FreezeSubscriptionDto, GrantSubscriptionDto, CreateVideoDto, UpdatePlanDto, UpdateSubjectDto, CreateTeacherDto } from './dto/admin.dto';
export declare class AdminService {
    private prisma;
    private muxService;
    constructor(prisma: PrismaService, muxService: MuxService);
    getDashboardStats(): Promise<{
        students: {
            total: number;
            active: number;
            trial: number;
        };
        subscriptions: {
            thisMonth: number;
            lastMonth: number;
        };
        revenue: {
            thisMonth: number;
            currency: string;
        };
        content: {
            totalVideos: number;
            completionRate: number;
        };
        recentStudents: {
            phone: string;
            name: string | null;
            grade: import(".prisma/client").$Enums.Grade | null;
            branch: import(".prisma/client").$Enums.Branch | null;
            id: string;
            createdAt: Date;
        }[];
        topVideos: {
            videoId: string;
            title: string;
            subject: string;
            views: number;
        }[];
    }>;
    listStudents(query: ListStudentsQuery): Promise<{
        id: string;
        phone: string;
        name: string | null;
        grade: import(".prisma/client").$Enums.Grade | null;
        branch: import(".prisma/client").$Enums.Branch | null;
        parentPhone: string | null;
        isActive: boolean;
        createdAt: Date;
        viewsCount: number;
        subscription: {
            planType: import(".prisma/client").$Enums.PlanType;
            planName: string;
            endDate: Date;
            isFrozen: boolean;
        } | null;
    }[]>;
    getStudent(id: string): Promise<{
        subscriptions: ({
            plan: {
                id: string;
                createdAt: Date;
                type: import(".prisma/client").$Enums.PlanType;
                nameAr: string;
                durationDays: number;
                discountPercent: number;
                priceIls: number;
                videosPerSubject: number;
                isActive: boolean;
            };
            subjects: ({
                subject: {
                    name: string;
                    grade: import(".prisma/client").$Enums.Grade;
                    branch: import(".prisma/client").$Enums.Branch;
                    id: string;
                    createdAt: Date;
                    priceIls: number;
                    teacherId: string | null;
                    stageId: string | null;
                };
            } & {
                id: string;
                subjectId: string;
                subscriptionId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            isActive: boolean;
            userId: string;
            planId: string;
            startDate: Date;
            endDate: Date;
            isFrozen: boolean;
            notes: string | null;
        })[];
        videoViews: ({
            video: {
                subject: {
                    name: string;
                    grade: import(".prisma/client").$Enums.Grade;
                    branch: import(".prisma/client").$Enums.Branch;
                    id: string;
                    createdAt: Date;
                    priceIls: number;
                    teacherId: string | null;
                    stageId: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                teacherId: string | null;
                status: import(".prisma/client").$Enums.VideoStatus;
                subjectId: string;
                title: string;
                description: string | null;
                streamUrl: string | null;
                durationSec: number;
                unitNumber: number;
                orderInUnit: number;
                maxViews: number;
                downloadDays: number;
                pdfUrl: string | null;
                muxUploadId: string | null;
                muxAssetId: string | null;
                muxPlaybackId: string | null;
                videoStatus: string;
                videoDuration: number | null;
                muxStatus: string | null;
                muxDuration: number | null;
                muxThumbnail: string | null;
                muxStaticMp4Name: string | null;
                offlineAvailable: boolean;
                videoSize: number | null;
            };
        } & {
            id: string;
            userId: string;
            completed: boolean;
            videoId: string;
            viewCount: number;
            lastViewed: Date;
        })[];
        dailyGoals: {
            id: string;
            createdAt: Date;
            userId: string;
            completed: boolean;
            title: string;
            dueDate: Date;
        }[];
        quizResults: ({
            quiz: {
                subject: {
                    name: string;
                    grade: import(".prisma/client").$Enums.Grade;
                    branch: import(".prisma/client").$Enums.Branch;
                    id: string;
                    createdAt: Date;
                    priceIls: number;
                    teacherId: string | null;
                    stageId: string | null;
                } | null;
            } & {
                id: string;
                createdAt: Date;
                subjectId: string | null;
                title: string;
                totalQuestions: number;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            totalQuestions: number;
            quizId: string;
            score: number;
        })[];
        studySessions: {
            id: string;
            createdAt: Date;
            userId: string;
            date: Date;
            durationMin: number;
        }[];
    } & {
        phone: string;
        name: string | null;
        grade: import(".prisma/client").$Enums.Grade | null;
        branch: import(".prisma/client").$Enums.Branch | null;
        parentPhone: string | null;
        id: string;
        passwordHash: string | null;
        createdAt: Date;
        isActive: boolean;
        role: import(".prisma/client").$Enums.UserRole;
        updatedAt: Date;
    }>;
    updateStudent(id: string, dto: UpdateStudentDto): Promise<{
        phone: string;
        name: string | null;
        grade: import(".prisma/client").$Enums.Grade | null;
        branch: import(".prisma/client").$Enums.Branch | null;
        parentPhone: string | null;
        id: string;
        passwordHash: string | null;
        createdAt: Date;
        isActive: boolean;
        role: import(".prisma/client").$Enums.UserRole;
        updatedAt: Date;
    }>;
    freezeSubscription(userId: string, dto: FreezeSubscriptionDto): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        userId: string;
        planId: string;
        startDate: Date;
        endDate: Date;
        isFrozen: boolean;
        notes: string | null;
    }>;
    grantSubscription(userId: string, dto: GrantSubscriptionDto): Promise<({
        plan: {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.PlanType;
            nameAr: string;
            durationDays: number;
            discountPercent: number;
            priceIls: number;
            videosPerSubject: number;
            isActive: boolean;
        };
        subjects: ({
            subject: {
                name: string;
                grade: import(".prisma/client").$Enums.Grade;
                branch: import(".prisma/client").$Enums.Branch;
                id: string;
                createdAt: Date;
                priceIls: number;
                teacherId: string | null;
                stageId: string | null;
            };
        } & {
            id: string;
            subjectId: string;
            subscriptionId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        userId: string;
        planId: string;
        startDate: Date;
        endDate: Date;
        isFrozen: boolean;
        notes: string | null;
    }) | null>;
    listVideos(): Promise<({
        teacher: {
            name: string;
        } | null;
        subject: {
            name: string;
            grade: import(".prisma/client").$Enums.Grade;
            branch: import(".prisma/client").$Enums.Branch;
        };
        _count: {
            videoViews: number;
        };
        questions: {
            id: string;
            createdAt: Date;
            videoId: string;
            text: string;
            options: string;
            answer: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string | null;
        status: import(".prisma/client").$Enums.VideoStatus;
        subjectId: string;
        title: string;
        description: string | null;
        streamUrl: string | null;
        durationSec: number;
        unitNumber: number;
        orderInUnit: number;
        maxViews: number;
        downloadDays: number;
        pdfUrl: string | null;
        muxUploadId: string | null;
        muxAssetId: string | null;
        muxPlaybackId: string | null;
        videoStatus: string;
        videoDuration: number | null;
        muxStatus: string | null;
        muxDuration: number | null;
        muxThumbnail: string | null;
        muxStaticMp4Name: string | null;
        offlineAvailable: boolean;
        videoSize: number | null;
    })[]>;
    createVideo(dto: CreateVideoDto): Promise<({
        questions: {
            id: string;
            createdAt: Date;
            videoId: string;
            text: string;
            options: string;
            answer: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string | null;
        status: import(".prisma/client").$Enums.VideoStatus;
        subjectId: string;
        title: string;
        description: string | null;
        streamUrl: string | null;
        durationSec: number;
        unitNumber: number;
        orderInUnit: number;
        maxViews: number;
        downloadDays: number;
        pdfUrl: string | null;
        muxUploadId: string | null;
        muxAssetId: string | null;
        muxPlaybackId: string | null;
        videoStatus: string;
        videoDuration: number | null;
        muxStatus: string | null;
        muxDuration: number | null;
        muxThumbnail: string | null;
        muxStaticMp4Name: string | null;
        offlineAvailable: boolean;
        videoSize: number | null;
    }) | null>;
    updateVideo(id: string, dto: Partial<CreateVideoDto>): Promise<({
        questions: {
            id: string;
            createdAt: Date;
            videoId: string;
            text: string;
            options: string;
            answer: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string | null;
        status: import(".prisma/client").$Enums.VideoStatus;
        subjectId: string;
        title: string;
        description: string | null;
        streamUrl: string | null;
        durationSec: number;
        unitNumber: number;
        orderInUnit: number;
        maxViews: number;
        downloadDays: number;
        pdfUrl: string | null;
        muxUploadId: string | null;
        muxAssetId: string | null;
        muxPlaybackId: string | null;
        videoStatus: string;
        videoDuration: number | null;
        muxStatus: string | null;
        muxDuration: number | null;
        muxThumbnail: string | null;
        muxStaticMp4Name: string | null;
        offlineAvailable: boolean;
        videoSize: number | null;
    }) | null>;
    deleteVideo(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string | null;
        status: import(".prisma/client").$Enums.VideoStatus;
        subjectId: string;
        title: string;
        description: string | null;
        streamUrl: string | null;
        durationSec: number;
        unitNumber: number;
        orderInUnit: number;
        maxViews: number;
        downloadDays: number;
        pdfUrl: string | null;
        muxUploadId: string | null;
        muxAssetId: string | null;
        muxPlaybackId: string | null;
        videoStatus: string;
        videoDuration: number | null;
        muxStatus: string | null;
        muxDuration: number | null;
        muxThumbnail: string | null;
        muxStaticMp4Name: string | null;
        offlineAvailable: boolean;
        videoSize: number | null;
    }>;
    retryVideoUpload(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string | null;
        status: import(".prisma/client").$Enums.VideoStatus;
        subjectId: string;
        title: string;
        description: string | null;
        streamUrl: string | null;
        durationSec: number;
        unitNumber: number;
        orderInUnit: number;
        maxViews: number;
        downloadDays: number;
        pdfUrl: string | null;
        muxUploadId: string | null;
        muxAssetId: string | null;
        muxPlaybackId: string | null;
        videoStatus: string;
        videoDuration: number | null;
        muxStatus: string | null;
        muxDuration: number | null;
        muxThumbnail: string | null;
        muxStaticMp4Name: string | null;
        offlineAvailable: boolean;
        videoSize: number | null;
    } | null>;
    listSubjects(): Promise<({
        teacher: {
            name: string;
            id: string;
        } | null;
        _count: {
            videos: number;
            units: number;
        };
    } & {
        name: string;
        grade: import(".prisma/client").$Enums.Grade;
        branch: import(".prisma/client").$Enums.Branch;
        id: string;
        createdAt: Date;
        priceIls: number;
        teacherId: string | null;
        stageId: string | null;
    })[]>;
    createSubject(dto: {
        name: string;
        grade: string;
        branch: string;
        priceIls?: number;
        teacherId?: string;
    }): Promise<{
        teacher: {
            name: string;
            id: string;
        } | null;
        _count: {
            videos: number;
        };
    } & {
        name: string;
        grade: import(".prisma/client").$Enums.Grade;
        branch: import(".prisma/client").$Enums.Branch;
        id: string;
        createdAt: Date;
        priceIls: number;
        teacherId: string | null;
        stageId: string | null;
    }>;
    updateSubject(id: string, dto: UpdateSubjectDto): Promise<{
        teacher: {
            name: string;
            id: string;
        } | null;
    } & {
        name: string;
        grade: import(".prisma/client").$Enums.Grade;
        branch: import(".prisma/client").$Enums.Branch;
        id: string;
        createdAt: Date;
        priceIls: number;
        teacherId: string | null;
        stageId: string | null;
    }>;
    listPlans(): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.PlanType;
        nameAr: string;
        durationDays: number;
        discountPercent: number;
        priceIls: number;
        videosPerSubject: number;
        isActive: boolean;
    }[]>;
    updatePlan(id: string, dto: UpdatePlanDto): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.PlanType;
        nameAr: string;
        durationDays: number;
        discountPercent: number;
        priceIls: number;
        videosPerSubject: number;
        isActive: boolean;
    }>;
    listTeachers(query?: {
        search?: string;
        page?: string;
        limit?: string;
    }): Promise<{
        teachers: {
            id: string;
            name: string;
            email: string;
            specialty: string;
            grade: string;
            lessons: number;
            rating: number;
            status: string;
            avatar: string;
            commissionRate: number;
            user: {
                phone: string;
            };
            _count: {
                subjects: number;
                videos: number;
            };
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getTeachersDashboard(): Promise<{
        stats: {
            totalTeachers: number;
            activeClasses: number;
            performanceRating: number;
            contentHours: number;
        };
        applications: never[];
        topTeachers: {
            id: string;
            name: string;
            satisfactionRate: number;
            avatar: string;
        }[];
    }>;
    createTeacher(dto: CreateTeacherDto): Promise<({
        user: {
            phone: string;
        };
        subjects: {
            name: string;
            grade: import(".prisma/client").$Enums.Grade;
            branch: import(".prisma/client").$Enums.Branch;
            id: string;
            createdAt: Date;
            priceIls: number;
            teacherId: string | null;
            stageId: string | null;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        bio: string | null;
        avatarUrl: string | null;
        commissionRate: number;
    }) | null>;
    updateTeacherCredentials(teacherId: string, dto: {
        phone?: string;
        password?: string;
    }): Promise<{
        success: boolean;
    }>;
}
