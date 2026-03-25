/* =========================================
   DUMB Engine - Layer 3: Functional Logic
   Phase 2, Segment 1: Input & Movement
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
    angle: 0,           
    fov: Math.PI / 3    
};

// --- SECTION 3: Input Handling (NEW) ---
// We use a dictionary to track which keys are currently being held down.
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// Listen for keys being pressed
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = true;
});

// Listen for keys being released
window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = false;
});

// --- SECTION 4: The Viewport Renderer ---
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

function draw3DWalls() {
    for (let x = 0; x < SCREEN_WIDTH; x++) {
        let rayAngle = (player.angle - player.fov / 2.0) + (x / SCREEN_WIDTH) * player.fov;
        
        let dirX = Math.cos(rayAngle);
        let dirY = Math.sin(rayAngle);

        let closestDistance = Infinity;
        let closestColor = 0;

        for (let i = 0; i < linedefs.length; i++) {
            let wall = linedefs[i];
            let p1 = vertices[wall.v1];
            let p2 = vertices[wall.v2];

            let v1x = player.x - p1.x;
            let v1y = player.y - p1.y;
            let v2x = p2.x - p1.x;
            let v2y = p2.y - p1.y;

            let cross = dirX * v2y - dirY * v2x;

            if (Math.abs(cross) < 0.0001) continue;

            let t = (v1x * v2y - v1y * v2x) / cross; 
            let u = (v1x * dirY - v1y * dirX) / cross; 

            if (t > 0 && u >= 0 && u <= 1) {
                if (t < closestDistance) {
                    closestDistance = t * Math.cos(rayAngle - player.angle);
                    closestColor = wall.color;
                }
            }
        }

        if (closestDistance < Infinity && closestDistance > 0) {
            let wallHeight = Math.floor((150 / closestDistance));

            let drawStart = HALF_HEIGHT - Math.floor(wallHeight / 2);
            let drawEnd = HALF_HEIGHT + Math.floor(wallHeight / 2);

            if (drawStart < 0) drawStart = 0;
            if (drawEnd >= SCREEN_HEIGHT) drawEnd = SCREEN_HEIGHT - 1;

            for (let y = drawStart; y <= drawEnd; y++) {
                framebuffer[y * SCREEN_WIDTH + x] = closestColor;
            }
        }
    }
}

// --- SECTION 5: Game Logic & Loop (UPDATED) ---
// NEW: Update player coordinates mathematically before drawing
function update() {
    const moveSpeed = 0.05; // Distance moved per frame
    const rotSpeed = 0.03;  // Radians rotated per frame

    // Rotation
    if (keys.a) player.angle -= rotSpeed;
    if (keys.d) player.angle += rotSpeed;

    // Forward / Backward movement along the player's current angle vector
    if (keys.w) {
        player.x += Math.cos(player.angle) * moveSpeed;
        player.y += Math.sin(player.angle) * moveSpeed;
    }
    if (keys.s) {
        player.x -= Math.cos(player.angle) * moveSpeed;
        player.y -= Math.sin(player.angle) * moveSpeed;
    }
}

function tick() {
    // 1. Process physics/input
    update();

    // 2. Draw the frame
    drawHorizon();
    draw3DWalls(); 
    ctx.putImageData(imageData, 0, 0);

    // 3. Loop
    requestAnimationFrame(tick);
}

tick();
