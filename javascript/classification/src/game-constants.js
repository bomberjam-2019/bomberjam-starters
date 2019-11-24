const TILES = {
    ".": 0,
    "#": 1,
    "+": 2,
    "*": 3
};

const ALL_ACTIONS = {
    "up": 0,
    "down": 1,
    "left": 2,
    "right": 3,
    "stay": 4,
    "bomb": 5
};

const ACTION_SIZE = Object.values(ALL_ACTIONS).length;

const BOARD = {
    width: 13,
    height: 11
}

module.exports = {
    TILES,
    ALL_ACTIONS,
    ACTION_SIZE,
    BOARD
};