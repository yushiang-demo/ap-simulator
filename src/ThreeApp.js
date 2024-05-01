import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import PathFinder from "./PathFinder";

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
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
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

  const { setCamera, firstPersonViewCamera } = (() => {
    const firstPersonViewCamera = new THREE.PerspectiveCamera(
      30,
      window.innerWidth / window.innerHeight,
      0.1,
      3
    );
    const helper = new THREE.CameraHelper(firstPersonViewCamera);
    scene.add(firstPersonViewCamera);
    scene.add(helper);
    const setCamera = ([x, y, z], [lookAtX, lookAtY, lookAtZ]) => {
      firstPersonViewCamera.position.set(x, y, z);
      firstPersonViewCamera.lookAt(lookAtX, lookAtY, lookAtZ);
    };
    return { setCamera, firstPersonViewCamera };
  })();

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  const controls = new OrbitControls(camera, renderer.domElement);
  camera.position.set(0, 10, 10);
  controls.update();

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
  const onFindPath = (event) => {
    const mouse = new THREE.Vector2();
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Set the raycaster position based on the mouse coordinates
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      // Get the coordinates of the first intersection point
      const { point } = intersects[0];
      const path = pathFinder.getPathFromA2B(
        firstPersonViewCamera.position,
        point
      );
      if (!path) return null;
      return [firstPersonViewCamera.position, ...path];
    }
    return null;
  };

  const animate = () => {
    requestAnimationFrame(animate);

    controls.update();

    renderer.render(scene, camera);
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
    resizeCanvas,
    onFindPath,
    setCamera,
    setPath,
  };
}

export default ThreeApp;
