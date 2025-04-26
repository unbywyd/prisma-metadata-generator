export type PrismaMetadataGeneratorConfig = {};
export type GeneratorOptions = {
    schemaPath?: string;
    cwd?: string;
    output?: string;
};
export declare function generate(options: GeneratorOptions): Promise<void>;
