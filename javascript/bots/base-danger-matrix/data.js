const { ALL_TILES, BOMB_MAX_COUNTDOWN, BONUS_NUMBERS, BOARD } = require("../game-constants");
const { createMap } = require("../utils");

/*
*   Do not forget to update this to match the dimensions that "gameStateToModelInputConverter" returns.
*   It will be used to compile your model.
*/
const NUMBER_OF_FEATURES = 10;
const DATA_SHAPE = [NUMBER_OF_FEATURES, BOARD.width, BOARD.height]

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
            const tile = state.tiles[x + y * state.width];
            if(tile === ALL_TILES.block) {
                breakableTilesMap[x][y] = 1;
            }

            if(tile === ALL_TILES.wall) {
                blockedTilesMap[x][y] = 1;
            }
        }
    }

    const bombPositionsMap = createMap(state.width, state.height);
    for (const bomb of Object.values(state.bombs)) {
        bombPositionsMap[bomb.x][bomb.y] = 1;
    }

    const bonusesMap = createMap(state.width, state.height);
    for (const bonus of Object.values(state.bonuses)) {
        bonusesMap[bonus.x][bonus.y] = BONUS_NUMBERS[bonus.type];
    }

    const dangerMap = buildDangerMap(state);
    const currentPlayerBombsLeftMap = createMap(state.width, state.height, currentPlayer.bombsLeft / currentPlayer.maxBombs);
    const currentPlayerBombRangeMap = createMap(state.width, state.height, currentPlayer.bombRange / Math.max(state.width, state.height));
    const suddenDeathMap = createMap(state.width, state.height, state.suddenDeathCountdown === 0 ? 1 : 0);

    return [
        currentPlayerPositionMap,
        otherPlayersPositionMap,
        breakableTilesMap,
        blockedTilesMap,
        bombPositionsMap,
        bonusesMap,
        dangerMap,
        currentPlayerBombsLeftMap,
        currentPlayerBombRangeMap,
        suddenDeathMap
    ];
}

function buildDangerMap(state) {
    const { bombs, tiles, width, height } = state;
    const dangerMap = createMap(width, height);
    const sortedBombs = Object.values(bombs).sort(by.increasing("countdown"));
    
    for (const bomb of sortedBombs) {
        const dangerLevel = Math.max(dangerMap[bomb.x][bomb.y], getDangerLevel(bomb.countdown));
        const range = bomb.range;
        dangerMap[bomb.x][bomb.y] = dangerLevel;
        for (let i = 1; i <= range; i++) {
            for (const directionOperator of directionOperators) {
                const x = getValueWithinRange(0, width - 1, directionOperator.x(bomb.x, i));
                const y = getValueWithinRange(0, height - 1, directionOperator.y(bomb.y, i));
                const tile = tiles[x + y * width];
                if (tile === ALL_TILES.wall || tile == ALL_TILES.block) {
                    break;
                }

                dangerMap[x][y] = Math.max(dangerMap[x][y], dangerLevel);
            }
        }
    }

    return dangerMap;
}

const by = {
    decreasing: (property) => sort(property, true),
    increasing: (property) => sort(property, false),
};

const sort = (property, decreasing) => (a, b) => {
    if (a[property] < b[property]) {
        return decreasing ? 1 : -1;
    }

    if (a[property] > b[property]) {
        return decreasing ? -1 : 1;
    }

    return 0;
}


// 1 when bomb with 1 countdown
// 0.125 when bomb with 8 countdown
// 0 when no bomb
const getDangerLevel = bombCountdown => (BOMB_MAX_COUNTDOWN + 1 - bombCountdown) / BOMB_MAX_COUNTDOWN;

const directionOperators = [
    { x: (x, i) => x + i, y: (y, i) => y },
    { x: (x, i) => x - i, y: (y, i) => y },
    { x: (x, i) => x,     y: (y, i) => y + i },
    { x: (x, i) => x,     y: (y, i) => y - i },
];

const getValueWithinRange = (min, max, value) => Math.max(min, Math.min(max, value));

module.exports = {
    gameStateToModelInputConverter,
    DATA_SHAPE
};