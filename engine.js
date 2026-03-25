/* =========================================
   DUMB Engine - Layer 3: Functional Logic
   Phase 1, Segment 1: The 3D Viewport
   ========================================= */

// --- SECTION 1: Engine Initialization ---
const canvas = document.getElementById('screen');
// Disable alpha channel for a slight performance boost
const ctx = canvas.getContext('2d', { alpha: false }); 

const SCREEN_WIDTH = 320;
const SCREEN_HEIGHT = 200;
const HALF_HEIGHT = SCREEN_HEIGHT / 2;

// Create raw image data
const imageData = ctx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);

// Create a 32-bit view into the pixel buffer for fast memory writing.
// Browser Endianness means colors are written as ABGR (Alpha, Blue, Green, Red)
const framebuffer = new Uint32Array(imageData.data.buffer);

// --- SECTION 2: The Viewport Renderer ---
function drawHorizon() {
    // 32-bit color format: 0xAABBGGRR
    const colorCeiling = 0xFF333333; // Dark Grey
    const colorFloor = 0xFF112255;   // Dark Brownish/Red

    // Loop through every pixel on the screen
    for (let y = 0; y < SCREEN_HEIGHT; y++) {
        for (let x = 0; x < SCREEN_WIDTH; x++) {
            // Calculate the 1D array index from 2D coordinates
            let pixelIndex = y * SCREEN_WIDTH + x;
            
            // Top half of the screen is the ceiling, bottom half is the floor
            if (y < HALF_HEIGHT) {
                framebuffer[pixelIndex] = colorCeiling;
            } else {
                framebuffer[pixelIndex] = colorFloor;
            }
        }
    }
}

// --- SECTION 3: The Game Loop ---
function tick() {
    // 1. Calculate and draw the frame to memory
    drawHorizon();
    
    // 2. Flush the raw memory buffer to the physical HTML Canvas
    ctx.putImageData(imageData, 0, 0);
    
    // 3. Request the browser to draw the next frame
    requestAnimationFrame(tick);
}

// Boot the engine
tick();
