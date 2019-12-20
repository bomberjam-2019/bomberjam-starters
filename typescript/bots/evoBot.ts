import * as tf from "@tensorflow/tfjs-node";

import { ActionCode, AllActions, ISimpleGameState } from "bomberjam-backend";

import { IGeneticBot } from "./IGeneticBot";
import { NeuralNetwork } from "./neuralNetwork";
import { gameStateToModelInputConverter } from "./base-model/data";

export default class EvoBot implements IGeneticBot {
  private readonly allActions = Object.values(AllActions);
  brain: NeuralNetwork;
  id: string;
  gameId!: string;

  constructor(brain: NeuralNetwork, id: string = "evoBot") {
    this.brain = brain;
    this.id = id;
  }

  dispose() {
    this.brain.dispose();
  }

  getAction(state: ISimpleGameState, myPlayerId: string): ActionCode {
    this.gameId = myPlayerId;
    let resultIndex = 0;
    tf.tidy(() => {
      const inputs = tf.tensor4d([gameStateToModelInputConverter(state, myPlayerId)]);

      const outputs = this.brain.model.predict(inputs) as tf.Tensor;

      const resultArray = outputs.dataSync();
      resultIndex = resultArray.indexOf(Math.max(...resultArray));
    });
    return this.allActions[resultIndex] as ActionCode;
  }

  makeChild(id: string): EvoBot {
    const childBrain = this.brain.copy();
    return new EvoBot(childBrain, id);
  }

  mutate() {
    this.brain.mutate(0.01);
  }
}