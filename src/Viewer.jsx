import React, { useEffect, useRef } from "react";
import ThreeApp from "./ThreeApp";
import { useLocation } from "react-router-dom";
import { solveTriangleLocalization } from "./algorithms";

const Viewer = () => {
  const canvasRef = useRef(null);
  const location = useLocation();
  const id = new URLSearchParams(location.search).get("user_id");
  useEffect(() => {
    const canvas = canvasRef.current;
    const threeApp = new ThreeApp(canvas);

    window.addEventListener("resize", threeApp.resizeCanvas);

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
          threeApp.setCamera(prevPosition, result);
          prevPosition = [...result];
        });
    }, 2e2);

    return () => {
      clearInterval(timer);
      threeApp.animator.dispose();
      window.removeEventListener("resize", threeApp.resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
};

export default Viewer;
