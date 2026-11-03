import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {createBrowserRouter, RouterProvider} from 'react-router';
import HomePage from './pages/HomePage.tsx';
import MionOrdersPage from './pages/MionOrdersPage.tsx';
import './assets/main.css';

const router = createBrowserRouter([
    {path: '/', element: <HomePage />},
    {path: '/mion-orders', element: <MionOrdersPage />},
]);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
);
