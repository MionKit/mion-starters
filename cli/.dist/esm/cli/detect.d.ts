export type FrameworkType = 'nextjs' | 'nuxt';
export interface DetectedProject {
    framework: FrameworkType;
    name: string;
    configFile: string;
}
export declare function detectFramework(cwd: string): DetectedProject | null;
export declare type __ΩFrameworkType = any[];
export declare type __ΩDetectedProject = any[];
