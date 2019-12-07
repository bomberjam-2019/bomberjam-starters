using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Bomberjam.Bot.AI;
using Bomberjam.Client;

namespace Bomberjam.Bot
{
    public class Program
    {
        private const string gameLogsPath = @"F:\tmp\8000_gamelogs";
        private const string modelSavePath = @"F:\tmp\smartBot.zip";

        public static async Task Main()
        {
            // ParseGamelogExample("/path/to/some.gamelog");

            //await SimulateExample();

            //await PlayInBrowserExample();

            //var smartBot = new AccordClassificationTrainer(AccordClassificationTrainer.AlgorithmType.DecisionTree);
            var smartBot = new RawSmartBot(BaseSmartBot<RawSmartBot.RawDataPoint>.AlgorithmType.LightGbm, 20);

            TrainAndSave(smartBot);
            //await TestGame(smartBot);
        }

        // Train, get metrics and save your Machine Learning Bot
        public static void TrainAndSave<T>(ISmartBot<T> smartBot) where T : LabeledDataPoint
        {
            smartBot.Train(gameLogsPath);
            smartBot.Save(modelSavePath);
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

        private static async Task SimulateExample()
        {
            var bots = new IBot[]
            {
                new RandomBot(),
                new RandomBot(),
                new RandomBot(),
                new RandomBot()
            };

            const bool saveGamelogFile = true;
            var simulation = await BomberjamRunner.StartSimulation(bots, saveGamelogFile);

            while (!simulation.IsFinished)
            {
                await simulation.ExecuteNextTick();
            }

            Console.WriteLine(simulation.CurrentState.Tiles);
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