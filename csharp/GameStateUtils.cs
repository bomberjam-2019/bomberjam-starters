using System.Collections.Generic;
using System.Linq;
using Bomberjam.Client;

namespace Bomberjam.Bot
{
    public static class GameStateUtils
    {
        public enum Tile
        {
            OutOfScope = 0,
            Block = 1,
            BreakableBlock = 2,
            Enemy = 3,
            Bomb = 4,
            FreeSpace = 5,
            Bonus = 6,
            Explosion = 7,
        }

        private static readonly Dictionary<char, Tile> TileConverter = new Dictionary<char, Tile>()
        {
            {'+', Tile.BreakableBlock},
            {'.', Tile.FreeSpace},
            {'#', Tile.Block},
            {'*', Tile.Explosion},
        };

        // TODO-Main-2: Maybe this method hide too much information
        // Example: If an enemy and a bomb is on the same tile only return the bomb information
        public static Tile GetBoardTile(GameState state, int x, int y, string selfPlayerId)
        {
            if (x < 0 || x >= state.Width || y < 0 || y >= state.Height) return Tile.OutOfScope;

            if (state.Bombs.Any(b => b.Value.X == x && b.Value.Y == y))
            {
                return Tile.Bomb;
            }

            if (state.Players.Any(b => b.Value.Id != selfPlayerId && b.Value.X == x && b.Value.Y == y))
            {
                return Tile.Enemy;
            }

            if (state.Bonuses.Any(b => b.Value.X == x && b.Value.Y == y))
            {
                return Tile.Bonus;
            }

            var position = x + y * state.Width;
            var ch = state.Tiles[position];
            return TileConverter[ch];
        }
    }
}