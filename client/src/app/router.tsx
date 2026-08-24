import {
  createBrowserRouter,
} from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import HomePage from "../pages/passenger/HomePage";


export const router =
  createBrowserRouter([
    {
      path: "/",
      element: <LoginPage />,
    },

    {
      path: "/login",
      element: <LoginPage />,
    },

    {
      path: "/register",
      element: <RegisterPage />,
    },

    {
      path: "/passenger",
      element: <HomePage />,
    },
  ]);