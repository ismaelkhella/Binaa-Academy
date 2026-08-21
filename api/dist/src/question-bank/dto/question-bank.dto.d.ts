export declare class CreateStageDto {
    name: string;
}
export declare class CreateQbSubjectDto {
    name: string;
    grade: string;
    branch: string;
}
export declare class CreateUnitDto {
    name: string;
    order?: number;
}
export declare class CreateChoiceDto {
    text: string;
    isCorrect: boolean;
}
export declare class CreateQuestionDto {
    text: string;
    imageUrl?: string;
    order?: number;
    choices: CreateChoiceDto[];
}
