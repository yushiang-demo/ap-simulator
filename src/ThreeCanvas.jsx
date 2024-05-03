import React, { useEffect, useRef, useState } from "react";
import ThreeApp from "./ThreeApp";
import { LineChart } from "@mui/x-charts";
const FullScreenCanvas = () => {
  const [chartData, setChartData] = useState([[2, 5.5, 2, 8.5, 1.5, 5]]);
  const [core, setCore] = useState(null);
  const [isTeleport, setIsTeleport] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const threeApp = new ThreeApp(canvas);
    threeApp.setCamera([-3.628, 0.427, 5.378], [-3.628, 0.427, 5.378 - 1]);
    setCore(threeApp);
  }, []);

  useEffect(() => {
    if (!core) return;
    const canvas = canvasRef.current;
    const onPointerUp = (e) => {
      const point = core.getPointFromClick(e);
      if (isTeleport) {
        if (point)
          core.setCamera(
            [point.x, point.y, point.z],
            [point.x, point.y, point.z - 1]
          );
        return;
      }

      if (point) {
        const path = core.findPathTo(point);

        if (path) {
          const sensors = core.getSensors();
          const distanceToSensor = sensors.map(({ position }) =>
            path.map((point) => point.distanceTo(position))
          );
          setChartData(distanceToSensor);

          core.setCamera(
            [path[0].x, path[0].y, path[0].z],
            [path[1].x, path[1].y, path[1].z]
          );
          core.setPath(path);
        }
      }
    };

    window.addEventListener("resize", core.resizeCanvas);
    canvas.addEventListener("pointerdown", core.onSelectSensor);
    canvas.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("resize", core.resizeCanvas);
      canvas.addEventListener("pointerdown", core.onSelectSensor);
      canvas.removeEventListener("pointerup", onPointerUp);
    };
  }, [core, isTeleport]);

  return (
    <>
      <div style={{ position: "absolute", background: "rgba(0,0,0,0.1)" }}>
        <button onClick={() => setIsTeleport((prev) => !prev)}>
          {isTeleport ? "click to teleport" : "click to find path"}
        </button>

        {chartData && (
          <LineChart
            xAxis={[{ data: chartData[0].map((_, index) => index) }]}
            series={chartData.map((points) => ({
              data: points,
            }))}
            width={500}
            height={300}
          />
        )}
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </>
  );
};

export default FullScreenCanvas;
