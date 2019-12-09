// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
function shuffle(array) {
    var j, x, i;
    for (i = array.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = array[i];
        array[i] = array[j];
        array[j] = x;
    }

    return array;
}

function oneHotVector(size, highBit) {
    const vector = (new Array(size)).fill(0);
    vector[highBit] = 1;

    return vector;
}

function createMap(width, height, defaultValue = 0) {
    return (new Array(width))
        .fill(0)
        .map(_ => (new Array(height)).fill(defaultValue));
}

function argmax(array) {
    return array
        .map((value, index) => ({ value, index }))
        .reduce((max, current) => current.value > max.value ? current : max)
        .index;
}

function padMap(matrix, padSize, padValue) {
    const paddedMatrix = [];
    for (let i = 0; i < padSize; i++) {
        const padding = (new Array(matrix[0].length + 2 * padSize).fill(padValue));
        paddedMatrix.push(padding)
    }

    for (const row of matrix) {
        const padding = (new Array(padSize).fill(padValue));
        paddedMatrix.push([...padding, ...row, ...padding]);
    }

    for (let i = 0; i < padSize; i++) {
        const padding = (new Array(matrix[0].length + 2 * padSize).fill(padValue));
        paddedMatrix.push(padding)
    }

    return paddedMatrix;
}

module.exports = {
    shuffle,
    oneHotVector,
    createMap,
    argmax,
    padMap
};