function randomSeedParkMiller(seed = 123456) {
    seed = seed % 2147483647
    return () => {
        seed = seed * 16807 % 2147483647
        return (seed - 1) / 2147483646
    }
}

const seed = 3453456456;

const random = randomSeedParkMiller(seed);

function buildPermutationTable() {
    const p = [];
    for (let i = 0; i < 256; i++) {
        p[i] = i;
    }
    for (let i = 0; i < 255; i++) {
        const r = i + ~~(random() * (256 - i));
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


export default function attach(kernel) {
    kernel.addFunction(function simplexNoise(_x, _y) {

        // Workaround to avoid negative number repetition
        const x = _x + 10 ** 3;
        const y = _y + 10 ** 3;

        let n0 = 0; // Noise contributions from the three corners
        let n1 = 0;
        let n2 = 0;
        // Skew the input space to determine which simplex cell we're in
        const s = (x + y) * this.constants.F2; // Hairy factor for 2D
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        const t = (i + j) * this.constants.G2;
        const X0 = i - t; // Unskew the cell origin back to (x,y) space
        const Y0 = j - t;
        const x0 = x - X0; // The x,y distances from the cell origin
        const y0 = y - Y0;
        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        let i1 = 0;
        let j1 = 0; // Offsets for second (middle) corner of simplex in (i,j) coords
        if (x0 > y0) {
            i1 = 1;
            j1 = 0;
        } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        else {
            i1 = 0;
            j1 = 1;
        } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6
        const x1 = x0 - i1 + this.constants.G2; // Offsets for middle corner in (x,y) unskewed coords
        const y1 = y0 - j1 + this.constants.G2;
        const x2 = x0 - 1.0 + 2.0 * this.constants.G2; // Offsets for last corner in (x,y) unskewed coords
        const y2 = y0 - 1.0 + 2.0 * this.constants.G2;
        // Work out the hashed gradient indices of the three simplex corners
        const ii = i & 255;
        const jj = j & 255;
        // Calculate the contribution from the three corners
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 >= 0) {
            const gi0 = this.constants.permMod12[ii + this.constants.perm[jj]] * 3;
            t0 *= t0;
            n0 = t0 * t0 * (this.constants.grad3[gi0] * x0 + this.constants.grad3[gi0 + 1] * y0); // (x,y) of grad3 used for 2D gradient
        }
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 >= 0) {
            const gi1 = this.constants.permMod12[ii + i1 + this.constants.perm[jj + j1]] * 3;
            t1 *= t1;
            n1 = t1 * t1 * (this.constants.grad3[gi1] * x1 + this.constants.grad3[gi1 + 1] * y1);
        }
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 >= 0) {
            const gi2 = this.constants.permMod12[ii + 1 + this.constants.perm[jj + 1]] * 3;
            t2 *= t2;
            n2 = t2 * t2 * (this.constants.grad3[gi2] * x2 + this.constants.grad3[gi2 + 1] * y2);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [0,1].
        return ((70.0 * (n0 + n1 + n2)) + 1) / 2;

    }, {
        argumentTypes: {
            x: "Number",
            y: "Number"
        },
        returnType: "Number"
    });

    kernel.addFunction(function lerp(a, b, t) {
        return a + t * (b - a);
    }, {
        argumentTypes: {
            a: "Number",
            b: "Number",
            t: "Number"
        },
        returnType: "Number"
    });

    kernel.addFunction(function dist(x_one, y1, x2, y2) {
        var xd = x_one - x2
        var yd = y1 - y2
        return Math.sqrt(xd * xd + yd * yd)
    });

    kernel.setConstants({
        perm,
        permMod12,
        grad3,
        F2,
        G2
    })

    kernel.setTactic("precision")
}
