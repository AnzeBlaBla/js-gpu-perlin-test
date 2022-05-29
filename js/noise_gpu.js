import { makeKernel } from "./gpu.js";
import attachSimplex from './simplex.js';


const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;

ctx.imageSmoothingEnabled = false;



const drawGame = makeKernel(function (scale, offset, offsetLimits) {

    const { x, y } = this.thread;

    const offsets = [123, 456, 678];

    const scales = [
        scale * 2,
        scale,
        scale * 0.5,
        scale * 0.25,
    ]
    let xs = [(x + offset[0]) * scales[0], (x + offset[0]) * scales[1], (x + offset[0]) * scales[2], (x + offset[0]) * scales[3]];
    let ys = [(y + offset[1]) * scales[0], (y + offset[1]) * scales[1], (y + offset[1]) * scales[2], (y + offset[1]) * scales[3]];

    /* let xs = [x * scales[0] + offset[0], x * scales[1] + offset[0], x * scales[2] + offset[0], x * scales[3] + offset[0]];
    let ys = [y * scales[0] + offset[1], y * scales[1] + offset[1], y * scales[2] + offset[1], y * scales[3] + offset[1]]; */

    const noises1 = [
        simplexNoise(xs[0] + offsets[0], ys[0] + offsets[0]),
        simplexNoise(xs[1] + offsets[0], ys[1] + offsets[0]),
        simplexNoise(xs[2] + offsets[0], ys[2] + offsets[0]),
        simplexNoise(xs[3] + offsets[0], ys[3] + offsets[0]),
    ];
    const noises2 = [
        simplexNoise(xs[0] + offsets[1], ys[0] + offsets[1]),
        simplexNoise(xs[1] + offsets[1], ys[1] + offsets[1]),
        simplexNoise(xs[2] + offsets[1], ys[2] + offsets[1]),
        simplexNoise(xs[3] + offsets[1], ys[3] + offsets[1]),
    ];
    const noises3 = [
        simplexNoise(xs[0] + offsets[2], ys[0] + offsets[2]),
        simplexNoise(xs[1] + offsets[2], ys[1] + offsets[2]),
        simplexNoise(xs[2] + offsets[2], ys[2] + offsets[2]),
        simplexNoise(xs[3] + offsets[2], ys[3] + offsets[2]),
    ];
    let mergedVal = (noises1[0] + noises1[1] + noises1[2] + noises1[3]) / 4;

    const scaledOffsetLimitMin = offsetLimits[0] / scale;
    const scaledOffsetLimitMax = offsetLimits[1] / scale;

    const scaledX = (x + offset[0]);
    const scaledY = (y + offset[1]);

    let distFromCenter = dist(scaledOffsetLimitMax / 2, scaledOffsetLimitMax / 2, scaledX, scaledY);
    distFromCenter /= scaledOffsetLimitMax;

    distFromCenter-= 0.2;
    if(distFromCenter < 0) {
        distFromCenter = 0;
    }
    mergedVal *= 1 - distFromCenter;

    const islandThreshold = 0.6;
    const beachSize = 0.02;

    let r = 0;
    let g = 0;
    let b = 0;

    if (mergedVal > islandThreshold) {
        r = noises2[3]
        g = mergedVal
        b = noises2[3]
    } else if (mergedVal > islandThreshold - beachSize) {
        r = 0.7
        g = 0.7
        b = 0.5
    } else {
        r = 0
        g = 0
        b = lerp(0.5, 1, mergedVal / islandThreshold)
    }


    // if on the limit, make red pixel
    if (scaledX < scaledOffsetLimitMin || scaledX > scaledOffsetLimitMax || scaledY < scaledOffsetLimitMin || scaledY > scaledOffsetLimitMax) {
        r = g = b = 0
    }

    this.color(r, g, b);

}, [canvas.width, canvas.height], true);
attachSimplex(drawGame);


let currentScale = 0.005;
let scrollScaleMult = 1.2;

const scrollLimits = [0.0001, 0.5];
const offsetLimits = [0, 1000];

let currentOffset = [
    offsetLimits[1] / 2 / currentScale,
    offsetLimits[1] / 2 / currentScale
];


let offsetOffset = [canvas.width / 2, canvas.height / 2];

function redrawGame() {
    drawGame(currentScale, [
        currentOffset[0] - offsetOffset[0],
        currentOffset[1] - offsetOffset[1]
    ], offsetLimits);

    // copy to canvas (scaled)
    ctx.drawImage(drawGame.canvas, 0, 0, canvas.width, canvas.height);
}



// on scroll up or down change the scale
document.addEventListener('wheel', (e) => {
    if (e.deltaY > 0 && currentScale < scrollLimits[1]) {
        currentScale *= scrollScaleMult;
        currentOffset = [
            currentOffset[0] / scrollScaleMult,
            currentOffset[1] / scrollScaleMult,
        ]
    } else if (e.deltaY < 0 && currentScale > scrollLimits[0]) {
        currentScale /= scrollScaleMult;
        currentOffset = [
            currentOffset[0] * scrollScaleMult,
            currentOffset[1] * scrollScaleMult,
        ]
    }

    /* offsetOffset = [
        e.clientX,
        canvas.height - e.clientY
    ] */
});


var offsetX = 0;
var offsetY = 0;

// mouse drag related variables
var isDown = false;
var startX, startY;


// listen for mouse events
canvas.addEventListener('mousedown', handleMouseDown, false);
canvas.addEventListener('mouseup', handleMouseUp, false);
canvas.addEventListener('mouseout', handleMouseOut, false);
canvas.addEventListener('mousemove', handleMouseMove, false);

function handleMouseDown(e) {
    // tell the browser we're handling this event
    e.preventDefault();
    e.stopPropagation();

    // calc the starting mouse X,Y for the drag
    startX = parseInt(e.clientX - offsetX);
    startY = parseInt(e.clientY - offsetY);

    // set the isDragging flag
    isDown = true;
}

function handleMouseUp(e) {
    // tell the browser we're handling this event
    e.preventDefault();
    e.stopPropagation();

    // clear the isDragging flag
    isDown = false;
}

function handleMouseOut(e) {
    // tell the browser we're handling this event
    e.preventDefault();
    e.stopPropagation();

    // clear the isDragging flag
    isDown = false;
}

function handleMouseMove(e) {
    // only do this code if the mouse is being dragged
    if (!isDown) { return; }

    // tell the browser we're handling this event
    e.preventDefault();
    e.stopPropagation();

    // get the current mouse position
    let mouseX = parseInt(e.clientX - offsetX);
    let mouseY = parseInt(e.clientY - offsetY);

    // dx & dy are the distance the mouse has moved since
    // the last mousemove event
    var dx = mouseX - startX;
    var dy = mouseY - startY;

    // reset the vars for next mousemove
    startX = mouseX;
    startY = mouseY;

    // accumulate the net panning done
    currentOffset[0] -= dx;
    currentOffset[1] += dy;


    const scaledOffsetLimits = [
        offsetLimits[0] / currentScale,
        offsetLimits[1] / currentScale,
    ];
    if (currentOffset[0] < scaledOffsetLimits[0]) {
        currentOffset[0] = scaledOffsetLimits[0];
    }
    if (currentOffset[0] > scaledOffsetLimits[1]) {
        currentOffset[0] = scaledOffsetLimits[1];
    }
    if (currentOffset[1] < scaledOffsetLimits[0]) {
        currentOffset[1] = scaledOffsetLimits[0];
    }
    if (currentOffset[1] > scaledOffsetLimits[1]) {
        currentOffset[1] = scaledOffsetLimits[1];
    }


}


function gameLoop() {

    redrawGame();

    requestAnimationFrame(gameLoop);
}

gameLoop();