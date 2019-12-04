import { ActionCode, AllActions, IBot, IGameState, playInBrowser } from 'bomberjam-backend';

class RandomBot implements IBot {
  getAction(state: IGameState, myPlayerId: string) {
    return Object.keys(AllActions)[Math.floor(Math.random() * Object.keys(AllActions).length)] as ActionCode;
  }
}

const bots = [new RandomBot(), new RandomBot(), new RandomBot(), new RandomBot()];

playInBrowser(bots).catch(console.log);
