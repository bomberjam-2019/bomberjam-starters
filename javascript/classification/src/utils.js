// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
function shuffleInPlace(array) {
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

module.exports = {
    shuffleInPlace,
    oneHotVector
};