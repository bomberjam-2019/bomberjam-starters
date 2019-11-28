const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");

const { BOARD, ACTION_SIZE } = require("./game-constants");
const NUMBER_OF_CHANNELS = 10;

const INPUT_SHAPE = [NUMBER_OF_CHANNELS, BOARD.width, BOARD.height];
const OUTPUT_SIZE = ACTION_SIZE;

function make() {
    const model = tf.sequential();

    // Convolutions
    model.add(tf.layers.conv2d({ inputShape: INPUT_SHAPE, dataFormat: "channelsFirst", filters: 32, kernelSize: 2, activation: "relu" }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    model.add(tf.layers.conv2d({ filters: 64, kernelSize: 2, activation: "relu" }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    model.add(tf.layers.conv2d({ filters: 64, kernelSize: 2, activation: "relu" }));

    // Classification
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 64, activation: "relu" }));
    model.add(tf.layers.dense({ units: OUTPUT_SIZE, activation: "softmax" }));

    model.compile({
        optimizer: "adam",
        loss: "categoricalCrossentropy",
        metrics: ["accuracy"]
    });

    return model;
}

module.exports = {
    make
};