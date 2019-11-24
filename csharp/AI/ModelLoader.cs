using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Bomberjam.Client;

namespace Bomberjam.Bot.AI
{
    public class ModelLoader
    {
        private const string Gamelogs = @"F:\tmp\8000_gamelogs";
        private const int SampleSize = 10;
        private const double TestRatio = 0.2;
        
        public static (IEnumerable<BomberJamModel.PlayerState> trainingSet, IEnumerable<BomberJamModel.PlayerState> testSet) LoadData()
        {
            var fileEntries = Directory.GetFiles(Gamelogs).Take(SampleSize);
            
            return SplitData(fileEntries);
        }
        
        
        private static (IEnumerable<BomberJamModel.PlayerState> trainingSet, IEnumerable<BomberJamModel.PlayerState> testSet) SplitData(
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
        
        private static IEnumerable<BomberJamModel.PlayerState> GenerateModel(Gamelog gamelog)
        {
            foreach (var step in gamelog)
            foreach (var player in step.Actions.Keys)
                yield return BomberJamModel.ComputePlayerModel(step, player);
        }

    }
}