using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Bomberjam.Client;

namespace Bomberjam.Bot
{
    public class Program
    {
        private static readonly Random Rng = new Random(42);

        private static readonly GameAction[] AllActions =
        {
            GameAction.Stay,
            GameAction.Left,
            GameAction.Right,
            GameAction.Up,
            GameAction.Down,
            GameAction.Bomb
        };
        
        public static async Task Main()
        {
            ParseGamelogExemple("/path/to/some.gamelog");
            
            await SimulateExemple();
            
            await PlayInBrowserExemple();
        }

        private static void ParseGamelogExemple(string path)
        {
            var gamelog = new Gamelog(path);

            foreach (var step in gamelog)
            {
                Console.WriteLine(step.State.Tiles);
            }
        }

        private static async Task SimulateExemple()
        {
            var simulation = await BomberjamRunner.StartSimulation();
            
            while (!simulation.IsFinished)
            {
                Console.WriteLine(simulation.CurrentState.Tiles);
                
                var playerActions = GenerateRandomActionForAllPlayers(simulation.CurrentState);
                simulation = await simulation.GetNext(playerActions);
            }
        }

        private static IDictionary<string, GameAction> GenerateRandomActionForAllPlayers(GameState state)
        {
            return state.Players.ToDictionary(
                p => p.Key,
                p => GenerateRandomAction(state, p.Key));
        }

        private static GameAction GenerateRandomAction(GameState state, string myPlayerId)
        {
            return AllActions[Rng.Next(AllActions.Length)];
        }

        private static Task PlayInBrowserExemple()
        {
            return BomberjamRunner.PlayInBrowser(new BomberjamOptions(GenerateRandomAction));
        }
    }
}