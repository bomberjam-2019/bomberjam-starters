const { ALL_TILES, BOARD } = require("../game-constants");
const { createMap } = require("../utils");

/*
*   Transforms a gameState into an input for your neural network given the playerId.
*   You'll need to improve this.
*/
function gameStateToModelInputConverter(state, playerId) {
    const currentPlayer = state.players[playerId];
    const otherPlayers = Object.values(state.players).filter(player => player.id !== playerId);

    const currentPlayerPositionMap = createMap(state.width, state.height);
    currentPlayerPositionMap[currentPlayer.x][currentPlayer.y] = 1;

    const otherPlayersPositionMap = createMap(state.width, state.height);
    for (const otherPlayer of otherPlayers) {
        otherPlayersPositionMap[otherPlayer.x][otherPlayer.y] = 1;
    }

    const blocksMap = createMap(state.width, state.height);
    for (let x = 0; x < state.width; x++) {
        for (let y = 0; y < state.height; y++) {
            const tile = state.tiles[x + y * state.width];
            if(tile === ALL_TILES.block) {
                blocksMap[x][y] = 1;
            }
        }
    }

    /*
    *   You can encode global state as a feature map filled with the value.
    *   This will make the convolutions see this information all the time.
    */
    const suddenDeathMap = createMap(state.width, state.height, state.suddenDeathCountdown === 0 ? 1 : 0);

    return [
        currentPlayerPositionMap,
        otherPlayersPositionMap,
        blocksMap,
        suddenDeathMap
    ];
}

/*
*   Do not forget to update this to match the dimensions that "gameStateToModelInputConverter" returns.
*   It will be used to compile your model.
*/
const NUMBER_OF_FEATURES = 4;
const DATA_SHAPE = [NUMBER_OF_FEATURES, BOARD.width, BOARD.height]

module.exports = {
    gameStateToModelInputConverter,
    DATA_SHAPE
}