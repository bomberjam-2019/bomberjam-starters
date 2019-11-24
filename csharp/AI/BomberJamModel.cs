using Bomberjam.Client;
using Microsoft.ML.Data;

namespace Bomberjam.Bot.AI
{
    public class BomberJamModel
    {
        public static PlayerState ComputePlayerModel(GameStateStep step, string playerId)
        {
            var player = step.State.Players[playerId];
            var x = player.X;
            var y = player.Y;

            return new PlayerState
            {
                TopLeftTile = GetBoardTile(step, x - 1, y - 1),
                TopCenterTile = GetBoardTile(step, x, y - 1),
                TopRightTile = GetBoardTile(step, x + 1, y - 1),
                LeftTile = GetBoardTile(step, x - 1, y),
                RightTile = GetBoardTile(step, x + 1, y),
                BottomLeftTile = GetBoardTile(step, x - 1, y + 1),
                BottomCenterTile = GetBoardTile(step, x - 1, y + 1),
                BottomRightTile = GetBoardTile(step, x - 1, y + 1),
                Alive = (uint) (player.Alive ? 1 : 0),
                Respawning = (uint) player.Respawning,
                BombsLeft = (uint) player.BombsLeft,
                Label = (step.Actions[playerId] ?? GameAction.Stay).ToString()
            };
        }

        private static float GetBoardTile(GameStateStep step, int x, int y)
        {
            if (x < 0 || x >= step.State.Width || y < 0 || y >= step.State.Height) return '#';

            var position = x + y * step.State.Width;
            return step.State.Tiles[position];
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