const { Map } = require("./map");

const ALL_ACTIONS = ['up', 'down', 'left', 'right', 'stay', 'bomb'];

/**
 * @param {IGameState} state
 * @param {string} myPlayerId
 * @returns {ActionCode}
 */
function yourBot(state, myPlayerId) {
    return ALL_ACTIONS[Math.floor(Math.random() * ALL_ACTIONS.length)];
}

function dumbBot() {
    return "bomb";
}

module.exports = [yourBot, dumbBot, dumbBot, dumbBot];