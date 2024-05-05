import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Simulator from "./Simulator";
import Viewer from "./Viewer";

const router = createBrowserRouter(
  [
    {
      path: "/viewer",
      element: <Viewer />,
    },
    {
      path: "/simulator",
      element: <Simulator />,
    },
  ],
  {
    basename: "/triangle-localization-simulator/",
  }
);

const App = () => <RouterProvider router={router} />;
export default App;
