using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Bomberjam.Client;

namespace Bomberjam.Bot.AI
{
    public class ModelLoader<T>
    {
        private const string Gamelogs = @"C:\tmp\6k_gamelogs";
        private const int SampleSize = 100;
        private const double TestRatio = 0.2;

        public GenerateDataDelegate GenerateData { get; }


        public delegate T GenerateDataDelegate(GameStateStep step, string playerId);

        public ModelLoader(GenerateDataDelegate generateData)
        {
            GenerateData = generateData;
        }

        public (IEnumerable<T> trainingSet, IEnumerable<T> testSet) LoadData()
        {
            var fileEntries = Directory.GetFiles(Gamelogs).Take(SampleSize);

            return SplitData(fileEntries);
        }


        private (IEnumerable<T> trainingSet, IEnumerable<T> testSet) SplitData(
            IEnumerable<string> entries)
        {
            var enumerable = entries.ToList();
            var gameCount = enumerable.Count();
            var testCount = (int) Math.Ceiling(gameCount * TestRatio);
            var trainingCount = gameCount - testCount;

            var trainingSet = enumerable.Take(trainingCount).SelectMany(x => GenerateModel(new Gamelog(x)));
            var testSet = enumerable.TakeLast(testCount).SelectMany(x => GenerateModel(new Gamelog(x)));

            return (trainingSet, testSet);
        }

        private IEnumerable<T> GenerateModel(Gamelog gamelog)
        {
            foreach (GameStateStep step in gamelog)
            foreach (var player in step.Actions.Keys)
                yield return this.GenerateData(step, player);
        }

    }
}