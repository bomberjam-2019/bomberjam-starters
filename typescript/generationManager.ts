import * as tf from '@tensorflow/tfjs-node';

import { IGameState, IPlayer, startSimulation } from 'bomberjam-backend';

import EvoBot from './bot';
import { IGeneticBot } from './IGeneticBot';
import { NeuralNetwork } from './neuralNetwork';
import { shuffleArray } from './utils';

type botDictionnary = { [index: string]: IGeneticBot };

export default class GenerationManager {
  private numberOfGames: number;
  lastGenerationResults!: IGameState[];
  private polulationSize: number;
  private bots: botDictionnary;
  private currentGeneration: number;
  private bestScore: number = 0;
  private gameScoreSum: number = 0;
  private bestBotScoreSum: number = 0;
  private model: tf.Sequential | undefined;
  private saveLogs: boolean;

  constructor(numberOfGames: number, model?: tf.Sequential) {
    this.numberOfGames = numberOfGames;
    this.polulationSize = numberOfGames * 4;
    this.currentGeneration = 1;
    this.model = model;
    this.bots = this.createBots();
    this.saveLogs = false;
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

  async runGeneration() {
    let games: Promise<IGameState>[] = [];
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

  async simulateGameAsync(bots: IGeneticBot[], saveGamelog: boolean): Promise<IGameState> {
    return new Promise<IGameState>(resolve => {
      const simulation = startSimulation(bots, saveGamelog);
      while (simulation.currentState.suddenDeathCountdown > 0) {
        simulation.executeNextTick();
      }

      const gameResult = JSON.parse(JSON.stringify(simulation.currentState));

      for (const bot of bots) {
        gameResult.players[bot.id] = gameResult.players[bot.gameId];
        delete gameResult.players[bot.gameId];
      }

      while (!simulation.isFinished) {
        simulation.executeNextTick();
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
      {} as { [id: string]: IPlayer }
    );

    // Calculate Total score for generation
    const totalScore = Object.keys(allBots).reduce((previous, current) => {
      return previous + allBots[current].score;
    }, 0);

    // Sort best bot to suckiest bot
    const sortedIds = Object.keys(allBots).sort((a, b) =>
      allBots[a].score > allBots[b].score ? -1 : allBots[a].score < allBots[b].score ? 1 : 0
    );

    //Remove suckiest bots
    const idsToRemove = sortedIds.slice(this.numberOfGames * 2);
    idsToRemove.forEach(id => {
      this.bots[id].dispose();
      delete this.bots[id];
    });

    //Make babies and mutate
    var childIndex = 1;
    for (const botId in this.bots) {
      const childBot = this.bots[botId].makeChild(this.generateBotName(childIndex));
      childBot.mutate();
      this.bots[childBot.id] = childBot;
      childIndex++;
    }

    // Save models
    if (this.bestScore < allBots[sortedIds[0]].score) {
      console.log(`Saving new best bot with score: ${allBots[sortedIds[0]].score}`);
      this.bestScore = allBots[sortedIds[0]].score;
      await this.bots[sortedIds[0]].brain.model.save('file://./best-bot');
    }

    await this.bots[sortedIds[0]].brain.model.save('file://./last-bot');

    // Print stats
    this.gameScoreSum += totalScore;
    let gameScoreAverage = Math.round(this.gameScoreSum / (this.currentGeneration - 1));
    let gameScoreDiff = (((totalScore - gameScoreAverage) / ((gameScoreAverage + totalScore) / 2)) * 100).toFixed(2);

    this.bestBotScoreSum += allBots[sortedIds[0]].score;
    let bestBotAverage = Math.round(this.bestBotScoreSum / (this.currentGeneration - 1));
    let bestBotScoreDiff = (((allBots[sortedIds[0]].score - bestBotAverage) / ((bestBotAverage + allBots[sortedIds[0]].score) / 2)) * 100).toFixed(2);

    console.log(
      `${this.currentGeneration - 1} | ${totalScore} | ${gameScoreAverage} | ${gameScoreDiff}% | ${
      allBots[sortedIds[0]].score
      } | ${bestBotAverage} | ${bestBotScoreDiff}%`
    );

  }
}
