using System.Collections.Generic;
using System.Linq;
using Bomberjam.Client;
using Microsoft.ML.Data;

namespace Bomberjam.Bot.AI
{
    public class BomberJamModel
    {
        public static float[] GetStateFeatures(GameState state, string playerId)
        {
            var player = state.Players[playerId];
            var x = player.X;
            var y = player.Y;

            var topLeftTile = GetBoardTile(state, x - 1, y - 1, playerId);
            var topCenterTile = GetBoardTile(state, x, y - 1, playerId);
            var topRightTile = GetBoardTile(state, x + 1, y - 1, playerId);
            var leftTile = GetBoardTile(state, x - 1, y, playerId);
            var rightTile = GetBoardTile(state, x + 1, y, playerId);
            var currentTile = GetBoardTile(state, x, y, playerId);
            var bottomLeftTile = GetBoardTile(state, x - 1, y + 1, playerId);
            var bottomCenterTile = GetBoardTile(state, x - 1, y + 1, playerId);
            var bottomRightTile = GetBoardTile(state, x - 1, y + 1, playerId);

            return new float[]
            {
                player.Alive ? 1 : 0,
                player.Respawning,
                player.BombsLeft,
                topLeftTile,
                topCenterTile,
                topRightTile,
                leftTile,
                rightTile,
                bottomLeftTile,
                bottomCenterTile,
                bottomRightTile,
                currentTile,
            };
        }

        public static float[] GetStateFeatures2(GameState state, string playerId)
        {
            var player = state.Players[playerId];
            var x = player.X;
            var y = player.Y;

            var twoTopTile = GetBoardTile(state, x, y - 2, playerId);
            var topCenterTile = GetBoardTile(state, x, y - 1, playerId);
            var leftTile = GetBoardTile(state, x - 1, y, playerId);
            var twoLeftTile = GetBoardTile(state, x - 2, y, playerId);
            var rightTile = GetBoardTile(state, x + 1, y, playerId);
            var twoRightTile = GetBoardTile(state, x + 2, y, playerId);
            var bottomCenterTile = GetBoardTile(state, x - 1, y + 1, playerId);
            var twoBottomCenterTile = GetBoardTile(state, x - 1, y + 1, playerId);
            var currentTile = GetBoardTile(state, x, y, playerId);

            return new float[]
            {
                // player.Alive ? 1 : 0,
                // player.Respawning,
                player.BombsLeft,
                // twoLeftTile,
                // topCenterTile,
                // twoRightTile,
                // leftTile,
                // rightTile,
                // twoBottomCenterTile,
                bottomCenterTile,
                // currentTile
            };
        }


        public static PlayerState ComputePlayerModel(GameStateStep step, string playerId)
        {
            var player = step.State.Players[playerId];
            var x = player.X;
            var y = player.Y;

            return new PlayerState
            {
                TopLeftTile = GetBoardTile(step.State, x - 1, y - 1, playerId),
                TopCenterTile = GetBoardTile(step.State, x, y - 1, playerId),
                TopRightTile = GetBoardTile(step.State, x + 1, y - 1, playerId),
                LeftTile = GetBoardTile(step.State, x - 1, y, playerId),
                RightTile = GetBoardTile(step.State, x + 1, y, playerId),
                BottomLeftTile = GetBoardTile(step.State, x - 1, y + 1, playerId),
                BottomCenterTile = GetBoardTile(step.State, x - 1, y + 1, playerId),
                BottomRightTile = GetBoardTile(step.State, x - 1, y + 1, playerId),
                Alive = (uint) (player.Alive ? 1 : 0),
                Respawning = (uint) player.Respawning,
                BombsLeft = (uint) player.BombsLeft,
                Label = (step.Actions[playerId] ?? GameAction.Stay).ToString()
            };
        }

        enum Tile
        {
            Block,
            BreakableBlock,
            Ennemy,
            Bomb,
            FreeSpace,
            Bonus,
            Explosion,
        }

        private static Dictionary<char, Tile> TileConverter = new Dictionary<char, Tile>()
        {
            {'+', Tile.BreakableBlock},
            {'.', Tile.FreeSpace},
            {'#', Tile.Block},
            {'*', Tile.Explosion},
        };

        private static uint GetBoardTile(GameState state, int x, int y, string self)
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

        public class PlayerState
        {
            [ColumnName("TopLeftTile")]
            public float TopLeftTile { get; set; }

            [ColumnName("TopCenterTile")]
            public float TopCenterTile { get; set; }

            [ColumnName("TopRightTile")]
            public float TopRightTile { get; set; }

            [ColumnName("LeftTile")]
            public float LeftTile { get; set; }

            [ColumnName("RightTile")]
            public float RightTile { get; set; }

            [ColumnName("BottomLeftTile")]
            public float BottomLeftTile { get; set; }

            [ColumnName("BottomCenterTile")]
            public float BottomCenterTile { get; set; }

            [ColumnName("BottomRightTile")]
            public float BottomRightTile { get; set; }

            [ColumnName("Alive")]
            public float Alive { get; internal set; }

            [ColumnName("Respawning")]
            public float Respawning { get; internal set; }

            [ColumnName("BombsLeft")]
            public float BombsLeft { get; internal set; }

            public string Label { get; set; }
        }

        public class MovePrediction
        {
            [ColumnName("PredictedLabel")] public string PredictedLabel  { get; set; }

//            public string PredictedMove { get; set; }

            [ColumnName("Score")] public float[] Scores { get; set; }
        }

    }
}