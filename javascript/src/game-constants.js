const { Board, DEFAULT_BOMB_COUNTDOWN, DEFAULT_BOMB_RANGE, AllBonusCode, AllActions, AllTiles } = require("bomberjam-backend");

const ALL_TILES = Object.keys(AllTiles).reduce((acc, tileString) => {
    const camelCasedTileString = tileString.charAt(0).toLowerCase() + tileString.slice(1);
    acc[camelCasedTileString] = AllTiles[tileString];

    return acc;
}, {});

const ACTION_STRINGS = Object.values(AllActions).reduce((acc, actionString, i) => {
    acc[i] = actionString;

    return acc;
}, {});

const ACTION_NUMBERS = Object.values(AllActions).reduce((acc, actionString, i) => {
    acc[actionString] = i;

    return acc;
}, {});

const ACTION_SIZE = Object.values(AllActions).length;

const BOARD = {
    width: Board.width,
    height: Board.height
};

const BOMB_MAX_COUNTDOWN = DEFAULT_BOMB_COUNTDOWN;
const BOMB_MIN_RANGE = DEFAULT_BOMB_RANGE;

const BONUS_NUMBERS = Object.values(AllBonusCode).reduce((acc, bonusCode, i) => {
    acc[bonusCode] = i;

    return acc;
}, {});

module.exports = {
    ALL_TILES,
    ACTION_STRINGS,
    ACTION_NUMBERS,
    ACTION_SIZE,
    BOARD,
    BOMB_MAX_COUNTDOWN,
    BOMB_MIN_RANGE,
    BONUS_NUMBERS
};