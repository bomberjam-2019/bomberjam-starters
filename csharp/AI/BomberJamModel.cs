using Bomberjam.Client;
using Microsoft.ML.Data;

namespace Bomberjam.Bot.AI
{
    public class BomberJamModel
    {
//        public class BomberJamDataPoint : DataPoint
//        {
//            public string Label { get; set; }
//            
//            [VectorType(11)] 
//            public float[] Features { get; set; }
//        }

        public static DataPoint GenerateDataPoint(GameStateStep step, string playerId)
        {
            return new DataPoint
            {
                Label = (step.Actions[playerId] ?? GameAction.Stay).ToString(),
                Features = GetStateFeatures(step.State, playerId)
            };
        }
        
        public static float[] GetStateFeatures(GameState state, string playerId)
        {
            var player = state.Players[playerId];
            var x = player.X;
            var y = player.Y;

            var topLeftTile = GetBoardTile(state, x - 1, y - 1);
            var topCenterTile = GetBoardTile(state, x, y - 1);
            var topRightTile = GetBoardTile(state, x + 1, y - 1);
            var leftTile = GetBoardTile(state, x - 1, y);
            var rightTile = GetBoardTile(state, x + 1, y);
            var bottomLeftTile = GetBoardTile(state, x - 1, y + 1);
            var bottomCenterTile = GetBoardTile(state, x - 1, y + 1);
            var bottomRightTile = GetBoardTile(state, x - 1, y + 1);

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
            };
        }


        public static PlayerState ComputePlayerModel(GameStateStep step, string playerId)
        {
            var player = step.State.Players[playerId];
            var x = player.X;
            var y = player.Y;

            return new PlayerState
            {
                TopLeftTile = GetBoardTile(step.State, x - 1, y - 1),
                TopCenterTile = GetBoardTile(step.State, x, y - 1),
                TopRightTile = GetBoardTile(step.State, x + 1, y - 1),
                LeftTile = GetBoardTile(step.State, x - 1, y),
                RightTile = GetBoardTile(step.State, x + 1, y),
                BottomLeftTile = GetBoardTile(step.State, x - 1, y + 1),
                BottomCenterTile = GetBoardTile(step.State, x - 1, y + 1),
                BottomRightTile = GetBoardTile(step.State, x - 1, y + 1),
                Alive = (uint) (player.Alive ? 1 : 0),
                Respawning = (uint) player.Respawning,
                BombsLeft = (uint) player.BombsLeft,
                Label = (step.Actions[playerId] ?? GameAction.Stay).ToString()
            };
        }

        private static uint GetBoardTile(GameState state, int x, int y)
        {
            if (x < 0 || x >= state.Width || y < 0 || y >= state.Height) return '#';

            var position = x + y * state.Width;
            return state.Tiles[position];
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