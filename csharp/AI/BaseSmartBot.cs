using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Bomberjam.Client;
using Microsoft.ML;
using Microsoft.ML.Data;
using Microsoft.ML.Trainers;

namespace Bomberjam.Bot.AI
{
    public abstract class BaseSmartBot<T> : ISmartBot<T> where T : LabeledDataPoint
    {
        private readonly MulticlassAlgorithmType _algorithmType;
        private readonly int _sampleSize;

        protected MLContext _mlContext;
        private PredictionEngine<T, Prediction> _predictionEngine;
        private DataViewSchema _schema;
        private ITransformer _trainedModel;

        protected BaseSmartBot(MulticlassAlgorithmType algorithmType, int sampleSize)
        {
            _algorithmType = algorithmType;
            _sampleSize = sampleSize;
        }


        public GameAction GetAction(GameState state, string myPlayerId)
        {
            var dataPoint = ExtractDataPoint(state, myPlayerId);

            return Predict(dataPoint);
        }

        public T ExtractDataPoint(GameState state, string myPlayerId, string label = null)
        {
            var dataPoint = ExtractFeatures(state, myPlayerId);

            if (!string.IsNullOrEmpty(label)) dataPoint.Label = label;

            return dataPoint;
        }


        public void Train(string gameLogsPath)
        {
            _mlContext = new MLContext(0);

            var data = LoadDataPoint(gameLogsPath);
            var dataView = _mlContext.Data.LoadFromEnumerable(data);

            var splitDataView = _mlContext.Data.TrainTestSplit(dataView, 0.2);
            _schema = dataView.Schema;

            var trainingPipeline = GetPredictorPipeline();

            // TODO: You can debug your pipeline by preview the columns:
            // https://docs.microsoft.com/en-us/dotnet/machine-learning/how-to-guides/inspect-intermediate-data-ml-net#preview-result-of-pre-processing-or-training-on-a-subset-of-the-data
            //var previewDebugging = trainingPipeline.Preview(splitDataView.TestSet);

            _trainedModel = trainingPipeline.Fit(splitDataView.TrainSet);
            _predictionEngine = _mlContext.Model.CreatePredictionEngine<T, Prediction>(_trainedModel);

            ComputeMetrics(splitDataView.TestSet);
        }
        

        public Task Save(string path)
        {
            _mlContext.Model.Save(_trainedModel, _schema, path);
            Console.WriteLine(@"Model saved!");

            return Task.CompletedTask;
        }

        public Task Load(string path)
        {
            var loadedModel = _mlContext.Model.Load(path, out var modelInputSchema);

            _predictionEngine = _mlContext.Model.CreatePredictionEngine<T, Prediction>(loadedModel);

            return Task.CompletedTask;
        }

        public GameAction Predict(T dataPoint)
        {
            var predictedLabel = _predictionEngine.Predict(dataPoint).PredictedLabel;

            return Enum.Parse<GameAction>(predictedLabel);
        }
        
                // Using LightGbm algorithm
        // https://docs.microsoft.com/en-us/dotnet/machine-learning/how-to-guides/explain-machine-learning-model-permutation-feature-importance-ml-net
        public void EvaluateFeatures(string gameLogsPath)
        {
            _mlContext = new MLContext(0);

            var data = LoadDataPoint(gameLogsPath);
            var dataView = _mlContext.Data.LoadFromEnumerable(data);

            var splitDataView = _mlContext.Data.TrainTestSplit(dataView, 0.2);

            var trainingPipeline = GetLightGbmFmiPipeline();

            var trainedModel = trainingPipeline.Fit(splitDataView.TrainSet);

            // Transform the dataset.
            var transformedData = trainedModel.Transform(splitDataView.TestSet);

            // Extract the predictor.
            var linearPredictor = trainedModel.LastTransformer;

            // Compute the permutation metrics for the linear model using the normalized data.
            var permutationMetrics =
                _mlContext.MulticlassClassification.PermutationFeatureImportance(linearPredictor, transformedData);

            // Now let's look at which features are most important to the model
            // overall. Get the feature indices sorted by their impact on
            // microaccuracy.
            var sortedIndices = permutationMetrics
                .Select((metrics, index) => new {index, metrics.MicroAccuracy})
                .OrderByDescending(feature => Math.Abs(feature.MicroAccuracy.Mean))
                .Select(feature => feature.index);

            Console.WriteLine(
                "Feature Index\tChange in MicroAccuracy\t95% Confidence in the Mean Change in MicroAccuracy");

            var microAccuracy = permutationMetrics.Select(x => x.MicroAccuracy)
                .ToArray();

            foreach (var i in sortedIndices)
                Console.WriteLine("{0}\t\t{1:G3}\t\t{2:G3}",
                    i,
                    microAccuracy[i].Mean,
                    1.96 * microAccuracy[i].StandardError);
        }


        protected abstract T ExtractFeatures(GameState state, string myPlayerId);

        private IEstimator<ITransformer> GetPredictorPipeline()
        {
            // Convert label in Key object that ML.Net need in classification algorithm
            IEstimator<ITransformer> pipeline =
                _mlContext.Transforms.Conversion.MapValueToKey(nameof(LabeledDataPoint.Label));

            // Get feature pipeline
            var featureTransformers = GetFeaturePipeline();
            foreach (var featureTransformer in featureTransformers) pipeline = pipeline.Append(featureTransformer);

            // TODO: You can add parameter to your trainers.
            switch (_algorithmType)
            {
                case MulticlassAlgorithmType.NaiveBayes:
                    // https://docs.microsoft.com/en-us/dotnet/api/microsoft.ml.trainers.naivebayesmulticlasstrainer?view=ml-dotnet
                    // Only support binary feature values
                    pipeline = pipeline.Append(_mlContext.MulticlassClassification.Trainers.NaiveBayes());
                    break;
                case MulticlassAlgorithmType.LbfgsMaximumEntropy:
                    // https://docs.microsoft.com/en-us/dotnet/api/microsoft.ml.trainers.lbfgsmaximumentropymulticlasstrainer?view=ml-dotnet
                    // Need normalization
                    pipeline = pipeline.Append(_mlContext.MulticlassClassification.Trainers.LbfgsMaximumEntropy());
                    break;
                case MulticlassAlgorithmType.LightGbm:
                    // https://docs.microsoft.com/en-us/dotnet/api/microsoft.ml.trainers.lightgbm.lightgbmmulticlasstrainer?view=ml-dotnet
                    pipeline = pipeline.Append(_mlContext.MulticlassClassification.Trainers.LightGbm());
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }


            // Convert back Key into our label
            pipeline = pipeline.Append(_mlContext.Transforms.Conversion.MapKeyToValue(
                inputColumnName: "PredictedLabel",
                outputColumnName: nameof(Prediction.PredictedLabel)
            ));


            return pipeline;
        }

        private EstimatorChain<MulticlassPredictionTransformer<OneVersusAllModelParameters>> GetLightGbmFmiPipeline()
        {
            // Convert label in Key object that ML.Net need in classification algorithm
            IEstimator<ITransformer> pipeline =
                _mlContext.Transforms.Conversion.MapValueToKey(nameof(LabeledDataPoint.Label));

            // Get feature pipeline
            var featureTransformers = GetFeaturePipeline();
            foreach (var featureTransformer in featureTransformers) pipeline = pipeline.Append(featureTransformer);

            var finalPipeline = pipeline.Append(_mlContext.MulticlassClassification.Trainers.LightGbm());

            return finalPipeline;
        }

        protected abstract IEnumerable<IEstimator<ITransformer>> GetFeaturePipeline();


        // TODO: You can add more metrics
        public void ComputeMetrics(IDataView testDataView)
        {
            // TODO: Add more explication of metric meaning
            var metrics = _mlContext.MulticlassClassification.Evaluate(_trainedModel.Transform(testDataView));

            // % where predicted value = actual value
            Console.WriteLine($"Micro Accuracy: {metrics.MicroAccuracy:F2}");
            
            // Moyenne de l'accuracy pour chaque classe.
            // Minority classes are given equal weight as the larger classes.
            Console.WriteLine($"Macro Accuracy: {metrics.MacroAccuracy:F2}");

            // 1 = Perfect prediction.
            // 0 = Mean prediction.
            // <0 = Using random would be better.
            Console.WriteLine(
                $"Log Loss Reduction: {metrics.LogLossReduction:F2}\n");

            // https://becominghuman.ai/whats-recall-and-precision-4a801b1ac0da
            // Precision: Of all the records we predicted positive, what fraction are actually positive?
            // Recall: Of all the records which are actually positive, what fraction did we correctly predicted as positive?
            Console.WriteLine(metrics.ConfusionMatrix.GetFormattedConfusionTable());
        }

        private IEnumerable<T> LoadDataPoint(string gameLogsPath)
        {
            var fileEntries = Directory.GetFiles(gameLogsPath).Take(_sampleSize);

            return fileEntries.Take(_sampleSize).SelectMany(x => GenerateModel(new Gamelog(x)));
        }

        // TODO: You can filter the data you want to train on here
        // Idea:
        // - Normalize actions (there is a lot more stay than bomb)
        // - Only train with the winners move?
        private IEnumerable<T> GenerateModel(Gamelog gamelog)
        {
            foreach (var gameState in gamelog)
            foreach (var playerId in gameState.Actions.Keys)
                yield return ExtractDataPoint(gameState.State, playerId, gameState.Actions[playerId].ToString());
        }

//        private IEnumerable<T> GenerateNormalizedModel(Gamelog gamelog)
//        {
//            var allActions = gamelog.SelectMany(x =>
//            {
//                return x.Actions.Values;
//            }).Where(x => x.HasValue);
//
//            var minimalAction = allActions.GroupBy(x =>
//            {
//                return x;
//            }).Select(a =>
//            {
//                return a.Count();
//            }).Min();
//
//            var shuffledGameLog = gamelog.OrderBy(a => Guid.NewGuid()).ToList();
//            var normalizeHelper = new Dictionary<GameAction, int>();
//
//
//            foreach (GameStateStep step in shuffledGameLog)
//            foreach (var player in step.Actions.Keys)
//            {
//                if (!step.Actions[player].HasValue)
//                {
//                    continue;
//                }
//
//                if (normalizeHelper.TryGetValue(step.Actions[player].Value, out var count))
//                {
//                    if (count >= minimalAction)
//                    {
//                        continue;
//                    }
//
//                    normalizeHelper[step.Actions[player].Value] = ++count;
//                }
//                else
//                {
//                    normalizeHelper.Add(step.Actions[player].Value, 1);
//                }
//
//                if ((step.Actions[player].Value == GameAction.Bomb || step.Actions[player].Value == GameAction.Down))
//                {
//                    yield return this.GenerateData(step, player);
//                }
//
//            }
//        }

        private class Prediction
        {
            // Predicted label from the trainer.
            public string PredictedLabel { get; set; }


            [ColumnName("Score")]
            public float[]
                Scores { get; set; }
        }
    }
}