import React, { useEffect, useRef } from "react";
import ThreeApp from "./ThreeApp";
const FullScreenCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const core = new ThreeApp(canvas);

    core.setCamera([-3, 0.2, 5], [-3, 0.2, 4]);

    const onPointerUp = (e) => {
      const path = core.onFindPath(e);

      if (path) {
        console.log(path);
        core.setCamera(
          [path[0].x, path[0].y, path[0].z],
          [path[1].x, path[1].y, path[1].z]
        );
      }
    };

    window.addEventListener("resize", core.resizeCanvas);
    canvas.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("resize", core.resizeCanvas);
      canvas.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
};

export default FullScreenCanvas;
