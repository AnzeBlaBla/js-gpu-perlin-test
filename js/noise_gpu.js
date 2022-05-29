import { makeKernel } from "./gpu.js";
import attachSimplex from './simplex.js';


const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;

ctx.imageSmoothingEnabled = false;



const drawGame = makeKernel(function (scale, offset) {

    const { x, y } = this.thread;

    const offsets = [123,456,678];

    const scales = [
        scale,
        scale * 0.5,
        scale * 0.25,
        scale * 0.125,
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
    const mergedVal = (noises1[0] + noises1[1] + noises1[2] + noises1[3]) / 4;


    const islandThreshold = 0.6;
    const beachSize = 0.02;

    if (mergedVal > islandThreshold) {
        this.color(
            noises2[3],
            mergedVal,
            noises3[3],
        );
    } else if (mergedVal > islandThreshold - beachSize) {
        this.color(
            0.7, 0.7, 0.5
        );
    } else {
        this.color(0, 0, lerp(0.5, 1, mergedVal / islandThreshold));
    }

}, [canvas.width, canvas.height], true);
attachSimplex(drawGame);


let currentScale = 0.005;
let scrollScaleMult = 1.2;
let currentOffset = [0, 0];
function redrawGame() {
    drawGame(currentScale, [
        currentOffset[0] - canvas.width / 2,
        currentOffset[1] - canvas.height / 2
    ]);

    // copy to canvas (scaled)
    ctx.drawImage(drawGame.canvas, 0, 0, canvas.width, canvas.height);
}


// on scroll up or down change the scale
document.addEventListener('wheel', (e) => {
    if (e.deltaY > 0) {
        currentScale *= scrollScaleMult;
        currentOffset = [
            currentOffset[0] / scrollScaleMult,
            currentOffset[1] / scrollScaleMult,
        ]
    } else {
        currentScale /= scrollScaleMult;
        currentOffset = [
            currentOffset[0] * scrollScaleMult,
            currentOffset[1] * scrollScaleMult,
        ]
    }
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
}


// touch
canvas.addEventListener('touchstart', handleTouchStart, false);
canvas.addEventListener('touchend', handleTouchEnd, false);
canvas.addEventListener('touchmove', handleTouchMove, false);

function handleTouchStart(e) {
    // tell the browser we're handling this event
    e.preventDefault();
    e.stopPropagation();

    // get the current mouse position
    let mouseX = parseInt(e.touches[0].clientX - offsetX);
    let mouseY = parseInt(e.touches[0].clientY - offsetY);

    // calc the starting mouse X,Y for the drag
    startX = mouseX;
    startY = mouseY;

    // set the isDragging flag
    isDown = true;
}

function handleTouchEnd(e) {
    // tell the browser we're handling this event
    e.preventDefault();
    e.stopPropagation();

    // clear the isDragging flag
    isDown = false;
}

function handleTouchMove(e) {
    // only do this code if the mouse is being dragged
    if (!isDown) { return; }

    // tell the browser we're handling this event
    e.preventDefault();
    e.stopPropagation();

    // get the current mouse position
    let mouseX = parseInt(e.touches[0].clientX - offsetX);
    let mouseY = parseInt(e.touches[0].clientY - offsetY);

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
}



function gameLoop() {

    redrawGame();

    requestAnimationFrame(gameLoop);
}

gameLoop();