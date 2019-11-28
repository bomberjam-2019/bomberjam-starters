const { ALL_ACTIONS } = require("../classification/src/game-constants");

class RandomBot {
    getAction(state, myPlayerId) {
        const actionStrings = Object.keys(ALL_ACTIONS);
        const action = actionStrings[Math.floor(Math.random() * actionStrings.length)]
        // console.log(actionStrings, action);

        return action;
    }
}

module.exports = {
    RandomBot
}