/* =========================================
   DUMB Engine - Layer 3: Functional Logic
   Phase 5, Segment 1: Sprite Billboarding
   ========================================= */

// --- SECTION 1: Engine Initialization ---
const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d', { alpha: false }); 

const SCREEN_WIDTH = 320;
const SCREEN_HEIGHT = 200;
const HALF_HEIGHT = SCREEN_HEIGHT / 2;

const imageData = ctx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
const framebuffer = new Uint32Array(imageData.data.buffer);

// NEW: The 1D Depth Buffer for tracking wall distances
const zBuffer = new Float32Array(SCREEN_WIDTH);

// --- SECTION 2: Map Geometry, Player, & Entities ---
const vertices = [
    { x: 10, y: 10 }, 
    { x: 30, y: 10 }, 
    { x: 30, y: 30 }, 
    { x: 10, y: 30 }  
];

const linedefs = [
    { v1: 0, v2: 1, color: 0xFFAA0000 }, 
    { v1: 1, v2: 2, color: 0xFF00AA00 }, 
    { v1: 2, v2: 3, color: 0xFF0000AA }, 
    { v1: 3, v2: 0, color: 0xFFAAAAAA }  
];

const player = {
    x: 20,              
    y: 20,
    angle: 0,           
    fov: Math.PI / 3,
    radius: 1.5
};

// NEW: Our Entity array. We place a bright yellow "enemy" in the corner of the room.
const sprites = [
    { x: 25, y: 15, color: 0xFF00FFFF } // Yellow (ABGR format)
];

// --- SECTION 3: Input Handling ---
const keys = { w: false, a: false, s: false, d: false };

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = true;
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = false;
});

// --- SECTION 4: Physics & Collision ---
function getDistanceToWall(px, py, p1x, p1y, p2x, p2y) {
    let A = px - p1x;
    let B = py - p1y;
    let C = p2x - p1x;
    let D = p2y - p1y;

    let dot = A * C + B * D;
    let lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;

    let closestX, closestY;

    if (param < 0) {
        closestX = p1x;
        closestY = p1y;
    } else if (param > 1) {
        closestX = p2x;
        closestY = p2y;
    } else {
        closestX = p1x + param * C;
        closestY = p1y + param * D;
    }

    let dx = px - closestX;
    let dy = py - closestY;
    
    return Math.sqrt(dx * dx + dy * dy);
}

function isColliding(targetX, targetY) {
    for (let i = 0; i < linedefs.length; i++) {
        let p1 = vertices[linedefs[i].v1];
        let p2 = vertices[linedefs[i].v2];
        if (getDistanceToWall(targetX, targetY, p1.x, p1.y, p2.x, p2.y) < player.radius) {
            return true; 
        }
    }
    return false;
}

// --- SECTION 5: The Viewport Renderer ---
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

        // NEW: Record the distance of the wall into our Z-Buffer
        zBuffer[x] = closestDistance;

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

// NEW: Render 2D Sprites facing the camera
function drawSprites() {
    for (let i = 0; i < sprites.length; i++) {
        let sprite = sprites[i];

        // 1. Calculate the angle and distance from the player to the sprite
        let dx = sprite.x - player.x;
        let dy = sprite.y - player.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let angleToSprite = Math.atan2(dy, dx);

        // 2. Find the difference between the player's view angle and the sprite's angle
        let angleDiff = angleToSprite - player.angle;

        // Normalize the angle so it strictly wraps between -PI and PI
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;

        // 3. Fix fisheye distortion for the sprite
        let correctedDist = distance * Math.cos(angleDiff);

        // If the sprite is behind us, or too close to avoid divide-by-zero, skip drawing
        if (correctedDist <= 0) continue;

        // 4. Calculate projection (size on screen and X position)
        let spriteSize = Math.floor(150 / correctedDist);
        
        // Map the angle difference directly to our screen width based on FOV
        let screenX = Math.floor((SCREEN_WIDTH / 2) * (1 + (angleDiff / (player.fov / 2))));

        // Calculate drawing boundaries
        let drawStartX = Math.floor(screenX - spriteSize / 2);
        let drawEndX = Math.floor(screenX + spriteSize / 2);
        let drawStartY = HALF_HEIGHT - Math.floor(spriteSize / 2);
        let drawEndY = HALF_HEIGHT + Math.floor(spriteSize / 2);

        if (drawStartY < 0) drawStartY = 0;
        if (drawEndY >= SCREEN_HEIGHT) drawEndY = SCREEN_HEIGHT - 1;

        // 5. Draw the sprite column by column
        for (let x = drawStartX; x <= drawEndX; x++) {
            // Is the pixel on the screen? AND is it closer than the wall in the Z-Buffer?
            if (x >= 0 && x < SCREEN_WIDTH && correctedDist < zBuffer[x]) {
                // Draw the vertical strip of the sprite
                for (let y = drawStartY; y <= drawEndY; y++) {
                    framebuffer[y * SCREEN_WIDTH + x] = sprite.color;
                }
            }
        }
    }
}

// --- SECTION 6: Game Logic & Loop ---
function update() {
    const moveSpeed = 0.05; 
    const rotSpeed = 0.03;  

    if (keys.a) player.angle -= rotSpeed;
    if (keys.d) player.angle += rotSpeed;

    let newX = player.x;
    let newY = player.y;

    if (keys.w) {
        newX += Math.cos(player.angle) * moveSpeed;
        newY += Math.sin(player.angle) * moveSpeed;
    }
    if (keys.s) {
        newX -= Math.cos(player.angle) * moveSpeed;
        newY -= Math.sin(player.angle) * moveSpeed;
    }

    if (!isColliding(newX, player.y)) player.x = newX;
    if (!isColliding(player.x, newY)) player.y = newY;
}

function tick() {
    update();
    drawHorizon();
    draw3DWalls(); 
    drawSprites(); // NEW: Draw sprites immediately after walls
    ctx.putImageData(imageData, 0, 0);
    requestAnimationFrame(tick);
}

tick();
