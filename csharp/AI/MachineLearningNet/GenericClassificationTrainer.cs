using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Bomberjam.Bot.AI;
using Microsoft.ML;

namespace Bomberjam.Bot
{
    public class GenericClassificationTrainer : ITrainer<DataPoint, string>
    {
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
        private PredictionEngine<DataPoint, Prediction> _predictionEngine;

        public GenericClassificationTrainer(AlgorithmType algorithmType)
        {
            _algorithmType = algorithmType;
            _mlContext = new MLContext(0);
        }
        
        public void Train(IEnumerable<DataPoint> trainingSet)
        {
            _mlContext = new MLContext(0);

            var trainingDataView = _mlContext.Data.LoadFromEnumerable(trainingSet);
            this._schema = trainingDataView.Schema;

            IEstimator<ITransformer> trainingPipeline;
            switch (_algorithmType)
            {
                case AlgorithmType.NaiveBayes:
                    trainingPipeline = BuildAndTrainWithNaiveBayes();
                    this._trainedModel = trainingPipeline.Fit(trainingDataView);
                    break;
                case AlgorithmType.LbfgsMaximumEntropy:
                    trainingPipeline = BuildAndTrainWithLbfgs();
                    this._trainedModel = trainingPipeline.Fit(trainingDataView);
                    break;
                case AlgorithmType.LightGbm:
                    trainingPipeline = BuildAndTrainModelWithDecisionTree();
                    this._trainedModel = trainingPipeline.Fit(trainingDataView);
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }
            
            this._predictionEngine = this._mlContext.Model.CreatePredictionEngine<DataPoint, Prediction>(this._trainedModel);
        }

        public void ComputeMetrics(IEnumerable<DataPoint> testSet)
        {
            var testDataView = _mlContext.Data.LoadFromEnumerable(testSet);
            
            var metrics = _mlContext.MulticlassClassification.Evaluate(this._trainedModel.Transform(testDataView));
            
            Console.WriteLine($"Micro Accuracy: {metrics.MicroAccuracy:F2}");
            Console.WriteLine($"Macro Accuracy: {metrics.MacroAccuracy:F2}");
            
            
            Console.WriteLine($"Log Loss: {metrics.LogLoss:F2}");
            
            // 1 = Perfect prediction, 0 = Mean Prediction
            Console.WriteLine(
                $"Log Loss Reduction: {metrics.LogLossReduction:F2}\n");

            Console.WriteLine(metrics.ConfusionMatrix.GetFormattedConfusionTable());
        }

        public Task Save(string path)
        {
            _mlContext.Model.Save(this._trainedModel, this._schema, path);
            
            return Task.CompletedTask;
        }

        public Task Load(string path)
        {
            var loadedModel = this._mlContext.Model.Load(path, out var modelInputSchema);
            
            this._predictionEngine = this._mlContext.Model.CreatePredictionEngine<DataPoint, Prediction>(loadedModel);
            
            return Task.CompletedTask;
        }

        public string Predict(DataPoint dataPoint)
        {
            return this._predictionEngine.Predict(dataPoint).PredictedLabel;
        }
        
        public IEstimator<ITransformer> BuildAndTrainWithNaiveBayes()
        {
            var pipeline =
                _mlContext.Transforms.Conversion.MapValueToKey(nameof(DataPoint.Label))
                    .AppendCacheCheckpoint(_mlContext)
                    .Append(_mlContext.MulticlassClassification.Trainers.NaiveBayes())
                    .Append(
                        this._mlContext.Transforms.Conversion.MapKeyToValue(
                            inputColumnName: "PredictedLabel",
                            outputColumnName: nameof(Prediction.PredictedLabel)
                        ));
            
            return pipeline;
        }

        public IEstimator<ITransformer> BuildAndTrainWithLbfgs()
        {
            var pipeline =
                _mlContext.Transforms.Conversion.MapValueToKey(nameof(DataPoint.Label))
                    .AppendCacheCheckpoint(_mlContext)
                    .Append(_mlContext.MulticlassClassification.Trainers.LbfgsMaximumEntropy())
                    .Append(
                        this._mlContext.Transforms.Conversion.MapKeyToValue(
                            inputColumnName: "PredictedLabel",
                            outputColumnName: nameof(Prediction.PredictedLabel)
                        ));
            
            return pipeline;
        }

        public IEstimator<ITransformer> BuildAndTrainModelWithDecisionTree()
        {
            var pipeline =
                _mlContext.Transforms.Conversion.MapValueToKey(nameof(DataPoint.Label))
                    .AppendCacheCheckpoint(_mlContext)
                    .Append(_mlContext.MulticlassClassification.Trainers.LightGbm())
                    .Append(
                        this._mlContext.Transforms.Conversion.MapKeyToValue(
                            inputColumnName: "PredictedLabel",
                            outputColumnName: nameof(Prediction.PredictedLabel)
                        ));
            
            return pipeline;
        }
    }
}