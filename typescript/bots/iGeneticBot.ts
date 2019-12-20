import { ActionCode, IBot, IGameState } from "bomberjam-backend";

import { NeuralNetwork } from "./neuralNetwork";

export interface IGeneticBot extends IBot {
    dispose: () => void;
    getAction: (state: IGameState, myPlayerId: string) => ActionCode;
    mutate: () => void;
    makeChild: (id: string) => IGeneticBot;
    id: string;
    gameId: string;
    brain: NeuralNetwork;
    
}