const { Map } = require("./map");

const ALL_ACTIONS = ['up', 'down', 'left', 'right', 'stay', 'bomb'];

/**
 * @param {IGameState} state
 * @param {string} myPlayerId
 * @returns {ActionCode}
 */
function yourBot(state, myPlayerId) {
    const map = new Map(state);
    console.log("Tick", state.tick);
    map.print(tile => 
        tile.player && tile.bomb ? "X" :
        tile.player && tile.player.respawning ? "R" :
        tile.player ? "P" :
        tile.bomb ? "B" :
        tile.safeTicks
    );

    return ALL_ACTIONS[Math.floor(Math.random() * ALL_ACTIONS.length)];
}

function dumbBot() {
    return "bomb";
}

module.exports = [yourBot, dumbBot, dumbBot, dumbBot];