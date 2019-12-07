using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Bomberjam.Client;
using Microsoft.ML;
using Microsoft.ML.Data;
using Microsoft.ML.Transforms;

namespace Bomberjam.Bot.AI
{
    public abstract class BaseSmartBot<T> : ISmartBot<T> where T : LabeledDataPoint
    {
        private readonly int _sampleSize;

        private readonly AlgorithmType _algorithmType;

        public enum AlgorithmType
        {
            NaiveBayes,
            LbfgsMaximumEntropy,
            LightGbm,
        }


        private MLContext _mlContext;
        private ITransformer _trainedModel;
        private DataViewSchema _schema;
        private PredictionEngine<T, Prediction> _predictionEngine;

        public BaseSmartBot(AlgorithmType algorithmType, int sampleSize)
        {
            this._algorithmType = algorithmType;
            this._sampleSize = sampleSize;
        }


        public GameAction GetAction(GameState state, string myPlayerId)
        {
            var dataPoint = ExtractDataPoint(state, myPlayerId);

            return this.Predict(dataPoint);
        }

        public T ExtractDataPoint(GameState state, string myPlayerId, string label = null)
        {
            var dataPoint = this.ExtractFeatures(state, myPlayerId);

            if (!string.IsNullOrEmpty(label))
            {
                dataPoint.Label = label;
            }

            return dataPoint;
        }

        protected abstract T ExtractFeatures(GameState state, string myPlayerId);


        public void Train(string gameLogsPath)
        {
            _mlContext = new MLContext(0);

            var data = this.LoadDataPoint(gameLogsPath);
            var dataView = this._mlContext.Data.LoadFromEnumerable(data);

            var splitDataView = this._mlContext.Data.TrainTestSplit(dataView, testFraction: 0.2);
            this._schema = dataView.Schema;

            var trainingPipeline = GetPipeline();

            this._trainedModel = trainingPipeline.Fit(splitDataView.TrainSet);

            this._predictionEngine = this._mlContext.Model.CreatePredictionEngine<T, Prediction>(this._trainedModel);

            this.ComputeMetrics(splitDataView.TestSet);
        }

        private IEstimator<ITransformer> GetPipeline()
        {
            // Convert label in Key object that ML.Net need in classification algorithm
            IEstimator<ITransformer> pipeline = _mlContext.Transforms.Conversion.MapValueToKey(nameof(DataPoint.Label));

            // Get feature pipeline
            var featureTransformers = GetFeaturePipeline();
            foreach (var featureTransformer in featureTransformers)
            {
                pipeline = pipeline.Append(featureTransformer);
            }

            // Use algorithm
            switch (_algorithmType)
            {
                case AlgorithmType.NaiveBayes:
                    // https://docs.microsoft.com/en-us/dotnet/api/microsoft.ml.trainers.naivebayesmulticlasstrainer?view=ml-dotnet
                    // Only support binary feature values

                    pipeline = pipeline.Append(_mlContext.MulticlassClassification.Trainers.NaiveBayes());
                    break;
                case AlgorithmType.LbfgsMaximumEntropy:
                    // https://docs.microsoft.com/en-us/dotnet/api/microsoft.ml.trainers.lbfgsmaximumentropymulticlasstrainer?view=ml-dotnet
                    // Need normalization
                    pipeline = pipeline.Append(_mlContext.MulticlassClassification.Trainers.LbfgsMaximumEntropy());
                    break;
                case AlgorithmType.LightGbm:
                    // https://docs.microsoft.com/en-us/dotnet/api/microsoft.ml.trainers.lightgbm.lightgbmmulticlasstrainer?view=ml-dotnet
                    pipeline = pipeline.Append(_mlContext.MulticlassClassification.Trainers.LightGbm());
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }


            // Convert back Key into our label
            pipeline = pipeline.Append(this._mlContext.Transforms.Conversion.MapKeyToValue(
                inputColumnName: "PredictedLabel",
                outputColumnName: nameof(Prediction.PredictedLabel)
            ));


            return pipeline;
        }

        protected abstract IEnumerable<IEstimator<ITransformer>> GetFeaturePipeline();


        public Task Save(string path)
        {
            _mlContext.Model.Save(this._trainedModel, this._schema, path);

            return Task.CompletedTask;
        }

        public Task Load(string path)
        {
            var loadedModel = this._mlContext.Model.Load(path, out var modelInputSchema);

            this._predictionEngine = this._mlContext.Model.CreatePredictionEngine<T, Prediction>(loadedModel);

            return Task.CompletedTask;
        }

        public GameAction Predict(T dataPoint)
        {
            var predictedLabel = this._predictionEngine.Predict(dataPoint).PredictedLabel;

            return Enum.Parse<GameAction>(predictedLabel);
        }


        public void ComputeMetrics(IDataView testDataView)
        {
            // TODO: Add more explication of metric meaning
            var metrics = _mlContext.MulticlassClassification.Evaluate(this._trainedModel.Transform(testDataView));

            Console.WriteLine($"Micro Accuracy: {metrics.MicroAccuracy:F2}");
            Console.WriteLine($"Macro Accuracy: {metrics.MacroAccuracy:F2}");


            Console.WriteLine($"Log Loss: {metrics.LogLoss:F2}");

            // 1 = Perfect prediction, 0 = Mean Prediction
            Console.WriteLine(
                $"Log Loss Reduction: {metrics.LogLossReduction:F2}\n");

            Console.WriteLine(metrics.ConfusionMatrix.GetFormattedConfusionTable());
        }

        private IEnumerable<T> LoadDataPoint(string gameLogsPath)
        {
            var fileEntries = Directory.GetFiles(gameLogsPath).Take(_sampleSize);

            return fileEntries.Take(_sampleSize).SelectMany(x => GenerateModel(new Gamelog(x)));
        }

        private IEnumerable<T> GenerateModel(Gamelog gamelog)
        {
            foreach (GameStateStep gameState in gamelog)
            foreach (var playerId in gameState.Actions.Keys)
            {
                yield return this.ExtractDataPoint(gameState.State, playerId, gameState.Actions[playerId].ToString());
            }
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
            [ColumnName("PredictedLabel")] public string PredictedLabel { get; set; }


            [ColumnName("Score")]
            public float[]
                Scores { get; set; }
        }
    }
}