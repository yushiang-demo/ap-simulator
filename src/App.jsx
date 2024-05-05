import { createBrowserRouter, Link, RouterProvider } from "react-router-dom";
import Simulator from "./Simulator";
import Viewer from "./Viewer";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: (
        <>
          <Link to={"viewer"}>viewer</Link>
          <br />
          <Link to={"simulator"}>simulator</Link>
        </>
      ),
    },
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
