const baseDangerMatrix = require("./base-danger-matrix");
const baseDangerMatrixPad = require("./base-danger-matrix-pad");
const baseBombsData = require("./base-bombs-data");
const baseBombsDataPad = require("./base-bombs-data-pad");
const baseModel = require("./base-model");

const { RandomBot } = require("./randomBot");

module.exports = {
    RandomBot,
    bot: baseModel,
    botsToCompare: [baseModel, baseModel, baseModel, baseModel]
}