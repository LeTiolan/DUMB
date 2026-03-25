/* =========================================
   DUMB Engine - Layer 3: Functional Logic
   Phase 1, Segment 2: Map Data & Player
   ========================================= */

// --- SECTION 1: Engine Initialization ---
const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d', { alpha: false }); 

const SCREEN_WIDTH = 320;
const SCREEN_HEIGHT = 200;
const HALF_HEIGHT = SCREEN_HEIGHT / 2;

const imageData = ctx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
const framebuffer = new Uint32Array(imageData.data.buffer);

// --- SECTION 2: Map Geometry & Player (NEW) ---
// We define a simple square room using 2D vector coordinates.
const vertices = [
    { x: 10, y: 10 }, // Vertex 0: Top-Left
    { x: 30, y: 10 }, // Vertex 1: Top-Right
    { x: 30, y: 30 }, // Vertex 2: Bottom-Right
    { x: 10, y: 30 }  // Vertex 3: Bottom-Left
];

// Linedefs connect the vertices to create solid walls.
// We assign each wall a unique 32-bit color (ABGR) so we can tell them apart later.
const linedefs = [
    { v1: 0, v2: 1, color: 0xFFAA0000 }, // Top wall (Blue-ish)
    { v1: 1, v2: 2, color: 0xFF00AA00 }, // Right wall (Green-ish)
    { v1: 2, v2: 3, color: 0xFF0000AA }, // Bottom wall (Red-ish)
    { v1: 3, v2: 0, color: 0xFFAAAAAA }  // Left wall (Grey)
];

// The player exists as a mathematical point in this 2D space.
const player = {
    x: 20,              // Placed dead center in the room
    y: 20,
    angle: 0,           // Facing right (0 radians)
    fov: Math.PI / 3    // 60-degree Field of View
};

// --- SECTION 3: The Viewport Renderer ---
function drawHorizon() {
    const colorCeiling = 0xFF333333; // Dark Grey
    const colorFloor = 0xFF112255;   // Dark Brownish/Red

    for (let y = 0; y < SCREEN_HEIGHT; y++) {
        for (let x = 0; x < SCREEN_WIDTH; x++) {
            let pixelIndex = y * SCREEN_WIDTH + x;
            if (y < HALF_HEIGHT) {
                framebuffer[pixelIndex] = colorCeiling;
            } else {
                framebuffer[pixelIndex] = colorFloor;
            }
        }
    }
}

// --- SECTION 4: The Game Loop ---
function tick() {
    // 1. Draw the floor and ceiling
    drawHorizon();
    
    // (In the next segment, we will mathematically project our walls here)
    
    // 2. Flush memory to the screen
    ctx.putImageData(imageData, 0, 0);
    requestAnimationFrame(tick);
}

tick();
