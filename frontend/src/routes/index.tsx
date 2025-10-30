import { createBrowserRouter } from "react-router-dom";
import Home from "@/pages/Home";
import UploadPage from "@/pages/Upload";
import MainLayout from "@/layouts/MainLayout";

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/upload", element: <UploadPage /> },
    ],
  },
]);
