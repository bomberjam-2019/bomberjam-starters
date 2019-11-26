using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Bomberjam.Bot.AI;
using Bomberjam.Bot.AI.AccordNet;
using Bomberjam.Client;
using Microsoft.ML;

namespace Bomberjam.Bot
{
    public class Program
    {
        private static readonly Random Rng = new Random(42);

        private const string modelSavePath = @"F:\tmp\savedModel";

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
            //var trainer = new AccordClassificationTrainer(AccordClassificationTrainer.AlgorithmType.DecisionTree);
            var trainer = new GenericClassificationTrainer(GenericClassificationTrainer.AlgorithmType.LightGbm);
            
            Train(trainer);
            //await Game(trainer);

        }

        public static void Train(ITrainer<DataPoint, string> trainer)
        {
            var loader = new ModelLoader<DataPoint>(BomberJamModel.GenerateDataPoint);

            var (trainingSet, testSet) = loader.LoadData();
            
            trainer.Train(trainingSet);
            
            trainer.ComputeMetrics(testSet);

            trainer.Save(modelSavePath);
        }
        
        private static async Task TestGame(ITrainer<DataPoint, string> trainer)
        {
            var loader = new ModelLoader<DataPoint>(BomberJamModel.GenerateDataPoint);
            var (trainingSet, _) = loader.LoadData();
            
            trainer.Train(trainingSet);
            
            await PlayInBrowserExample(x => Enum.Parse<GameAction>(trainer.Predict(x)));
        }

        private static async Task Game(ITrainer<DataPoint, string> trainer)
        {
            await trainer.Load(modelSavePath);

            await PlayInBrowserExample(x => Enum.Parse<GameAction>(trainer.Predict(x)));
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