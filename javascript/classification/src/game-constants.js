const TILE_NAMES = {
    empty: "empty",
    blocked: "blocked",
    breakable: "breakable",
    explosion: "explosion"
};

const TILE_MAPPING = {
    ".": TILE_NAMES.empty,
    "#": TILE_NAMES.blocked,
    "+": TILE_NAMES.breakable,
    "*": TILE_NAMES.explosion
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

const BOMB_MAX_COUNTDOWN = 8;

const BONUSES = {
    "bomb": 1,
    "fire": 2
}

module.exports = {
    TILE_NAMES,
    TILE_MAPPING,
    ALL_ACTIONS,
    ACTION_SIZE,
    BOARD,
    BOMB_MAX_COUNTDOWN,
    BONUSES
};