import { AllActions, AllTiles, BonusCode, TileCode } from "bomberjam-backend";

export const TILE_MAPPING: { [key: string]: TileCode } = {
    ".": AllTiles.Empty,
    "#": AllTiles.Wall,
    "+": AllTiles.Block,
    "*": AllTiles.Explosion
};

export const BOMB_MAX_COUNTDOWN: number = 8;

interface IBonusCode {
    Bomb: BonusCode;
    Fire: BonusCode;
}

export const BONUSES: IBonusCode = {
    Bomb: 'bomb',
    Fire: 'fire'
};

export const MODEL_NUMBER_OF_FEATURES: number = 4;

export const BOARD = {
    width: 13,
    height: 11
};

export const ACTION_SIZE = Object.values(AllActions).length;