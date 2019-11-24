using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Bomberjam.Bot.AI;
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
            var trainer =
                new GenericClassificationTrainer();

            var loader = new ModelLoader<DataPoint>(BomberJamModel.GenerateDataPoint);

            var (trainingSet, testSet) = loader.LoadData();
            trainer.Train(trainingSet, testSet);

//            await SimulateExample();
//            
//            await PlayInBrowserExample();
        }

        private static async Task SimulateExample()
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

        private static Task PlayInBrowserExample()
        {
            return BomberjamRunner.PlayInBrowser(new BomberjamOptions(GenerateRandomAction));
        }
    }
}