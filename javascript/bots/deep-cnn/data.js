const { TILE_NAMES, TILE_MAPPING, BOMB_MAX_COUNTDOWN, BONUSES, BOARD } = require("../../src/game-constants");
const { createMap, padMatrix } = require("../../src/utils");

/*
*   Do not forget to update this to match the dimensions that "gameStateToModelInputConverter" returns.
*   It will be used to compile your model.
*/
const NUMBER_OF_FEATURES = 11;
const DATA_SHAPE = [NUMBER_OF_FEATURES, BOARD.width + 2, BOARD.height + 2]

/*
*   Transforms a gameState into an input for your neural network given the playerId.
*   Do not create tensors here, simply return arrays.
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

    const breakableTilesMap = createMap(state.width, state.height);
    const blockedTilesMap = createMap(state.width, state.height);
    for (let x = 0; x < state.width; x++) {
        for (let y = 0; y < state.height; y++) {
            const tile = TILE_MAPPING[state.tiles[x + y * state.width]];
            if(tile === TILE_NAMES.breakable) {
                breakableTilesMap[x][y] = 1;
            }

            if(tile === TILE_NAMES.blocked) {
                blockedTilesMap[x][y] = 1;
            }
        }
    }

    const bombPositionsMap = createMap(state.width, state.height);
    const bombRangesMap = createMap(state.width, state.height);
    const bombCountdownsMap = createMap(state.width, state.height);
    for (const bomb of Object.values(state.bombs)) {
        blockedTilesMap[bomb.x][bomb.y] = 1;
        bombPositionsMap[bomb.x][bomb.y] = 1;
        bombRangesMap[bomb.x][bomb.y] = bomb.range / Math.max(state.width, state.height);
        bombCountdownsMap[bomb.x][bomb.y] = (BOMB_MAX_COUNTDOWN - bomb.countdown) / BOMB_MAX_COUNTDOWN;
    }

    const bonusesMap = createMap(state.width, state.height);
    for (const bonus of Object.values(state.bonuses)) {
        bonusesMap[bonus.x][bonus.y] = BONUSES[bonus.type];
    }

    const currentPlayerBombsLeftMap = createMap(state.width, state.height, currentPlayer.bombsLeft / currentPlayer.maxBombs);
    const currentPlayerBombRangeMap = createMap(state.width, state.height, currentPlayer.bombRange / Math.max(state.width, state.height));
    const suddenDeathMap = createMap(state.width, state.height, state.suddenDeathCountdown === 0 ? 1 : 0);

    return [
        padMatrix(currentPlayerPositionMap, 1, 0),
        padMatrix(otherPlayersPositionMap, 1, 0),
        padMatrix(breakableTilesMap, 1, 0),
        padMatrix(blockedTilesMap, 1, 1),
        padMatrix(bombPositionsMap, 1, 0),
        padMatrix(bombRangesMap, 1, 0),
        padMatrix(bombCountdownsMap, 1, 0),
        padMatrix(bonusesMap, 1, 0),
        padMatrix(currentPlayerBombsLeftMap, 1, suddenDeathMap[0][0]),
        padMatrix(currentPlayerBombRangeMap, 1, suddenDeathMap[0][0]),
        padMatrix(suddenDeathMap, 1, suddenDeathMap[0][0])
    ];
}

module.exports = {
    gameStateToModelInputConverter,
    DATA_SHAPE
}