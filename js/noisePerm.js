function buildPermutationTable() {
    const p = [];
    for (let i = 0; i < 256; i++) {
        p[i] = i;
    }
    for (let i = 0; i < 255; i++) {
        const r = i + ~~(Math.random() * (256 - i));
        const aux = p[i];
        p[i] = p[r];
        p[r] = aux;
    }
    return p;
}

let p = buildPermutationTable();
let perm = [];
let permMod12 = [];
for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    permMod12[i] = perm[i] % 12;
}

const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

const grad3 = [1, 1, 0,
    -1, 1, 0,
    1, -1, 0,

    -1, -1, 0,
    1, 0, 1,
    -1, 0, 1,

    1, 0, -1,
    -1, 0, -1,
    0, 1, 1,

    0, -1, 1,
    0, 1, -1,
    0, -1, -1];

export {
    perm,
    permMod12,
    grad3,
    F2,
    G2,
}