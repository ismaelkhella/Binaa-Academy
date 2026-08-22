import { PrismaService } from '../prisma/prisma.service';
import { CreateStageDto, CreateQbSubjectDto, CreateUnitDto, CreateQuestionDto } from './dto/question-bank.dto';
export declare class QuestionBankService {
    private prisma;
    constructor(prisma: PrismaService);
    private accessibleSubjectIds;
    private ensureStudentSubjectAccess;
    getStudentSubjects(userId: string): Promise<{
        id: string;
        name: string;
        unitsCount: number;
    }[]>;
    getStudentUnits(subjectId: string, userId: string): Promise<{
        id: string;
        name: string;
        order: number;
        questionsCount: number;
    }[]>;
    getStudentQuestions(unitId: string, userId: string): Promise<{
        id: string;
        text: string;
        imageUrl: string | null;
        order: number;
        choices: {
            id: string;
            text: string;
        }[];
    }[]>;
    answerQuestion(questionId: string, choiceId: string, userId: string): Promise<{
        isCorrect: boolean;
        correctChoiceId: string;
    }>;
    importFromSubjects(): Promise<{
        message: string;
        createdStages: string[];
        linkedSubjects: string[];
        skippedSubjects: string[];
        summary: {
            stages: number;
            linked: number;
            skipped: number;
        };
    }>;
    listStages(): Promise<({
        _count: {
            subjects: number;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
    })[]>;
    createStage(dto: CreateStageDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
    }>;
    updateStage(id: string, dto: CreateStageDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
    }>;
    deleteStage(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
    }>;
    listStageSubjects(stageId: string): Promise<({
        _count: {
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
    createQbSubject(stageId: string, dto: CreateQbSubjectDto): Promise<{
        name: string;
        grade: import(".prisma/client").$Enums.Grade;
        branch: import(".prisma/client").$Enums.Branch;
        id: string;
        createdAt: Date;
        priceIls: number;
        teacherId: string | null;
        stageId: string | null;
    }>;
    updateQbSubject(id: string, dto: CreateQbSubjectDto): Promise<{
        name: string;
        grade: import(".prisma/client").$Enums.Grade;
        branch: import(".prisma/client").$Enums.Branch;
        id: string;
        createdAt: Date;
        priceIls: number;
        teacherId: string | null;
        stageId: string | null;
    }>;
    deleteQbSubject(id: string): Promise<{
        name: string;
        grade: import(".prisma/client").$Enums.Grade;
        branch: import(".prisma/client").$Enums.Branch;
        id: string;
        createdAt: Date;
        priceIls: number;
        teacherId: string | null;
        stageId: string | null;
    }>;
    listSubjectUnits(subjectId: string): Promise<({
        _count: {
            questions: number;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subjectId: string;
        order: number;
    })[]>;
    createUnit(subjectId: string, dto: CreateUnitDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subjectId: string;
        order: number;
    }>;
    updateUnit(id: string, dto: CreateUnitDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subjectId: string;
        order: number;
    }>;
    deleteUnit(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subjectId: string;
        order: number;
    }>;
    listUnitQuestions(unitId: string): Promise<({
        choices: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            text: string;
            isCorrect: boolean;
            questionId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        order: number;
        text: string;
        imageUrl: string | null;
        unitId: string;
    })[]>;
    createQuestion(unitId: string, dto: CreateQuestionDto): Promise<({
        choices: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            text: string;
            isCorrect: boolean;
            questionId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        order: number;
        text: string;
        imageUrl: string | null;
        unitId: string;
    }) | null>;
    updateQuestion(id: string, dto: CreateQuestionDto): Promise<({
        choices: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            text: string;
            isCorrect: boolean;
            questionId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        order: number;
        text: string;
        imageUrl: string | null;
        unitId: string;
    }) | null>;
    deleteQuestion(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        order: number;
        text: string;
        imageUrl: string | null;
        unitId: string;
    }>;
}
