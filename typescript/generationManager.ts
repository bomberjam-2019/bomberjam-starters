import * as tf from '@tensorflow/tfjs-node';

import EvoBot from './bots/EvoBot';
import GameResult from './gameResult';
import { IGameResult } from './IGameResult';
import { IGeneticBot } from './bots/IGeneticBot';
import { IPlayerResult } from './IPlayerResult';
import { NeuralNetwork } from './bots/neuralNetwork';
import { shuffleArray } from './utils';
import { startSimulation } from 'bomberjam-backend';

type botDictionnary = { [index: string]: IGeneticBot };

export default class GenerationManager {
  private numberOfGames: number;
  lastGenerationResults!: IGameResult[];
  private polulationSize: number;
  private bots: botDictionnary;
  private currentGeneration: number;
  private bestScore: number = 0;
  private model: tf.Sequential | undefined;
  private saveLogs: boolean;

  constructor(numberOfGames: number, model?: tf.Sequential, saveLogs?: boolean) {
    this.numberOfGames = numberOfGames;
    this.polulationSize = numberOfGames * 4;
    this.currentGeneration = 1;
    this.model = model;
    this.bots = this.createBots();
    this.saveLogs = saveLogs || false;
  }

  private generateBotName(index: number): string {
    return `evo-gen${this.currentGeneration}-${index}`;
  }

  private createBots(): botDictionnary {
    let bots: botDictionnary = {};

    for (var i = 0; i < this.polulationSize; i++) {
      const brain = new NeuralNetwork(this.model);
      const bot = new EvoBot(brain.copy(), this.generateBotName(i));
      bots[bot.id] = bot;
    }
    return bots;
  }

  private RouletteSelection(allBots: { [id: string]: IPlayerResult }, sortedIds: string[]): IGeneticBot {
    let seed = Math.random();

    for (const botId of sortedIds) {
      if (seed <= allBots[botId].fitness) {
        return this.bots[botId];
      }
      seed -= allBots[botId].fitness;
    }

    return this.bots[sortedIds[0]];
  }

  async runGeneration() {
    let games: Promise<IGameResult>[] = [];
    let botsId = Object.keys(this.bots);
    shuffleArray(botsId);
    for (var _i = 0; _i < this.numberOfGames; _i++) {
      games.push(this.simulateGameAsync([
        this.bots[botsId.pop() as string],
        this.bots[botsId.pop() as string],
        this.bots[botsId.pop() as string],
        this.bots[botsId.pop() as string]
      ], this.saveLogs));
    }

    const allGames = Promise.all(games);
    this.lastGenerationResults = await allGames;
  }

  async simulateGameAsync(bots: IGeneticBot[], saveGamelog: boolean): Promise<IGameResult> {
    return new Promise<IGameResult>(resolve => {
      const simulation = startSimulation(bots, saveGamelog);

      while (!simulation.isFinished) {
        simulation.executeNextTick();
      }

      const gameResult = new GameResult(simulation.currentState);

      for (const bot of bots) {
        gameResult.players[bot.id] = gameResult.players[bot.gameId];
        delete gameResult.players[bot.gameId];
      }

      resolve(gameResult);
    });
  }

  async nextGeneration() {

    this.currentGeneration++;

    // Merge all bots results
    let allBots = this.lastGenerationResults.reduce(
      (previous, current) => {
        return Object.assign(previous, current.players);
      },
      {} as { [id: string]: IPlayerResult }
    );

    // Normalize fitness
    const fitnessSum = Object.keys(allBots).reduce((acc, cur) => acc + allBots[cur].fitness, 0);
    Object.keys(allBots).forEach(id => {
      allBots[id].fitness = allBots[id].fitness / fitnessSum;
    });

    // Sort by fitness
    const sortedIds = Object.keys(allBots).sort((a, b) =>
      allBots[a].fitness > allBots[b].fitness ? -1 : allBots[a].fitness < allBots[b].fitness ? 1 : 0
    );

    // Save best model
    if (this.bestScore < allBots[sortedIds[0]].score) {
      console.log(`Saving new best bot with score: ${allBots[sortedIds[0]].score}`);
      this.bestScore = allBots[sortedIds[0]].score;
      await this.bots[sortedIds[0]].brain.model.save('file://./saved-models/base-model-best');
    }

    // Save current best model
    await this.bots[sortedIds[0]].brain.model.save('file://./saved-models/base-model');

    // Select
    for (let i = 0; i < this.polulationSize; i++) {
      const selectedBot = this.RouletteSelection(allBots, sortedIds);
      const childBot = selectedBot.makeChild(this.generateBotName(i));
      childBot.mutate();
      this.bots[childBot.id] = childBot;
    }

    //Remove current generation bots
    sortedIds.forEach(id => {
      this.bots[id].dispose();
      delete this.bots[id];
    });

    // Print stats
    console.log(`Generation ${this.currentGeneration}`);
    console.table(allBots);
  }
}
