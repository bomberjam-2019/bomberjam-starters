using System;

using Bomberjam.Bot.AI;
using Bomberjam.Client;

namespace Bomberjam.Bot
{
    public class SmartBot: IBot
    {
        private readonly ITrainer<DataPoint, string> _trainer;

        public SmartBot(ITrainer<DataPoint, string> trainer)
        {
            this._trainer = trainer;
        }

        public GameAction GetAction(GameState state, string myPlayerId)
        {
            var dataPoint = new DataPoint
            {
                Features = BomberJamModel.GetStateFeatures2(state, myPlayerId)
            };

            var move = Enum.Parse<GameAction>(this._trainer.Predict(dataPoint));

            return move;
        }

    }
}