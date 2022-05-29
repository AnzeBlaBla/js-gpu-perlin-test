import { noise2D } from './simplex.js';

const gpu = new GPU({
    mode: "gpu"
});
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const desiredGameSize = [document.body.clientWidth, document.body.clientHeight];
const squareSize = [2, 2];
// as many as can fit on screen
const gameSize = [desiredGameSize[0] - (desiredGameSize[0] % squareSize[0]), desiredGameSize[1] - (desiredGameSize[1] % squareSize[1])];
console.log(gameSize)
const squareCount = [
    Math.ceil(gameSize[0] / squareSize[0]),
    Math.ceil(gameSize[1] / squareSize[1])
];

canvas.width = gameSize[0];
canvas.height = gameSize[1];

ctx.imageSmoothingEnabled = false;


function makeKernel(func, outputSize, isGPU = true, functions = []) {
    console.log("outputSize", outputSize, "isGPU", isGPU, "functions", functions)
    return gpu.createKernel(func)
        .setOutput([outputSize[0], outputSize[1]])
        .setGraphical(isGPU)
        .setDynamicArguments(true)
        .setDynamicOutput(true)
        .setFunctions(functions);
}

// make game noise
const offsetMult = 100;
const getRandomOffset = () => (Math.random() - 0.5) * offsetMult
const levels = 5;
const randomOffsets = [];
for (let i = 0; i < levels; i++) {
    randomOffsets.push([getRandomOffset(), getRandomOffset()]);
}
const noiseAt = (x, y, scale = 0.05, offset = [0, 0]) => {
    return (noise2D(x * scale + offset[0], y * scale + offset[1]) + 1) / 2;
}

function makeGame(startScale = 0.005, scaleChangeMult = 2, offset = [0, 0]) {
    const game = [];
    for (let y = 0; y < squareCount[1]; y++) {
        game[y] = [];
        for (let x = 0; x < squareCount[0]; x++) {
            /* game[y][x] = (noiseAt(x, y, 0.05) + 1) / 2; */
            let curScale = startScale;
            game[y][x] = [];
            for (let i = 0; i < levels; i++) {
                game[y][x][i] = noiseAt(x, y, curScale, [
                    randomOffsets[i][0] + offset[0],
                    randomOffsets[i][1] + offset[1]
                ])
                curScale *= scaleChangeMult;
            }

        }
    }
    return game;
}
let game = makeGame();

console.log(game);



const drawGame = makeKernel(function (val, frame) {

    function lerp(start, end, amt) {
        return (1 - amt) * start + amt * end
    }

    const { x, y } = this.thread;

    if (val[y][x][0] > 0.95) {
        this.color(0.3, 0.3, 0.3);
    } else if (val[y][x][0] > 0.7) {

        let newVal = (val[y][x][0] - 0.7) / 0.1;
        this.color(0, val[y][x][0], 0);

        if (val[y][x][2] > 0.9) {
            this.color(0, val[y][x][0], 0);
        }

    } else if (val[y][x][0] <= 0.7 && val[y][x][0] > 0.5) {
        this.color(val[y][x][0], val[y][x][0], 0.3);
    } else {
        this.color(0, 0.2, 1);
    }



}, squareCount);

let frame = 0;
function redrawGame() {
    frame++;
    drawGame(game, frame);

    // copy to canvas (scaled)
    ctx.drawImage(drawGame.canvas, 0, 0, canvas.width, canvas.height);

}

redrawGame();


/* const mouseState = {
    down: false,
    x: 0,
    y: 0
}

document.addEventListener('mousedown', (e) => {
    mouseState.down = true;
});
document.addEventListener('mouseup', (e) => {
    mouseState.down = false;
});
document.addEventListener('mousemove', (e) => {
    mouseState.x = e.offsetX;
    mouseState.y = e.offsetY;
}); */

let currentScale = 0.005;
let scrollScaleMult = 1.5;

// on scroll up or down change the scale
document.addEventListener('wheel', (e) => {
    if (e.deltaY > 0) {
        currentScale *= scrollScaleMult;
    } else {
        currentScale /= scrollScaleMult;
    }
    game = makeGame(currentScale);
    redrawGame();
});

function gameLoop() {

    redrawGame();

    requestAnimationFrame(gameLoop);
}

gameLoop();