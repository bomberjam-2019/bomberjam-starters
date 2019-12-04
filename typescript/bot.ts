import * as tf from '@tensorflow/tfjs-node';

import { ActionCode, AllActions, BonusCode, ISimpleGameState } from 'bomberjam-backend';

import { IGeneticBot } from './IGeneticBot';
import { NeuralNetwork } from './neuralNetwork';

type tilesType = '*' | '#' | '+' | '*' | 'm' | 'e' | 'b' | 'f' | 'x';

export default class EvoBot implements IGeneticBot {
  private readonly allActions = Object.values(AllActions);
  brain: NeuralNetwork;
  id: string;
  gameId!: string;

  constructor(brain: NeuralNetwork, id: string = 'evoBot') {
    this.brain = brain;
    this.id = id;
  }

  dispose() {
    this.brain.dispose();
  }

  getAction(state: ISimpleGameState, myPlayerId:string): ActionCode {
    this.gameId = myPlayerId;
    let resultIndex = 0;
    tf.tidy(() => {
      const inputs = this.createInput(state);

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

  private createInput(state: ISimpleGameState) {
    let tiles = state.tiles;

    for (const bombId in state.bombs) {
      const bombPosition = this.coordToTileIndex(state.bombs[bombId].x, state.bombs[bombId].y, state.width);
      tiles = this.replaceCharAt(tiles, bombPosition, state.bombs[bombId].countdown.toString());
    }

    for (const playerId in state.players) {
      const playerPosition = this.coordToTileIndex(state.players[playerId].x, state.players[playerId].y, state.width);
      tiles = this.replaceCharAt(tiles, playerPosition, playerId === this.gameId ? 'm' : 'e');
    }

    for (const bonusId in state.bonuses) {
      const bonusPosition = this.coordToTileIndex(state.bonuses[bonusId].x, state.bonuses[bonusId].y, state.width);
      tiles = this.replaceCharAt(tiles, bonusPosition, state.bonuses[bonusId].type === ('bomb' as BonusCode) ? 'b' : 'f');
    }

    let inputs = tiles.split('').map(a => {
      return a.charCodeAt(0) / 1000;
    });
    
    inputs.push(state.tick);
    inputs.push(state.suddenDeathCountdown);
    inputs.push(state.players[this.gameId].score);

    for (const playerId in state.players) {
      if (this.gameId != playerId) {
        inputs.push(state.players[playerId].score);
      }
    }

    return tf.tensor2d([inputs]);
  }

  private coordToTileIndex(x: number, y: number, width: number): number {
    return y * width + x;
  }

  private replaceCharAt(text: string, idx: number, newChar: string): string {
    return text.substr(0, idx) + newChar + text.substr(idx + 1);
  }
}

export class RandomBot implements IGeneticBot {
  
  brain!: NeuralNetwork;

  private readonly allActions = Object.values(AllActions);
  id: string;
  gameId!: string;

  constructor(id: string) {
    this.id = id;
  }

  dispose() {
    // Got no brain :(
  }

  makeChild (id: string) {
    return new RandomBot(this.id);
  }

  mutate() {
    // I dont mutate :(
  }

  getAction(state: ISimpleGameState, myPlayerId: string): ActionCode {
    this.gameId = myPlayerId;
    return this.allActions[Math.floor(Math.random() * this.allActions.length)] as ActionCode;
  }
}
