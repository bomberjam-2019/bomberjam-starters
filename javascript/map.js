const { byDecreasing } = require("./sort");
const { TERRAIN, SAFE, DANGEROUS } = require("./constants");
const { directionOperators, getValueWithinRange } = require("./utils");

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
        const sortedBombs = Object.values(bombs)
            .sort(byDecreasing("countdown"))
            .map((bomb, i) => ({ ...bomb, id: i }))
            .reduce(this._convertBombsCountdown, []);

        for (let bomb of sortedBombs) {
            this.mapData[bomb.x][bomb.y].bomb = bomb;
    
            const range = bomb.range;
            const countdown = bomb.countdown;
            for (let i = 0; i < range; i++) {
                for (const directionOperator of directionOperators) {
                    const x = getValueWithinRange(0, this.width - 1, directionOperator.x(bomb.x, i));
                    const y = getValueWithinRange(0, this.height - 1, directionOperator.y(bomb.y, i));
                    const tile = this.mapData[x][y];
                    if (tile.terrain === TERRAIN.blocked) {
                        break;
                    }
    
                    tile.safeTicks = countdown;
                }
            }
        }
    }
    
    _convertBombsCountdown = (newBombs, bomb) => {
        for(let i = 0; i < newBombs.length; i++) {
            const newBomb = newBombs[i];
            if (this._canReach(bomb, newBomb)) {
                newBomb.countdown = bomb.countdown;
            }
        }
    
        newBombs.push(bomb);
    
        return newBombs
    }

    _canReach = (bomb, targetBomb) => {
        const distance = Math.sqrt(Math.pow(bomb.x - targetBomb.x, 2) + Math.pow(bomb.y - targetBomb.y, 2));
        if (distance <= bomb.range && (bomb.x === targetBomb.x || bomb.y === targetBomb.y) && !this._containsBlockedTiles(bomb.x, targetBomb.x, bomb.y, targetBomb.y)) {
            return true;
        }
    
        return false;
    }

    _containsBlockedTiles = (x1, x2, y1, y2) => {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        for (let x = minX; x <= maxX; x++) {
            const column = this.mapData[x];
            for (let y = minY; y <= maxY; y++) {
                if (column[y].terrain === TERRAIN.blocked) {
                    return true;
                }
            }
        }

        return false;
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