const { ALL_ACTIONS } = require("./src/game-constants"); 

function classifierBot(state, myPlayerId) {
    return ALL_ACTIONS[Math.floor(Math.random() * ALL_ACTIONS.length)];
}

module.exports = {
    classifierBot
}