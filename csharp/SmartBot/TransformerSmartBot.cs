using System.Collections.Generic;
using Bomberjam.Client;
using Microsoft.ML;

namespace Bomberjam.Bot.SmartBot
{
    // Use transform on features
    public class TransformerSmartBot : BaseSmartBot<TransformerSmartBot.PlayerState>
    {
        public class PlayerState : LabeledDataPoint
        {
            public float TwoTopTile { get; set; }

            public float TopTile { get; set; }

            public float TwoLeftTile { get; set; }

            public float LeftTile { get; set; }

            public float TwoRightTile { get; set; }

            public float RightTile { get; set; }

            public float BottomCenterTile { get; set; }

            public float TwoBottomTile { get; set; }

            public float Alive { get; internal set; }

            public float Respawning { get; internal set; }

            public float BombsLeft { get; internal set; }
        }

        public TransformerSmartBot(MultiClassAlgorithmType algorithmType, int sampleSize = 100) : base(algorithmType, sampleSize)
        {
        }

        protected override PlayerState ExtractFeatures(GameState state, string myPlayerId)
        {
            var player = state.Players[myPlayerId];
            var x = player.X;
            var y = player.Y;

            return new PlayerState
            {
                TwoTopTile = (uint) GameStateUtils.GetBoardTile(state, x, y - 2, myPlayerId),
                TopTile = (uint) GameStateUtils.GetBoardTile(state, x, y - 1, myPlayerId),
                TwoLeftTile = (uint) GameStateUtils.GetBoardTile(state, x - 2, y, myPlayerId),
                LeftTile = (uint) GameStateUtils.GetBoardTile(state, x - 1, y, myPlayerId),
                RightTile = (uint) GameStateUtils.GetBoardTile(state, x + 1, y, myPlayerId),
                TwoRightTile = (uint) GameStateUtils.GetBoardTile(state, x + 2, y, myPlayerId),
                BottomCenterTile = (uint) GameStateUtils.GetBoardTile(state, x, y + 1, myPlayerId),
                TwoBottomTile = (uint) GameStateUtils.GetBoardTile(state, x, y + 2, myPlayerId),
                Alive = (uint) (player.Alive ? 1 : 0),
                Respawning = (uint) player.Respawning,
                BombsLeft = (uint) player.BombsLeft,
            };
        }

        protected override IEnumerable<IEstimator<ITransformer>> GetFeaturePipeline()
        {
            return new IEstimator<ITransformer>[]
            {
                this.MlContext.Transforms.Concatenate("Features",
                    nameof(PlayerState.TopTile),
                    nameof(PlayerState.TwoTopTile),
                    nameof(PlayerState.TopTile),
                    nameof(PlayerState.TwoLeftTile),
                    nameof(PlayerState.LeftTile),
                    nameof(PlayerState.RightTile),
                    nameof(PlayerState.TwoRightTile),
                    nameof(PlayerState.BottomCenterTile),
                    nameof(PlayerState.TwoBottomTile),
                    nameof(PlayerState.Alive),
                    nameof(PlayerState.Respawning),
                    nameof(PlayerState.BombsLeft))
            };
        }
    }
}