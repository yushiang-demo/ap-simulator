import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import PathFinder from "./PathFinder";
import { TransformControls } from "three/addons/controls/TransformControls.js";

function interpolatePoints(pointsArray, numPoints) {
  var interpolatedPoints = [];

  // Calculate the number of segments
  var numSegments = pointsArray.length - 1;

  // Calculate the increment for each segment
  var segmentIncrement = 1 / numSegments;

  // Interpolate between each pair of consecutive points
  for (var i = 0; i < numSegments; i++) {
    var start = pointsArray[i];
    var end = pointsArray[i + 1];

    for (var t = 0; t < numPoints * segmentIncrement; t++) {
      var point = start.clone().lerp(end, t / (numPoints * segmentIncrement));
      interpolatedPoints.push(point);
    }
  }

  // Add the last point
  interpolatedPoints.push(pointsArray[pointsArray.length - 1]);

  return interpolatedPoints;
}

const MODEL = "/triangle-localization-simulator/demo.glb";
const NAV_MODE = "/triangle-localization-simulator/demo.nav.glb";
function ThreeApp(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  const scene = new THREE.Scene();
  const pathFinder = new PathFinder(NAV_MODE);
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const setPath = (() => {
    let group = new THREE.Group();
    scene.add(group);

    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const boxGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const lineGeometry = new THREE.BufferGeometry();

    return (points) => {
      scene.remove(group);
      const newGroup = new THREE.Group();
      scene.add(newGroup);
      group = newGroup;

      lineGeometry.setFromPoints(points);

      const line = new THREE.Line(lineGeometry, lineMaterial);
      group.add(line);

      points.forEach(function (point) {
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.copy(point);
        group.add(box);
      });
    };
  })();

  const setLocalizationPoint = (() => {
    const geometry = new THREE.CapsuleGeometry(0.3, 0.2, 2, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true,
    });
    const anchor = new THREE.Object3D();
    const capsule = new THREE.Mesh(geometry, material);
    capsule.position.set(0, 0.5, 0);
    anchor.add(capsule);
    scene.add(anchor);

    return (position) => {
      anchor.position.fromArray(position);
    };
  })();

  const { setCamera, fpvCameraAgent, fpvCamera, getFpvCamera } = (() => {
    const agent = new THREE.Object3D();

    const walkThroughViewCamera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1e-3,
      1e3
    );
    walkThroughViewCamera.position.set(0, 1, 0);
    walkThroughViewCamera.rotateY(Math.PI);
    agent.add(walkThroughViewCamera);

    const fpvCameraAgent = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1e-3,
      1
    );
    fpvCameraAgent.position.set(0, 1, 0);
    fpvCameraAgent.rotateY(Math.PI);

    const helper = new THREE.CameraHelper(fpvCameraAgent);

    agent.add(fpvCameraAgent);
    scene.add(agent);
    scene.add(helper);
    const setCamera = ([x, y, z], [lookAtX, lookAtY, lookAtZ]) => {
      agent.position.set(x, y, z);
      agent.lookAt(lookAtX, lookAtY, lookAtZ);
    };

    const getFpvCamera = () => agent;
    return {
      setCamera,
      getFpvCamera,
      fpvCameraAgent: agent,
      fpvCamera: walkThroughViewCamera,
    };
  })();

  const animator = (() => {
    const STEP_SIZE = 1e-2;
    const INTERVAL_TIME = 1e-3;

    let targets = [];
    let isPause = false;

    const timer = setInterval(() => {
      if (isPause) return;
      const target = targets[0];
      if (!target) return;

      if (target.distanceTo(fpvCameraAgent.position) < STEP_SIZE) {
        fpvCameraAgent.position.copy(target);
        targets.shift();
      } else {
        const dir = new THREE.Vector3()
          .subVectors(target, fpvCameraAgent.position)
          .normalize()
          .multiplyScalar(STEP_SIZE);
        fpvCameraAgent.position.add(dir);
        fpvCameraAgent.lookAt(
          new THREE.Vector3().addVectors(
            fpvCameraAgent.position,
            new THREE.Vector3(dir.x, 0, dir.z)
          )
        );
      }
    }, INTERVAL_TIME);

    const setIsPause = (newIsPause) => (isPause = newIsPause);
    const setTargets = (point) => {
      targets = point;
    };

    const dispose = () => {
      clearInterval(timer);
    };

    return { setIsPause, setTargets, dispose };
  })();

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight2.position.set(-5, -10, -7.5);
  scene.add(directionalLight2);

  const controls = new OrbitControls(camera, renderer.domElement);
  camera.position.set(0, 10, 10);
  controls.update();

  const { getSensors, onSelectSensor } = (() => {
    const transformControls = new TransformControls(camera, canvas);
    scene.add(transformControls);
    transformControls.addEventListener("dragging-changed", function (event) {
      controls.enabled = !event.value;
    });

    const sensorGroup = new THREE.Group();
    scene.add(sensorGroup);

    const COUNT = 5;
    const colors = Array(COUNT)
      .fill(0)
      .map(
        (_, index) =>
          new THREE.Color(
            `hsl(${Math.trunc((index / (COUNT - 1)) * 255)}, 50%, 50%)`
          )
      );
    const positions = [
      [-3.629, 1.807, -2.62],
      [2.334, 3.22, 3.7855],
      [3.31, 1.43, -2.86],
      [-0.72, 1.4401589, 2.284],
      [1.718, 3.26488, -0.764],
    ];
    const objects = colors.map((color, index) => {
      const geometry = new THREE.SphereGeometry(0.5, 32, 16);
      const material = new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.fromArray(positions[index]);
      sensorGroup.add(sphere);
      return {
        color,
        object: sphere,
      };
    });

    const getSensors = () => {
      return objects.map(({ object, color }) => ({
        color,
        position: object.position,
      }));
    };

    const onSelectSensor = (event) => {
      const mouse = new THREE.Vector2();
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Set the raycaster position based on the mouse coordinates
      raycaster.setFromCamera(mouse, camera);

      // Check for intersections
      const intersects = raycaster.intersectObjects(sensorGroup.children, true);
      if (intersects.length > 0) {
        transformControls.attach(intersects[0].object);
      }
    };

    return { getSensors, onSelectSensor };
  })();

  const gridHelper = new THREE.GridHelper(20, 20);
  scene.add(gridHelper);

  const loader = new GLTFLoader();
  loader.load(MODEL, (model) => {
    scene.add(model.scene);
  });

  let navMesh;
  loader.load(NAV_MODE, (model) => {
    model.scene.traverse((node) => {
      if (node.isMesh) {
        node.material.color = new THREE.Color(0xff0000);
        node.material.opacity = 0.3;
        node.material.transparent = true;
        navMesh = node;
      }
    });
    scene.add(model.scene);
  });

  const raycaster = new THREE.Raycaster();
  const getPointFromClick = (event) => {
    const mouse = new THREE.Vector2();
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(navMesh, true);
    if (intersects.length > 0) {
      return intersects[0].point;
    }
    return null;
  };
  const findPathTo = (point) => {
    const path = pathFinder.getPathFromA2B(fpvCameraAgent.position, point);
    if (!path) return null;

    const refinePath = [
      fpvCameraAgent.position,
      ...path.map(({ x, y, z }) => new THREE.Vector3(x, y, z)),
    ];

    return refinePath;
  };
  renderer.setScissorTest(true);
  const animate = () => {
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    requestAnimationFrame(animate);

    controls.update();

    renderer.setViewport(0, 0, viewportWidth, viewportHeight);
    renderer.setScissor(0, 0, viewportWidth, viewportHeight);
    renderer.render(scene, camera);

    const size = 1 / 4;
    renderer.setViewport(
      0,
      viewportHeight * (1 - size),
      viewportWidth * size,
      viewportHeight * size
    );
    renderer.setScissor(
      0,
      viewportHeight * (1 - size),
      viewportWidth * size,
      viewportHeight * size
    );
    renderer.render(scene, fpvCamera);
  };

  const resizeCanvas = () => {
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    canvas.width = viewportWidth;
    canvas.height = viewportHeight;
    renderer.setSize(viewportWidth, viewportHeight);
    camera.aspect = viewportWidth / viewportHeight;
    camera.updateProjectionMatrix();
  };

  resizeCanvas(animate());

  return {
    animator,
    resizeCanvas,
    getPointFromClick,
    findPathTo,
    setCamera,
    setPath,
    getSensors,
    getFpvCamera,
    onSelectSensor,
    setLocalizationPoint,
  };
}

export default ThreeApp;
