import { IBomb, IBonus, IGameState } from "bomberjam-backend";

import { IGameResult } from "./IGameResult";
import { IPlayerResult } from "./IPlayerResult";

export default class GameResult implements IGameResult {
    totalScore: number;
    players: { [id: string]: IPlayerResult };

    constructor(gameState: IGameState) {

        this.players = {};
        this.totalScore = Object.keys(gameState.players).reduce((previous, current) => {
            return previous + gameState.players[current].score;
        }, 0);

        for (const playerId of Object.keys(gameState.players)) {
            this.players[playerId] = {
                score: gameState.players[playerId].score,
                fitness: gameState.players[playerId].score / this.totalScore
            };
        }
    }
}