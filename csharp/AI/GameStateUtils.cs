using System.Collections.Generic;
using System.Linq;
using Bomberjam.Client;

namespace Bomberjam.Bot.AI
{
    public static class GameStateUtils
    {
        public enum Tile
        {
            Block,
            BreakableBlock,
            Ennemy,
            Bomb,
            FreeSpace,
            Bonus,
            Explosion,
        }
        
        private static readonly Dictionary<char, Tile> TileConverter = new Dictionary<char, Tile>()
        {
            {'+', Tile.BreakableBlock},
            {'.', Tile.FreeSpace},
            {'#', Tile.Block},
            {'*', Tile.Explosion},
        };
        
        public static uint GetBoardTile(GameState state, int x, int y, string self)
        {
            if (x < 0 || x >= state.Width || y < 0 || y >= state.Height) return (uint) Tile.Block;

            if (state.Bombs.Any(b => b.Value.X == x && b.Value.Y == y))
            {
                return (uint) Tile.Bomb;
            }

            if (state.Players.Any(b => b.Value.Id != self && b.Value.X == x && b.Value.Y == y))
            {
                return (uint) Tile.Ennemy;
            }

            if (state.Bonuses.Any(b => b.Value.X == x && b.Value.Y == y))
            {
                return (uint) Tile.Bonus;
            }

            var position = x + y * state.Width;
            var ch = state.Tiles[position];
            return (uint) TileConverter[ch];
        }
        
    }
}