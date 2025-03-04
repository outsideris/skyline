import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;

/**
 * Initialize the 3D scene with GitHub contribution data
 * @param {Array} contributionData - Array of GitHub contribution data
 */
export function init3D(contributionData) {
  // Clear previous scene if exists
  const container = document.getElementById('3d-canvas') || document.getElementById('app');
  const existingCanvas = container.querySelector('canvas');
  if (existingCanvas) {
    container.removeChild(existingCanvas);
  }

  // Setup scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  // Setup camera
  camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(20, 30, 40);

  // Setup renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Setup controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Add lights
  addLights();

  // Create contribution visualization first to get dimensions
  let contributionDimensions = { width: 0, depth: 0 };
  if (contributionData && contributionData.length > 0) {
    contributionDimensions = createContributionGraph(contributionData);
  }

  // Add rectangular floor with sloped sides based on contribution graph dimensions
  addRectangularBaseWithSlopedEdges(contributionDimensions);

  // Handle window resize
  window.addEventListener('resize', onWindowResize);

  // Start animation loop
  animate();

  return {
    scene,
    camera,
    renderer
  };
}

/**
 * Add lights to the scene
 */
function addLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
}

/**
 * Add rectangular base with sloped edges to the scene
 * @param {Object} dimensions - Width and depth dimensions for the base
 */
function addRectangularBaseWithSlopedEdges(dimensions = { width: 0, depth: 0 }) {
  // Create a custom shape for the base (top view)
  const shape = new THREE.Shape();

  // Dimensions - use contribution graph dimensions plus a small margin
  // If no contributions, use default size
  const margin = 2;
  const width = dimensions.width > 0 ? dimensions.width + margin : 30;
  const depth = dimensions.depth > 0 ? dimensions.depth + margin : 10;
  const slopeWidth = 2;  // Width of the sloped edge (reduced from 5)

  // Define points for the top face (clockwise)
  shape.moveTo(-width/2, -depth/2);               // Bottom-left
  shape.lineTo(width/2, -depth/2);                // Bottom-right
  shape.lineTo(width/2, depth/2);                 // Top-right
  shape.lineTo(-width/2, depth/2);                // Top-left
  shape.lineTo(-width/2, -depth/2);               // Back to start

  // Extrusion settings with bevel to create sloped edges
  const extrudeSettings = {
    steps: 1,
    depth: 1.5,                  // Thickness of the base (reduced from 2)
    bevelEnabled: true,          // Enable bevels for sloped sides
    bevelThickness: 1.5,         // How far the bevel extends (reduced from 2)
    bevelSize: slopeWidth,       // Distance from the original shape outline
    bevelOffset: 0,              // How far from the shape outline the bevel starts
    bevelSegments: 1             // Number of bevel segments (keep low for flat slopes)
  };

  // Create geometry and material
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const material = new THREE.MeshStandardMaterial({
    color: 0xd0d0d0,
    metalness: 0.2,
    roughness: 0.8,
    side: THREE.DoubleSide
  });

  // Create mesh
  const floor = new THREE.Mesh(geometry, material);

  // Rotate so it's flat on the ground and position it
  floor.rotation.x = Math.PI / 2;  // Rotate to be horizontal
  floor.position.y = -3;           // Position below the contribution cubes

  scene.add(floor);
}

/**
 * Create 3D visualization of the contribution data
 * @param {Array} contributionData - Array of GitHub contribution data
 * @returns {Object} Dimensions of the contribution graph
 */
function createContributionGraph(contributionData) {
  // Group data by week (7 days)
  const weeks = [];
  for (let i = 0; i < contributionData.length; i += 7) {
    weeks.push(contributionData.slice(i, i + 7));
  }

  // Create a group to hold all contribution cubes
  const contributionGroup = new THREE.Group();

  // Define material colors based on contribution levels
  const colors = [
    0xebedf0, // Level 0 - None
    0x9be9a8, // Level 1 - Light
    0x40c463, // Level 2 - Medium
    0x30a14e, // Level 3 - High
    0x216e39  // Level 4 - Very High
  ];

  // Maximum allowed height for a contribution cube
  const MAX_HEIGHT = 10;

  // Create cubes for each contribution
  weeks.forEach((week, weekIndex) => {
    week.forEach((day, dayIndex) => {
      // Skip days with no contributions if desired
      if (day.count === 0) {
        // Create a small placeholder cube for days with no contributions
        const geometry = new THREE.BoxGeometry(0.9, 0.1, 0.9);
        const material = new THREE.MeshStandardMaterial({ color: colors[0] });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(weekIndex * 1.1, 0.05, dayIndex * 1.1);
        contributionGroup.add(cube);
        return;
      }

      // Calculate height based on contribution count (capped at MAX_HEIGHT)
      const height = Math.min(1 + day.count * 0.2, MAX_HEIGHT);

      // Create cube geometry
      const geometry = new THREE.BoxGeometry(0.9, height, 0.9);

      // Create material with color based on contribution level
      const material = new THREE.MeshStandardMaterial({
        color: colors[day.level],
        // Add shiny effect
        metalness: 0.3,
        roughness: 0.7
      });

      // Create mesh and position it
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(
        weekIndex * 1.1,         // x position (week)
        height / 2,              // y position (centered vertically)
        dayIndex * 1.1           // z position (day of week)
      );

      // Add metadata to the cube for interactions
      cube.userData = {
        date: day.date,
        count: day.count,
        level: day.level
      };

      // Add to contribution group
      contributionGroup.add(cube);
    });
  });

  // Calculate dimensions of the contribution graph
  const graphWidth = weeks.length * 1.1;
  const graphDepth = 7 * 1.1; // 7 days per week

  // Center the contribution graph in the scene
  contributionGroup.position.set(-weeks.length * 0.55, 0, -3.5);
  scene.add(contributionGroup);

  // Return dimensions for the base plate
  return {
    width: graphWidth,
    depth: graphDepth
  };
}

/**
 * Handle window resize
 */
function onWindowResize() {
  const container = document.getElementById('3d-canvas') || document.getElementById('app');
  if (container && camera && renderer) {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
}

/**
 * Animation loop
 */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
