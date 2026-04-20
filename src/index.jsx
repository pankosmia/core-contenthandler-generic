import { createRoot } from "react-dom/client";
import { SpaContainer } from "pankosmia-rcl";
import { createHashRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import AboutRepo from "./AboutRepo";
import App from "./App";

const router = createHashRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/aboutRepo",
    element: <AboutRepo />,
  },
]);

createRoot(document.getElementById("root")).render(
  <SpaContainer>
    <RouterProvider router={router} />
  </SpaContainer>,
);
