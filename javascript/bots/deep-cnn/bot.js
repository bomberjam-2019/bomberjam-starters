const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");

const { modelName } = require("./model");
const { gameStateToModelInputConverter } = require("./data");
const { ACTION_STRINGS } = require("../../src/game-constants");

class DeepCNNBot {
    constructor(modelName) {
        this.model = null;
        this.modelName = modelName;
    }

    /*
    *   Load your model from the disk based on the modelName.
    *   You don't need to change this unless you want to save / load to another folder.
    */
    async init() {
        this.model = await tf.loadLayersModel(`file://./trained-models/${this.modelName}/model.json`);
    }

    /*
    *   Given a state and a player id, use your model to predict what the next action should be.
    *   The code given below is pretty standard and should meet your needs.
    */
    getAction(state, myPlayerId) {
        const input = tf.tensor4d([gameStateToModelInputConverter(state, myPlayerId)]);
        const predictionTensor = this.model.predict(input);

        const prediction = tf.argMax(predictionTensor, 1).dataSync()[0];
        input.dispose();
        predictionTensor.dispose();

        const action = ACTION_STRINGS[prediction];

        return action;
    }
}

module.exports = {
    newBot: () => new DeepCNNBot(modelName)
}