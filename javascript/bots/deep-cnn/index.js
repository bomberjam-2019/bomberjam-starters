const { newBot } = require("./bot");
const { modelName, buildModel } = require("./model");
const { gameStateToModelInputConverter } = require("./data");

module.exports = {
    newBot,
    modelName,
    buildModel,
    gameStateToModelInputConverter
}