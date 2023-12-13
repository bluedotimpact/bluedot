import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import { HomePage } from './pages/HomePage';
import { RouteErrorPage } from './pages/ErrorPage';
import { AuthedPage } from './pages/AuthedPage';
import { LoginOauthCallbackPage, LoginPage } from './pages/LoginPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/login/oauth-callback',
    element: <LoginOauthCallbackPage />,
  },
  {
    path: '/authed',
    element: <AuthedPage />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
