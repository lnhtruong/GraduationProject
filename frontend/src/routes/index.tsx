import { createBrowserRouter } from "react-router-dom";
import Home from "@/pages/Home";
import UploadPage from "@/pages/Upload";
import VideoEditor from "@/pages/VideoEditor";
import MainLayout from "@/layouts/MainLayout";

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/upload", element: <UploadPage /> },
      { path: "/editor", element: <VideoEditor /> },
    ],
  },
]);
