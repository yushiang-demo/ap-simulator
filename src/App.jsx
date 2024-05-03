import React, { useEffect, useRef, useState } from "react";
import ThreeApp from "./ThreeApp";
import { LineChart } from "@mui/x-charts";

function densityDecay(distance) {
  return distance;
}
const FullScreenCanvas = () => {
  const [isPause, setIsPause] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [core, setCore] = useState(null);
  const [isTeleport, setIsTeleport] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!core) return;
    if (isPause) return;
    const timer = setInterval(() => {
      setChartData((data) => {
        const newChart = data || [];
        const sensors = core.getSensors();
        sensors.forEach(({ position, color }, index) => {
          if (!newChart[index]) {
            newChart[index] = {
              data: [],
              color: `#${color.getHexString()}`,
              curve: "linear",
            };
          }
          const distance = densityDecay(
            core.getFpvCamera().position.distanceTo(position)
          );
          newChart[index].data.unshift(distance);
          if (newChart[index].data.length > 20) {
            newChart[index].data.pop();
          }
        });
        return [...newChart];
      });
    }, 5e2);
    return () => clearInterval(timer);
  }, [core, isPause]);

  useEffect(() => {
    if (!core) return;
    core.animator.setIsPause(isPause);
  }, [isPause, core]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const threeApp = new ThreeApp(canvas);
    threeApp.setCamera([-3.628, 0.427, 5.378], [-3.628, 0.427, 5.378 - 1]);
    setCore(threeApp);
    return () => threeApp.animator.dispose();
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
          core.setCamera(
            [path[0].x, path[0].y, path[0].z],
            [path[1].x, path[1].y, path[1].z]
          );
          core.setPath(path);
          if (!isPause) {
            core.animator.setTargets(path);
          } else {
            const sensors = core.getSensors();
            const distanceToSensor = sensors.map(({ position, color }) => {
              return {
                data: path.map((point) =>
                  densityDecay(point.distanceTo(position))
                ),
                color: `#${color.getHexString()}`,
                curve: "linear",
              };
            });
            setChartData(distanceToSensor);
          }
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
  }, [core, isTeleport, isPause]);

  const rawData = chartData?.map(({ data, color }) => ({
    sensor: color,
    distance: data[0],
  }));

  return (
    <>
      {!isPause && (
        <div
          style={{
            position: "absolute",
            background: "rgba(0,0,0,0.1)",
          }}
        >
          <textarea
            rows={25}
            cols={50}
            value={JSON.stringify(rawData, null, 4)}
          ></textarea>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          right: "0",
          background: "rgba(0,0,0,0.1)",
        }}
      >
        <button onClick={() => setIsTeleport((prev) => !prev)}>
          <span>{`${!isTeleport ? "(v)" : "( )"} navigation mode `}</span>
          <br />
          <span>{`${isTeleport ? "(v)" : "( )"} teleport mode`}</span>
        </button>
        <button onClick={() => setIsPause((prev) => !prev)}>
          <span>{`${isPause ? "(v)" : "( )"} static mode `}</span>
          <br />
          <span>{`${!isPause ? "(v)" : "( )"} dynamic mode`}</span>
        </button>
        {chartData && (
          <LineChart
            xAxis={[
              {
                data: chartData[0].data.map((_, index) => index),
                label: "Steps",
              },
            ]}
            yAxis={[
              {
                label: "Sensor Distance",
                max: 15,
                min: 0,
              },
            ]}
            series={chartData}
            width={Math.min(500, document.documentElement.clientWidth)}
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
