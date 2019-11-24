using System;
using System.Collections.Generic;
using Bomberjam.Bot.AI;
using Microsoft.ML;
using Microsoft.ML.Data;

namespace Bomberjam.Bot
{

    public class DataPoint
    {
        public string Label { get; set; }

        // Size = number of features
        [VectorType(11)] 
        public float[] Features { get; set; }
    }

    // Class used to capture predictions.
    public class Prediction
    {
        // Predicted label from the trainer.
        [ColumnName("PredictedLabel")] 
        public string PredictedLabel { get; set; }
    }


    public class GenericClassificationTrainer

    {
        private MLContext _mlContext;

        public GenericClassificationTrainer()
        {
            _mlContext = new MLContext(0);
        }


        public void Train(IEnumerable<DataPoint> trainingSet, 
            IEnumerable<DataPoint> testSet)
        {
            _mlContext = new MLContext(0);

            var trainingDataView = _mlContext.Data.LoadFromEnumerable(trainingSet);
            var testDataView = _mlContext.Data.LoadFromEnumerable(testSet);

            var trainingPipeline = BuildAndTrainModel();

            var trainedModel = trainingPipeline.Fit(trainingDataView);
            Evaluate(trainedModel, testDataView);
            

            var predictionEngine = this._mlContext.Model.CreatePredictionEngine<DataPoint, Prediction>(trainedModel);

            CustomEvaluate(s => predictionEngine.Predict(s), testSet);
        }

        public IEstimator<ITransformer> BuildAndTrainModel()
        {
            // STEP 3: Transform your data and add a learner
            // Assign numeric values to text in the "Label" column, because only
            // numbers can be processed during model training.
            // Add a learning algorithm to the pipeline. e.g.(What type of iris is this?)
            // Convert the Label back into original text (after converting to number in step 3)

            var pipeline =
                _mlContext.Transforms.Conversion.MapValueToKey(nameof(DataPoint.Label))
                    .AppendCacheCheckpoint(_mlContext)
                    .Append(_mlContext.MulticlassClassification.Trainers.SdcaMaximumEntropy())
                    .Append(
                        this._mlContext.Transforms.Conversion.MapKeyToValue(
                            inputColumnName: "PredictedLabel",
                            outputColumnName: nameof(Prediction.PredictedLabel)
                        ));
            

            return pipeline;
        }


        /// <summary>
        ///     The Evaluate method executes the following tasks:
        ///     - Loads the test dataset.
        ///     - Creates the multiclass evaluator.
        ///     - Evaluates the model and create metrics.
        ///     - Displays the metrics.
        /// </summary>
        public void Evaluate(ITransformer predictionEngine, IDataView testDataView)
        {
            var metrics = _mlContext.MulticlassClassification.Evaluate(predictionEngine.Transform(testDataView));
            
            Console.WriteLine($"Micro Accuracy: {metrics.MicroAccuracy:F2}");
            Console.WriteLine($"Macro Accuracy: {metrics.MacroAccuracy:F2}");
            Console.WriteLine($"Log Loss: {metrics.LogLoss:F2}");
            Console.WriteLine(
                $"Log Loss Reduction: {metrics.LogLossReduction:F2}\n");

            Console.WriteLine(metrics.ConfusionMatrix.GetFormattedConfusionTable());
        }
        

        public void CustomEvaluate(Func<DataPoint, Prediction> predictor, IEnumerable<DataPoint> states)
        {
            float success = 0;
            float failure = 0;
            
                            

            foreach (var state in states)
            {
                var expectedResult = state.Label;
                state.Label = "";
                var result = predictor(state);
                
//                Console.WriteLine($"{result.PredictedLabel} vs {expectedResult}");
                
                if (result.PredictedLabel  == expectedResult)
                {
                    ++success;
                }
                else
                {
                    ++failure;
                }
            }
            
            Console.WriteLine($"Success: {success}");
            Console.WriteLine($"Failure: {failure}");
            Console.WriteLine($"{(success/(failure+success)):F2}%");

        }
    }
}