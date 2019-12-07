using System;
using System.Collections.Generic;
using Bomberjam.Client;
using Microsoft.ML;
using Microsoft.ML.Data;

namespace Bomberjam.Bot.AI
{
    // Bot using raw features
    public class RawSmartBot: BaseSmartBot<RawSmartBot.RawDataPoint>
    {
        public class RawDataPoint: LabeledDataPoint
        {
            // Size = number of features
            [VectorType(11)]
            public float[] Features { get; set; }
        }

        public RawSmartBot(AlgorithmType algorithmType, int sampleSize = 100): base(algorithmType, sampleSize)
        {
        }

        protected override RawDataPoint ExtractFeatures(GameState state, string myPlayerId)
        {
            var player = state.Players[myPlayerId];
            var x = player.X;
            var y = player.Y;

            var twoTopTile = GameStateUtils.GetBoardTile(state, x, y - 2, myPlayerId);
            var topCenterTile = GameStateUtils.GetBoardTile(state, x, y - 1, myPlayerId);
            var leftTile = GameStateUtils.GetBoardTile(state, x - 1, y, myPlayerId);
            var twoLeftTile = GameStateUtils.GetBoardTile(state, x - 2, y, myPlayerId);
            var rightTile = GameStateUtils.GetBoardTile(state, x + 1, y, myPlayerId);
            var twoRightTile = GameStateUtils.GetBoardTile(state, x + 2, y, myPlayerId);
            var bottomCenterTile = GameStateUtils.GetBoardTile(state, x - 1, y + 1, myPlayerId);
            var twoBottomCenterTile = GameStateUtils.GetBoardTile(state, x - 1, y + 1, myPlayerId);
            var currentTile = GameStateUtils.GetBoardTile(state, x, y, myPlayerId);

            return new RawDataPoint()
            {

                Features = new float[]
                {
                    player.Alive ? 1 : 0,
                    player.Respawning,
                    player.BombsLeft,
                    twoLeftTile,
                    topCenterTile,
                    twoRightTile,
                    leftTile,
                    rightTile,
                    twoBottomCenterTile,
                    bottomCenterTile,
                    currentTile
                }
            };
        }

        // Because the dataPoint has the format expected by ML.Net (one column Features and one Label)
        // their is no need to transform the data.
        protected override IEnumerable<IEstimator<ITransformer>> GetFeaturePipeline()
        {
            return Array.Empty<IEstimator<ITransformer>>();
        }
    }
}