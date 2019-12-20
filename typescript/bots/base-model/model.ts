import * as tf from '@tensorflow/tfjs-node';

import { ACTION_SIZE } from '../game-constants';
import { DATA_SHAPE } from './data';

export function buildModel() {
    const model = tf.sequential();

    // Convolutions
    model.add(tf.layers.conv2d({ inputShape: DATA_SHAPE, dataFormat: "channelsFirst", filters: 32, kernelSize: 3, activation: "relu" }));
    /*
    *   Dropout is a special layer used in training to fight overfitting.
    *   It neutralizes weights randomly to force the network to be redundant.
    *   It is automatically disabled outside of training.
    */
    model.add(tf.layers.dropout({ rate: 0.15 }));

    model.add(tf.layers.maxPooling2d({ dataFormat: "channelsFirst", poolSize: 2, strides: 2, padding: "valid" }))

    model.add(tf.layers.conv2d({ dataFormat: "channelsFirst", filters: 128, kernelSize: 3, activation: "relu" }));
    model.add(tf.layers.dropout({ rate: 0.15 }));

    // Classification
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 128, activation: "relu" }));
    model.add(tf.layers.dense({ units: 64, activation: "relu" }));

    model.add(tf.layers.dense({ units: ACTION_SIZE, activation: "softmax" }));

    /*
    *   If you do not know what this is, you don't need to change it or know what it does.
    *   It's going to be pretty good for this kind of machine learning.
    */
    model.compile({
        optimizer: "adam",
        loss: "categoricalCrossentropy",
        metrics: ["accuracy"]
    });

    return model;
}