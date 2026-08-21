import { OnModuleInit } from '@nestjs/common';
export declare class OpenapiController implements OnModuleInit {
    private readonly logger;
    private cachedSpec;
    onModuleInit(): Promise<void>;
    getSpec(): Record<string, unknown>;
}
