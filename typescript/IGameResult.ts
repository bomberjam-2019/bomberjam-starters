import { IGameState } from "bomberjam-backend";
import { IPlayerResult } from "./IPlayerResult";

export interface IGameResult {
    totalScore: number,
    players: {
        [id: string]: IPlayerResult;
    };
}