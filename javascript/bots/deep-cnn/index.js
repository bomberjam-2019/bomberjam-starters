const { NeuralNetworkBot } = require("../neuralNetworkBot")
const { modelName, buildModel } = require("./model");
const { gameStateToModelInputConverter } = require("./data");

module.exports = {
    newBot: () => new NeuralNetworkBot(modelName, gameStateToModelInputConverter),
    modelName,
    buildModel,
    gameStateToModelInputConverter
}