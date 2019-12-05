import * as tf from "@tensorflow/tfjs-node";

import { ActionCode, AllActions, AllTiles, ISimpleGameState } from "bomberjam-backend";
import { BOMB_MAX_COUNTDOWN, BONUSES, TILE_MAPPING } from "./constants";

import { IGeneticBot } from "./IGeneticBot";
import { NeuralNetwork } from "./neuralNetwork";
import { createMap } from "./utils";

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
      const inputs = tf.tensor4d([this.stateToModelInput(state)]);

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
    this.brain.mutate(0.1);
  }

  private stateToModelInput(state: ISimpleGameState): number[][][] {
    const currentPlayer = state.players[this.gameId];
    const otherPlayers = Object.values(state.players).filter(
      player => player.id !== this.gameId
    );

    const currentPlayerPositionMap = createMap(state.width, state.height);
    currentPlayerPositionMap[currentPlayer.x][currentPlayer.y] = 1;

    const otherPlayersPositionMap = createMap(state.width, state.height);
    for (const otherPlayer of otherPlayers) {
      otherPlayersPositionMap[otherPlayer.x][otherPlayer.y] = 1;
    }

    const blockTilesMap = createMap(state.width, state.height);
    const wallTilesMap = createMap(state.width, state.height);
    const outOfBoundTilesMap = createMap(state.width, state.height);
    const explosionTilesMap = createMap(state.width, state.height);
    const emptyTilesMap = createMap(state.width, state.height);

    for (let x = 0; x < state.width; x++) {
      for (let y = 0; y < state.height; y++) {
        const tile = TILE_MAPPING[state.tiles[x + y * state.width]];

        switch (tile) {
          case AllTiles.Block:
            blockTilesMap[x][y] = 1;
            break;
          case AllTiles.Wall:
            wallTilesMap[x][y] = 1;
            break;
          case AllTiles.OutOfBound:
            outOfBoundTilesMap[x][y] = 1;
            break;
          case AllTiles.Explosion:
            explosionTilesMap[x][y] = 1;
            break;
          case AllTiles.Empty:
            emptyTilesMap[x][y] = 1;
            break;
        }
      }
    }

    const bombPositionsMap = createMap(state.width, state.height);
    const bombRangesMap = createMap(state.width, state.height);
    const bombCountdownsMap = createMap(state.width, state.height, 1);
    for (const bomb of Object.values(state.bombs)) {
      bombPositionsMap[bomb.x][bomb.y] = 1;
      bombRangesMap[bomb.x][bomb.y] = bomb.range / Math.max(state.width, state.height);
      bombCountdownsMap[bomb.x][bomb.y] = bomb.countdown / BOMB_MAX_COUNTDOWN + 1;
    }

    const fireBonusesMap = createMap(state.width, state.height);
    const bombBonusesMap = createMap(state.width, state.height);
    for (const bonus of Object.values(state.bonuses)) {
      switch (bonus.type) {
        case BONUSES.Bomb:
          bombBonusesMap[bonus.x][bonus.y] = 1;
          break;
        case BONUSES.Fire:
          fireBonusesMap[bonus.x][bonus.y] = 1;
          break;
      }
    }

    const currentPlayerBombsLeftMap = createMap(state.width, state.height, currentPlayer.bombsLeft / currentPlayer.maxBombs);
    const currentPlayerBombRangeMap = createMap(state.width, state.height, currentPlayer.bombRange / Math.max(state.width, state.height));

    return [
      currentPlayerPositionMap,
      otherPlayersPositionMap,
      blockTilesMap,
      wallTilesMap,
      outOfBoundTilesMap,
      explosionTilesMap,
      bombPositionsMap,
      bombRangesMap,
      bombCountdownsMap,
      fireBonusesMap,
      bombBonusesMap,
      currentPlayerBombsLeftMap,
      currentPlayerBombRangeMap
    ];

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

  makeChild(id: string) {
    return new RandomBot(this.id);
  }

  mutate() {
    // I dont mutate :(
  }

  getAction(state: ISimpleGameState, myPlayerId: string): ActionCode {
    this.gameId = myPlayerId;
    return this.allActions[
      Math.floor(Math.random() * this.allActions.length)
    ] as ActionCode;
  }
}
