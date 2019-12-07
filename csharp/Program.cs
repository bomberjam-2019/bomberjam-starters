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
        private const string gameLogsPath = @"F:\tmp\8000_gamelogs";
        private const string modelSavePath = @"F:\tmp\smartBot.zip";
        
        enum ProgramRole {
            TestModel,
            TrainAndSave,
            TrainAndTestGame,
            EvaluateFeature,
            PlayGame,
        }

        public static async Task Main()
        {
            var role = ProgramRole.TestModel;
            
            //var smartBot = new TransformerSmartBot(MulticlassAlgorithmType.LightGbm, 20);
            var smartBot = new RawSmartBot(MulticlassAlgorithmType.LightGbm, 100);

            switch (role)
            {
                case ProgramRole.TestModel:
                    await TestModel(smartBot);
                    break;
                case ProgramRole.TrainAndSave:
                    await TrainAndSave(smartBot);
                    break;
                case ProgramRole.TrainAndTestGame:
                    await TrainAndTestGame(smartBot);
                    break;
                case ProgramRole.EvaluateFeature:
                    EvaluateFeatures(smartBot);
                    break;
                case ProgramRole.PlayGame:
                    await Game(smartBot);
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }
        }
        
        // https://docs.microsoft.com/en-us/dotnet/machine-learning/how-to-guides/explain-machine-learning-model-permutation-feature-importance-ml-net
        // Currently only support impact LightGbm algo
        public static void EvaluateFeatures<T>(ISmartBot<T> smartBot) where T : LabeledDataPoint
        {
            smartBot.EvaluateFeatures(gameLogsPath);
        }
        
        // Train, get metrics and save your Machine Learning Bot
        public static async Task TestModel<T>(ISmartBot<T> smartBot) where T : LabeledDataPoint
        {
            smartBot.Train(gameLogsPath, true);
            await SimulatGamesScore(smartBot);
        }

        // Train, get metrics and save your Machine Learning Bot
        public static async Task TrainAndSave<T>(ISmartBot<T> smartBot) where T : LabeledDataPoint
        {
            smartBot.Train(gameLogsPath);
            await smartBot.Save(modelSavePath);
        }

        private static void ParseGamelogExample(string path)
        {
            var gamelog = new Gamelog(path);

            foreach (var step in gamelog)
            {
                Console.WriteLine(step.State.Tiles);
            }
        }

        private static async Task TrainAndTestGame<T>(ISmartBot<T> smartBot) where T : LabeledDataPoint
        {
            smartBot.Train(gameLogsPath);

            await PlayInBrowserExample(smartBot);
        }

        private static async Task Game<T>(ISmartBot<T> smartBot) where T : LabeledDataPoint
        {
            await smartBot.Load(modelSavePath);

            await PlayInBrowserExample(smartBot);
        }

        private static async Task SimulateExample<T>(ISmartBot<T> smartBot) where T : LabeledDataPoint
        {
            await smartBot.Load(modelSavePath);
            
            var bots = new IBot[]
            {
                smartBot,
                smartBot,
                smartBot,
                smartBot
            };
            
            const bool saveGamelogFile = true;
            var simulation = await BomberjamRunner.StartSimulation(bots, saveGamelogFile);

            while (!simulation.IsFinished)
            {
                await simulation.ExecuteNextTick();
            }
            
            Console.WriteLine("Simulation completed!");
        }
        
        // Simulate real game to see how your bot will perform in real games.
        private static async Task SimulatGamesScore<T>(ISmartBot<T> smartBot, int gameCount = 50) where T : LabeledDataPoint
        {
            var bots = new IBot[]
            {
                smartBot,
                smartBot,
                smartBot,
                smartBot
            };
            
            var playerScores = new Dictionary<string, List<int>>()
            {
                {"p1", new List<int>()},
                {"p2", new List<int>()},
                {"p3", new List<int>()},
                {"p4", new List<int>()},
            };

            for (int i = 0; i < gameCount; i++)
            {
                var simulation = await BomberjamRunner.StartSimulation(bots, false);

                while (!simulation.IsFinished)
                {
                    await simulation.ExecuteNextTick();
                }
            
                foreach (var player in simulation.CurrentState.Players)
                {
                    playerScores[player.Key].Add(player.Value.score);
                }
            }
            
            var avgP1 = playerScores["p1"].Aggregate((x, y) => x + y) / gameCount;
            var avgP2 = playerScores["p2"].Aggregate((x, y) => x + y) / gameCount;
            var avgP3 = playerScores["p3"].Aggregate((x, y) => x + y) / gameCount;
            var avgP4 = playerScores["p4"].Aggregate((x, y) => x + y) / gameCount;
            
            Console.WriteLine($"Average scores p1: {avgP1}");
            Console.WriteLine($"Average scores p2: {avgP2}");
            Console.WriteLine($"Average scores p3: {avgP3}");
            Console.WriteLine($"Average scores p4: {avgP4}");


        }

        private static Task PlayInBrowserExample(params IBot[] myBots)
        {
            var bots = new List<IBot>();
            bots.AddRange(myBots);

            var missingBot = 4 - myBots.Length;
            for (int i = 0; i < missingBot; i++)
            {
                bots.Add(new RandomBot());
            }

            return BomberjamRunner.PlayInBrowser(bots.ToArray());
        }
    }
}