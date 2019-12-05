using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Bomberjam.Bot.AI;
using Bomberjam.Bot.AI.AccordNet;
using Bomberjam.Client;
using Microsoft.ML;

namespace Bomberjam.Bot
{
    public class Program
    {
        private const string modelSavePath = @"F:\tmp\savedModel";

        public static async Task Main()
        {
            ParseGamelogExample("/path/to/some.gamelog");

            //await SimulateExample();

            //await PlayInBrowserExample();

            //var trainer = new AccordClassificationTrainer(AccordClassificationTrainer.AlgorithmType.DecisionTree);
            var trainer = new GenericClassificationTrainer(GenericClassificationTrainer.AlgorithmType.LightGbm);

            Train(trainer);
            //await Game(trainer);
        }

        // Train, get metrics and save your Machine Learning Bot
        public static void Train(ITrainer<DataPoint, string> trainer)
        {
            var loader = new ModelLoader<DataPoint>(BomberJamModel.GenerateDataPoint);

            var (trainingSet, testSet) = loader.LoadData();

            trainer.Train(trainingSet);

            trainer.ComputeMetrics(testSet);

            trainer.Save(modelSavePath);
        }

        private static void ParseGamelogExample(string path)
        {
            var gamelog = new Gamelog(path);

            foreach (var step in gamelog)
            {
                Console.WriteLine(step.State.Tiles);
            }
        }

        private static async Task TestGame(ITrainer<DataPoint, string> trainer)
        {
            var loader = new ModelLoader<DataPoint>(BomberJamModel.GenerateDataPoint);
            var (trainingSet, _) = loader.LoadData();

            trainer.Train(trainingSet);

            var smartBot = new SmartBot(trainer);

            await PlayInBrowserExample(smartBot);
        }

        private static async Task Game(ITrainer<DataPoint, string> trainer)
        {
            await trainer.Load(modelSavePath);

            var smartBot = new SmartBot(trainer);

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