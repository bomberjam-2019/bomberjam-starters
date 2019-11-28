using System;
using Bomberjam.Client;

namespace Bomberjam.Bot
{
    public class RandomBot : IBot
    {
        private static readonly Random Rng = new Random();

        private static readonly GameAction[] AllActions =
        {
            GameAction.Left,
            GameAction.Right,
            GameAction.Up,
            GameAction.Down,
            GameAction.Bomb,
            GameAction.Stay
        };

        public GameAction GetAction(GameState state, string myPlayerId)
        {
            return AllActions[Rng.Next(AllActions.Length)];
        }
    }
}