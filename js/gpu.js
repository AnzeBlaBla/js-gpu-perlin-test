const gpu = new GPU({
    mode: "gpu"
});

export function makeKernel(func, outputSize, isGPU = true, functions = []) {
    console.log("outputSize", outputSize, "isGPU", isGPU, "functions", functions)
    return gpu.createKernel(func)
        .setOutput([outputSize[0], outputSize[1]])
        .setGraphical(isGPU)
        .setDynamicArguments(true)
        .setDynamicOutput(true)
        .setFunctions(functions)
}
