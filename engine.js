// --- SECTION 1: Engine Initialization ---
const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d', { alpha: false }); 

const SCREEN_WIDTH = 320;
const SCREEN_HEIGHT = 200;

const imageData = ctx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
const framebuffer = new Uint32Array(imageData.data.buffer);

// --- SECTION 2: Map Geometry & Player Data (NEW) ---
// Doom maps are built using Vertices (x,y points) and Linedefs (connecting lines)
const vertices = [
    { x: 50, y: 50 },   // Vertex 0: Top Left
    { x: 270, y: 50 },  // Vertex 1: Top Right
    { x: 270, y: 150 }, // Vertex 2: Bottom Right
    { x: 50, y: 150 },  // Vertex 3: Bottom Left
    { x: 160, y: 50 },  // Vertex 4: Middle Top (for inner wall)
    { x: 160, y: 100 }  // Vertex 5: Middle Center (for inner wall)
];

const linedefs = [
    { v1: 0, v2: 1 }, // Top wall
    { v1: 1, v2: 2 }, // Right wall
    { v1: 2, v2: 3 }, // Bottom wall
    { v1: 3, v2: 0 }, // Left wall
    { v1: 4, v2: 5 }  // An inner wall segment sticking out
];

const player = {
    x: 100,
    y: 100,
    angle: 0 // We will use this when we add a camera later
};

// --- SECTION 3: The Render Logic ---
function clearScreen() {
    framebuffer.fill(0xFF000000); // Fill with solid black
}

// NEW: Bresenham's Line Algorithm. 
// This calculates exactly which pixels to color to draw a straight line.
function drawLine(x0, y0, x1, y1, color) {
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        // Strict boundary check to prevent memory leaks outside the canvas
        if (x0 >= 0 && x0 < SCREEN_WIDTH && y0 >= 0 && y0 < SCREEN_HEIGHT) {
            framebuffer[y0 * SCREEN_WIDTH + x0] = color;
        }

        if (x0 === x1 && y0 === y1) break;
        let e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
}

// NEW: Iterate through our map data and draw it to the buffer
function drawMap2D() {
    // 32-bit White (Alpha, Blue, Green, Red)
    const colorWhite = (255 << 24) | (255 << 16) | (255 << 8) | 255;
    
    // Draw walls
    for (let i = 0; i < linedefs.length; i++) {
        const line = linedefs[i];
        const v1 = vertices[line.v1];
        const v2 = vertices[line.v2];
        
        drawLine(
            Math.floor(v1.x), Math.floor(v1.y), 
            Math.floor(v2.x), Math.floor(v2.y), 
            colorWhite
        );
    }

    // Draw player as a 3x3 red square
    const colorRed = (255 << 24) | (0 << 16) | (0 << 8) | 255;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            let px = Math.floor(player.x) + dx;
            let py = Math.floor(player.y) + dy;
            if (px >= 0 && px < SCREEN_WIDTH && py >= 0 && py < SCREEN_HEIGHT) {
                framebuffer[py * SCREEN_WIDTH + px] = colorRed;
            }
        }
    }
}

// --- SECTION 4: The Game Loop ---
function tick() {
    clearScreen();
    drawMap2D(); // Execute the new top-down map render
    ctx.putImageData(imageData, 0, 0);
    requestAnimationFrame(tick);
}

tick();
