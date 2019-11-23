const { byDecreasing } = require("./sort");
const { TERRAIN, SAFE, DANGEROUS } = require("./constants");
const { createRangeOfCoordinates } = require("./utils");

class Map {
    constructor(gameState) {
        this.width = gameState.width;
        this.height = gameState.height;
        this.rawState = gameState;
        this.mapData = [];
        this._makeMapData(gameState);
    }

    print(propertyFunc) {
        for (let y = 0; y < this.height; y++) {
            let row = "";
            for (let x = 0; x < this.width; x++) {
                row += propertyFunc(this.mapData[x][y]);
            }

            console.log(row);
        }
    }

    _makeMapData(gameState) {
        this._makeTerrainData(gameState.tiles);
        this._makeBombData(gameState.bombs);
        this._makePlayerData(gameState.players);
    }

    _makeTerrainData(tiles) {
        for (let x = 0; x < this.width; x++) {
            this.mapData.push([]);
            for(let y = 0; y < this.height; y++) {
                const terrain = tiles[y * this.width + x];
                this.mapData[x].push({
                    x,
                    y,
                    safeTicks: terrain === TERRAIN.blocked ? DANGEROUS : SAFE,
                    terrain,
                    bomb: null,
                    player: null
                });
            }
        }
    }

    _makeBombData(bombs) {
        const sortedBombs = Object.values(bombs).sort(byDecreasing("countdown"));
        for (let bomb of sortedBombs) {
            this.mapData[bomb.x][bomb.y].bomb = bomb;
    
            const range = bomb.range;
            const coordinatesToMark = [
                ...createRangeOfCoordinates(bomb.x, range, 0, this.width - 1, bomb.y, 0, 0, this.height - 1),
                ...createRangeOfCoordinates(bomb.x, 0, 0, this.width - 1, bomb.y, range, 0, this.height - 1)
            ];
    
            const countdown = bomb.countdown;
            for (let { x, y } of coordinatesToMark) {
                const tile = this.mapData[x][y];
                tile.safeTicks = tile.terrain === TERRAIN.blocked ? DANGEROUS : countdown;
                // TODO If you meet a bomb, convert its countdown markers to yours
            }
        }
    }

    _makePlayerData(players) {    
        for (let player of Object.values(players)) {
            this.mapData[player.x][player.y].player = player;
        }
    }
}

module.exports = {
    Map
};