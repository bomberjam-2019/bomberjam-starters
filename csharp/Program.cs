using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Bomberjam.Bot.AI;
using Bomberjam.Client;
using Microsoft.ML;

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
//            var trainer =
//                new GenericClassificationTrainer();
//
//            var loader = new ModelLoader<DataPoint>(BomberJamModel.GenerateDataPoint);
//
//            var (trainingSet, testSet) = loader.LoadData();
//            trainer.Train(trainingSet, testSet);

//            
//            var mlContext = new MLContext(0);
//
//            var loadedModel = mlContext.Model.Load(@"C:\Dev\bomberjam\csharp\trained-model", out var modelInputSchema);    
//            
//            var predictionEngine = mlContext.Model.CreatePredictionEngine<DataPoint, Prediction>(loadedModel);
//
//            await SimulateExample(x => Enum.Parse<GameAction>(predictionEngine.Predict(x).PredictedLabel));
//            
//            await PlayInBrowserExample(x => Enum.Parse<GameAction>(predictionEngine.Predict(x).PredictedLabel));
        }

        private static async Task SimulateExample(Func<DataPoint, GameAction> getMove)
        {
            var simulation = await BomberjamRunner.StartSimulation();

            while (!simulation.IsFinished)
            {
//                Console.WriteLine(simulation.CurrentState.Tiles);
                var currentState = simulation.CurrentState;

                var playerActions = simulation.CurrentState.Players.ToDictionary(
                    p => p.Key,
                    p => getMove(new DataPoint()
                    {
                        Features =  BomberJamModel.GetStateFeatures2(currentState, p.Key)
                    }));
                
                simulation = await simulation.GetNext(playerActions);
            }
        }

//        private static IDictionary<string, GameAction> GenerateRandomActionForAllPlayers(GameState state)
//        {
//            return state.Players.ToDictionary(
//                p => p.Key,
//                p => GenerateRandomAction(state, p.Key));
//        }

        private static GameAction GenerateRandomAction(GameState state, string myPlayerId, Func<DataPoint, GameAction> getMove)
        {
            var move = getMove(new DataPoint()
            {
                Features =  BomberJamModel.GetStateFeatures2(state, myPlayerId)
            });
            
            Console.WriteLine($"{myPlayerId} {move}");

            return move;
        }

        private static Task PlayInBrowserExample(Func<DataPoint, GameAction> getMove)
        {
            return BomberjamRunner.PlayInBrowser(new BomberjamOptions((s, p) => GenerateRandomAction(s, p, getMove)));
        }
    }
}