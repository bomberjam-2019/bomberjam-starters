function createRangeOfCoordinates(xStart, xRange, xMin, xMax, yStart, yRange, yMin, yMax) {
    const coordinates = [];
    for (let x = Math.max(xMin, xStart - xRange); x < Math.min(xMax, xStart + xRange) + 1; x++) {
        for (let y = Math.max(yMin, yStart - yRange); y < Math.min(yMax, yStart + yRange) + 1; y++) {
            coordinates.push({ x, y });
        }
    }

    return coordinates;
}

module.exports = {
    createRangeOfCoordinates
}