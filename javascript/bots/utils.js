function createMap(width, height, defaultValue = 0) {
    return (new Array(width))
        .fill(0)
        .map(_ => (new Array(height)).fill(defaultValue));
}

module.exports = {
    createMap
}