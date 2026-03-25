// --- SECTION 1: Engine Initialization ---
const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d', { alpha: false }); // Optimize by disabling transparency

const SCREEN_WIDTH = 320;
const SCREEN_HEIGHT = 200;

// Create raw image data
const imageData = ctx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);

// Create a 32-bit view into the pixel buffer for fast C-style memory writing.
// Format is ABGR (Alpha, Blue, Green, Red) due to browser endianness.
const framebuffer = new Uint32Array(imageData.data.buffer);

// --- SECTION 2: The Render Logic ---
function clearScreen() {
    // Quickly fill the entire memory buffer with black (0xFF000000 is solid black in ABGR)
    framebuffer.fill(0xFF000000);
}

function drawTestPattern() {
    // A simple loop to prove we control the pixel memory.
    // We will draw a static red gradient to ensure the buffer works.
    for (let y = 0; y < SCREEN_HEIGHT; y++) {
        for (let x = 0; x < SCREEN_WIDTH; x++) {
            // Calculate a red value based on the X coordinate
            let red = x % 256;
            
            // Construct the 32-bit color: Alpha (255) | Blue (0) | Green (0) | Red
            let color = (255 << 24) | (0 << 16) | (0 << 8) | red;
            
            // Write directly to the 1D memory array
            framebuffer[y * SCREEN_WIDTH + x] = color;
        }
    }
}

// --- SECTION 3: The Game Loop ---
function tick() {
    // 1. Clear the memory
    clearScreen();
    
    // 2. Draw our graphics directly to memory
    drawTestPattern();
    
    // 3. Flush the memory buffer to the physical screen
    ctx.putImageData(imageData, 0, 0);
    
    // Loop
    requestAnimationFrame(tick);
}

// Start the engine
tick();
