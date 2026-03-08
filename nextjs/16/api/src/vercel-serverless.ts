import {initApi} from './api.ts';
import {createVercelHandler} from '@mionjs/platform-vercel';

await initApi();
export const {GET, POST, PUT, DELETE, PATCH} = createVercelHandler();
