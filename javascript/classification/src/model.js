const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");

const { BOARD, ACTION_SIZE } = require("./game-constants");

// Model
const INPUT_SIZE = 1 + BOARD.width * BOARD.height;
const HIDDEN_LAYER_NB_NEURONS = 43;
const OUTPUT_SIZE = ACTION_SIZE;

function make() {
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [INPUT_SIZE], units: HIDDEN_LAYER_NB_NEURONS, activation: "relu" }));
    model.add(tf.layers.dense({ units: OUTPUT_SIZE, activation: "softmax" }));
    model.compile({
        optimizer: "sgd",
        loss: "categoricalCrossentropy",
        metrics: ["accuracy"]
    });

    return model;
}

module.exports = {
    make
};