import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Pathfinding } from "three-pathfinding";

function PathFinder(navPath) {
  const pathfinding = new Pathfinding();
  const ZONE = "level1";

  const loader = new GLTFLoader();
  loader.load(navPath, ({ scene }) => {
    let navmesh = null;
    scene.traverse((node) => {
      if (node.isMesh) navmesh = node;
    });

    // Create level.
    pathfinding.setZoneData(ZONE, Pathfinding.createZone(navmesh.geometry));
  });

  // Find path from A to B.
  const getPathFromA2B = (a, b) => {
    const groupID = pathfinding.getGroup(ZONE, a);
    const path = pathfinding.findPath(a, b, ZONE, groupID);
    return path;
  };

  return { getPathFromA2B };
}

export default PathFinder;
