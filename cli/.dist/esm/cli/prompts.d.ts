export type DeployTarget = 'vercel-serverless' | 'standalone-node' | 'standalone-bun';
export interface InitOptions {
    deployTarget: DeployTarget;
    basePath: string;
    withExample?: boolean;
}
export declare function promptInitOptions(): Promise<InitOptions>;
export declare type __ΩDeployTarget = any[];
export declare type __ΩInitOptions = any[];
