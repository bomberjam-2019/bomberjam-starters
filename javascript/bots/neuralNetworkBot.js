const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");

const { ACTION_STRINGS } = require("./game-constants");

/*
*   You can make your own bot class if you have special needs.
*   Otherwise I suggest you use NeuralNetworkBot.
*/
class NeuralNetworkBot {
    constructor(modelName, gameStateToModelInputConverter) {
        this.model = null;
        this.modelName = modelName;
        this.gameStateToModelInputConverter = gameStateToModelInputConverter;
    }

    /*
    *   Load your model from the disk based on the modelName.
    *   You don't need to change this unless you want to save / load to another folder.
    */
    async init() {
        this.model = await tf.loadLayersModel(`file://./saved-models/${this.modelName}/model.json`);
    }

    /*
    *   Given a state and a player id, use the model to predict what the next action should be.
    *   It uses the provided gameStateToModelInputConverter.
    *   The code given below is pretty standard and should meet your needs.
    */
    getAction(gameState, myPlayerId) {
        const inputTensor = tf.tensor4d([this.gameStateToModelInputConverter(gameState, myPlayerId)]);
        const predictionTensor = this.model.predict(inputTensor);

        const prediction = tf.argMax(predictionTensor, 1).dataSync()[0];
        const action = ACTION_STRINGS[prediction];

        inputTensor.dispose();
        predictionTensor.dispose();

        return action;
    }
}

module.exports = {
    NeuralNetworkBot
}