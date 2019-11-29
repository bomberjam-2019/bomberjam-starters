const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");

const { ACTION_SIZE } = require("./game-constants");
const { DATA_SHAPE } = require("./data");

function make() {
    const model = tf.sequential();

    // Convolutions
    model.add(tf.layers.conv2d({ inputShape: DATA_SHAPE, dataFormat: "channelsFirst", filters: 32, kernelSize: 2, activation: "relu" }));
    model.add(tf.layers.dropout({ rate : 0.15 }));
    model.add(tf.layers.conv2d({ filters: 32, kernelSize: 2, activation: "relu" }));
    model.add(tf.layers.dropout({ rate : 0.15 }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    
    model.add(tf.layers.conv2d({ filters: 64, kernelSize: 2, activation: "relu" }));
    model.add(tf.layers.dropout({ rate : 0.15 }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    // Classification
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    model.add(tf.layers.dense({ units: ACTION_SIZE, activation: "softmax" }));

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