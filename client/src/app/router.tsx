import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom";

import { AuthLayout } from "../layout/AuthLayout";
import LoginPage from "../pages/auth/LoginPage";

import { ProtectedRoute } from "../common/ProtectedRoute";

import MainLayout from "../layout/MainLayout";
import DriverHomePage from "../pages/driver/DriverHomePage";

export const router =
  createBrowserRouter([
    {
      element: <AuthLayout />,

      children: [
        {
          path: "/login",
          element: <LoginPage />,
        },
      ],
    },

    {
      element: <ProtectedRoute />,

      children: [
        {
          path: "/",
          element: (
            <Navigate
              to="/passenger"
              replace
            />
          ),
        },

        {
          path: "/passenger",
          element: <MainLayout />,
        },

        {
          path: "/driver",
          element: <DriverHomePage />,
        },
      ],
    },
  ]);