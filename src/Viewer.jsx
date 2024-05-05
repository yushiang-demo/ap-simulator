import React, { useEffect, useRef, useState } from "react";
import ThreeApp from "./ThreeApp";
import { solveTriangleLocalization } from "./algorithms";

const Viewer = () => {
  const [threeApp, setThreeApp] = useState(null);
  const canvasRef = useRef(null);
  const [id, setId] = useState("");

  useEffect(() => {
    if (!threeApp) return;
    if (!id) return;

    let prevPosition = [0, 0, 0];
    const timer = setInterval(() => {
      if (!id) return;
      fetch(
        `/api/v1/query?query=SensorMonitor{user_id="${id}"}&time=${new Date().toISOString()}`
      )
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
        })
        .then((data) => {
          const formattedData = data.data.result.reduce(
            (prev, { metric, value }) => ({
              ...prev,
              [metric.sensor_id]: value[1],
            }),
            {}
          );
          const sensors = threeApp.getSensors();
          const sensorPositions = sensors.map(({ position }) => position);
          const sensorDistance = sensors.map(
            ({ color }) => formattedData[color.getHexString()]
          );
          const result = solveTriangleLocalization(
            sensorPositions.map((v) => v.toArray()),
            sensorDistance
          );

          if (JSON.stringify(prevPosition) !== JSON.stringify(result)) {
            threeApp.setCamera(prevPosition, result);
            prevPosition = [...result];
          }
        });
    }, 2e2);

    return () => clearInterval(timer);
  }, [id, threeApp]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const threeApp = new ThreeApp(canvas);
    setThreeApp(threeApp);
    window.addEventListener("resize", threeApp.resizeCanvas);
    canvas.addEventListener("pointerdown", threeApp.onSelectSensor);

    return () => {
      threeApp.animator.dispose();
      window.removeEventListener("resize", threeApp.resizeCanvas);
      canvas.addEventListener("pointerdown", threeApp.onSelectSensor);
    };
  }, []);

  return (
    <>
      <div style={{ position: "absolute", right: "0" }}>
        <input value={id} onChange={(e) => setId(e.target.value)}></input>
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </>
  );
};

export default Viewer;
