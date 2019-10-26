using System;
using System.Linq;
using Bomberjam.Client;
using Bomberjam.Client.Game;

namespace Bomberjam.Bot
{
    public class Program
    {
        private static readonly GameAction[] AllGameActions = Enum.GetValues(typeof(GameAction)).Cast<GameAction>().ToArray();
        
        private static readonly Random Rng = new Random(42);
        
        public static void Main()
        {
            BomberjamRunner.Run(new BomberjamOptions
            {
                Mode = GameMode.Training,
                BotFunc = GenerateRandomAction
            });
        }
        
        private static GameAction GenerateRandomAction(GameState state, string myPlayerId)
        {
            return AllGameActions[Rng.Next(AllGameActions.Length)];
        }
    }
}