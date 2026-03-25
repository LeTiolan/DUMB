/* =========================================
   DUMB Engine - Layer 3: Functional Logic
   Phase 1, Segment 3: The Raycaster
   ========================================= */

// --- SECTION 1: Engine Initialization ---
const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d', { alpha: false }); 

const SCREEN_WIDTH = 320;
const SCREEN_HEIGHT = 200;
const HALF_HEIGHT = SCREEN_HEIGHT / 2;

const imageData = ctx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
const framebuffer = new Uint32Array(imageData.data.buffer);

// --- SECTION 2: Map Geometry & Player ---
const vertices = [
    { x: 10, y: 10 }, 
    { x: 30, y: 10 }, 
    { x: 30, y: 30 }, 
    { x: 10, y: 30 }  
];

const linedefs = [
    { v1: 0, v2: 1, color: 0xFFAA0000 }, // Blue-ish
    { v1: 1, v2: 2, color: 0xFF00AA00 }, // Green-ish
    { v1: 2, v2: 3, color: 0xFF0000AA }, // Red-ish
    { v1: 3, v2: 0, color: 0xFFAAAAAA }  // Grey
];

const player = {
    x: 20,              
    y: 20,
    angle: 0,           // 0 radians = Facing directly right (towards the green wall)
    fov: Math.PI / 3    // 60-degree Field of View
};

// --- SECTION 3: The Viewport Renderer ---
function drawHorizon() {
    const colorCeiling = 0xFF333333; 
    const colorFloor = 0xFF112255;   

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

// NEW: Shoot rays from the player to detect and draw walls
function draw3DWalls() {
    // Iterate through every vertical pixel column (0 to 319)
    for (let x = 0; x < SCREEN_WIDTH; x++) {
        // 1. Calculate the angle of the ray for this specific screen column
        let rayAngle = (player.angle - player.fov / 2.0) + (x / SCREEN_WIDTH) * player.fov;
        
        // Direction vector of the ray
        let dirX = Math.cos(rayAngle);
        let dirY = Math.sin(rayAngle);

        let closestDistance = Infinity;
        let closestColor = 0;

        // 2. Check this ray against every wall in the map
        for (let i = 0; i < linedefs.length; i++) {
            let wall = linedefs[i];
            let p1 = vertices[wall.v1];
            let p2 = vertices[wall.v2];

            // Ray-Line Intersection Math
            let v1x = player.x - p1.x;
            let v1y = player.y - p1.y;
            let v2x = p2.x - p1.x;
            let v2y = p2.y - p1.y;

            let cross = dirX * v2y - dirY * v2x;

            // If cross product is ~0, the ray and wall are parallel (won't hit)
            if (Math.abs(cross) < 0.0001) continue;

            let t = (v1x * v2y - v1y * v2x) / cross; // Distance along the ray
            let u = (v1x * dirY - v1y * dirX) / cross; // Position along the wall segment

            // If t > 0 (hit is in front of player) AND u is between 0 and 1 (hit is physically on the wall)
            if (t > 0 && u >= 0 && u <= 1) {
                if (t < closestDistance) {
                    // Fix "fisheye" lens distortion by applying cosine of the relative angle
                    closestDistance = t * Math.cos(rayAngle - player.angle);
                    closestColor = wall.color;
                }
            }
        }

        // 3. Draw the vertical strip of the closest wall we hit
        if (closestDistance < Infinity && closestDistance > 0) {
            // Calculate height of the line on screen. (150 is an arbitrary scale factor for our room size)
            let wallHeight = Math.floor((150 / closestDistance));

            // Calculate start and end points for drawing, clamped to the screen boundaries
            let drawStart = HALF_HEIGHT - Math.floor(wallHeight / 2);
            let drawEnd = HALF_HEIGHT + Math.floor(wallHeight / 2);

            if (drawStart < 0) drawStart = 0;
            if (drawEnd >= SCREEN_HEIGHT) drawEnd = SCREEN_HEIGHT - 1;

            // Write the color to the memory array vertically
            for (let y = drawStart; y <= drawEnd; y++) {
                framebuffer[y * SCREEN_WIDTH + x] = closestColor;
            }
        }
    }
}

// --- SECTION 4: The Game Loop ---
function tick() {
    drawHorizon();
    draw3DWalls(); // Execute the new raycaster
    ctx.putImageData(imageData, 0, 0);
    requestAnimationFrame(tick);
}

tick();
