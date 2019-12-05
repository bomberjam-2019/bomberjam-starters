import * as tf from '@tensorflow/tfjs-node';

import { BOARD, MODEL_NUMBER_OF_FEATURES } from './constants';

import { AllActions } from 'bomberjam-backend';
import { gaussianRand } from './utils';

export class NeuralNetwork {
  private inputNodes: number;
  private hiddenNodes: number;
  private outputNodes: number;
  model: tf.Sequential;

  constructor(inputNodes: number, hiddenNodes: number, outputNodes: number, model?: tf.Sequential) {
    this.inputNodes = inputNodes;
    this.hiddenNodes = hiddenNodes;
    this.outputNodes = outputNodes;

    if (model) {
      this.model = model;
    } else {
      this.model = this.createModel();
    }
  }

  dispose() {
    this.model.dispose();
  }

  copy(): NeuralNetwork {
    const modelCopy = this.createModel();
    const weights = this.model.getWeights();
    const weightCopies = [];
    for (let i = 0; i < weights.length; i++) {
      weightCopies[i] = weights[i].clone();
    }
    modelCopy.setWeights(weightCopies);
    return new NeuralNetwork(this.inputNodes, this.hiddenNodes, this.outputNodes, modelCopy);
  }

  mutate(rate: number) {
    tf.tidy(() => {
      const weights = this.model.getWeights();
      const mutatedWeights = [];
      for (let i = 0; i < weights.length; i++) {
        let tensor = weights[i];
        let shape = weights[i].shape;
        let values = tensor.dataSync().slice();
        for (let j = 0; j < values.length; j++) {
          if (Math.random() < rate) {
            let w = values[j];
            values[j] = w + gaussianRand();
          }
        }
        let newTensor = tf.tensor(values, shape);
        mutatedWeights[i] = newTensor;
      }
      this.model.setWeights(mutatedWeights);
    });
  }

  createModel(): tf.Sequential {
    const model = tf.sequential();
    const actionSize = Object.values(AllActions).length;

    // Convolutions
    model.add(tf.layers.conv2d({ inputShape: [MODEL_NUMBER_OF_FEATURES, BOARD.width, BOARD.height], dataFormat: "channelsFirst", filters: 32, kernelSize: 3, activation: "relu" }));
    model.add(tf.layers.dropout({ rate: 0.15 }));

    model.add(tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: "relu" }));
    model.add(tf.layers.dropout({ rate: 0.15 }));

    model.add(tf.layers.conv2d({ filters: 128, kernelSize: 3, activation: "relu" }));
    model.add(tf.layers.dropout({ rate: 0.15 }));

    // Classification
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 64, activation: "relu" }));
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    model.add(tf.layers.dense({ units: actionSize, activation: "softmax" }));

    model.compile({
      optimizer: "adam",
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"]
    });

    return model;
  }
}
