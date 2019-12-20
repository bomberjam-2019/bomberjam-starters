import * as tf from '@tensorflow/tfjs-node';

import { buildModel } from './base-model/model';
import { gaussianRand } from '../utils';

export class NeuralNetwork {
  model: tf.Sequential;

  constructor(model?: tf.Sequential) {

    if (model) {
      this.model = model;
    } else {
      this.model = buildModel();
    }
  }

  dispose() {
    this.model.dispose();
  }

  copy(): NeuralNetwork {
    const modelCopy = buildModel();
    tf.tidy(() => {
      const weights = this.model.getWeights();
      const weightCopies = [];
      for (let i = 0; i < weights.length; i++) {
        weightCopies[i] = weights[i].clone();
      }
      modelCopy.setWeights(weightCopies);
    });
    return new NeuralNetwork(modelCopy);
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
}
