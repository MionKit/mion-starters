import { DeployTarget } from '../../prompts.ts';
interface ApiPackageJsonOpts {
    projectName: string;
    deployTarget: DeployTarget;
}
export declare function generateApiPackageJson(opts: ApiPackageJsonOpts): string;
export {};
