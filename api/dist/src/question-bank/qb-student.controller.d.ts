import { QuestionBankService } from './question-bank.service';
import { AnswerQuestionDto } from './dto/question-bank.dto';
export declare class QbStudentController {
    private qbService;
    constructor(qbService: QuestionBankService);
    getSubjects(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        id: string;
        name: string;
        unitsCount: number;
    }[]>;
    getUnits(subjectId: string, req: {
        user: {
            sub: string;
        };
    }): Promise<{
        id: string;
        name: string;
        order: number;
        questionsCount: number;
    }[]>;
    getQuestions(unitId: string, req: {
        user: {
            sub: string;
        };
    }): Promise<{
        id: string;
        text: string;
        imageUrl: string | null;
        order: number;
        choices: {
            id: string;
            text: string;
        }[];
    }[]>;
    answerQuestion(questionId: string, dto: AnswerQuestionDto, req: {
        user: {
            sub: string;
        };
    }): Promise<{
        isCorrect: boolean;
        correctChoiceId: string;
    }>;
}
