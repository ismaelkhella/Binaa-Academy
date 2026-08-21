import { Response } from 'express';
export declare class AppController {
    getHello(): {
        status: string;
        message: string;
        documentation: string;
    };
    apiNotFound(res: Response): Response<any, Record<string, any>>;
}
