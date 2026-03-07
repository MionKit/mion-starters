export interface GeneratedFile {
    path: string;
    content: string;
}
export declare function writeFile(filePath: string, content: string): void;
export declare function writeFiles(cwd: string, files: GeneratedFile[]): void;
export declare function readJson<T = Record<string, unknown>>(filePath: string): T;
export declare function writeJson(filePath: string, data: unknown): void;
export declare type __ΩGeneratedFile = any[];
