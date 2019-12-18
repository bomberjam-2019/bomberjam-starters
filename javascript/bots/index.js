const baseDangerMatrix = require("./base-danger-matrix");
const baseDangerMatrixPad = require("./base-danger-matrix-pad");
const baseBombsData = require("./base-bombs-data");
const baseBombsDataPad = require("./base-bombs-data-pad");

const { RandomBot } = require("./randomBot");

module.exports = {
    RandomBot,
    bot: baseBombsData,
    baseDangerMatrix,
    baseDangerMatrixPad,
    baseBombsData,
    baseBombsDataPad
}