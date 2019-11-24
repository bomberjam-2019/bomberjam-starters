using System;
using System.Collections.Generic;
using Bomberjam.Bot.AI;
using Microsoft.ML;

namespace Bomberjam.Bot
{
    // https://docs.microsoft.com/en-ca/dotnet/machine-learning/tutorials/github-issue-classification
    public class ClassificationTrainer
    {
        private MLContext _mlContext;

        public ClassificationTrainer()
        {
            _mlContext = new MLContext(0);
        }


        public void Train(IEnumerable<BomberJamModel.PlayerState> trainingSet,
            IEnumerable<BomberJamModel.PlayerState> testSet)
        {
            _mlContext = new MLContext(0);

            var trainingDataView = _mlContext.Data.LoadFromEnumerable(trainingSet);
            var testDataView = _mlContext.Data.LoadFromEnumerable(testSet);

            var trainingPipeline = BuildAndTrainModel();

            var trainedModel = trainingPipeline.Fit(trainingDataView);
            Evaluate(trainedModel, testDataView);

  //          PredictionEngine<BomberJamModel.PlayerState, BomberJamModel.MovePrediction> predictionEngine = this._mlContext.Model.CreatePredictionEngine<BomberJamModel.PlayerState, BomberJamModel.MovePrediction>(trainedModel);

//            CustomEvaluate(s => predictionEngine.Predict(s), testSet);
        }

        public IEstimator<ITransformer> BuildAndTrainModel()
        {
            // STEP 3: Transform your data and add a learner
            // Assign numeric values to text in the "Label" column, because only
            // numbers can be processed during model training.
            // Add a learning algorithm to the pipeline. e.g.(What type of iris is this?)
            // Convert the Label back into original text (after converting to number in step 3)

            var pipeline =
                _mlContext.Transforms.Conversion.MapValueToKey(
                        inputColumnName: nameof(BomberJamModel.PlayerState.Move),
                        outputColumnName: "Label")
                    .Append(
                        _mlContext.Transforms.Concatenate("Features",
                            nameof(BomberJamModel.PlayerState.TopCenterTile),
                            nameof(BomberJamModel.PlayerState.TopRightTile),
                            nameof(BomberJamModel.PlayerState.LeftTile),
                            nameof(BomberJamModel.PlayerState.RightTile),
                            nameof(BomberJamModel.PlayerState.BottomLeftTile),
                            nameof(BomberJamModel.PlayerState.BottomCenterTile),
                            nameof(BomberJamModel.PlayerState.BottomRightTile),
                            nameof(BomberJamModel.PlayerState.Alive),
                            nameof(BomberJamModel.PlayerState.Respawning),
                            nameof(BomberJamModel.PlayerState.BombsLeft)))
                    .AppendCacheCheckpoint(_mlContext)
                    .Append(_mlContext.MulticlassClassification.Trainers.SdcaMaximumEntropy(
                        "Label",
                        "Features"))
                    .Append(_mlContext.Transforms.Conversion.MapKeyToValue(
                        inputColumnName: "Label",
                        outputColumnName: "PredictedLabel"));
            

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
        

        public void CustomEvaluate(Func<BomberJamModel.PlayerState, BomberJamModel.MovePrediction> predictor, IEnumerable<BomberJamModel.PlayerState> states)
        {
            var success = 0;
            var failure = 0;

            foreach (var state in states)
            {
                var expectedResult = state.Move;
                state.Move = "";
                var result = predictor(state);
                
                Console.WriteLine($"Predict: {result.Move}, Right Answer: {expectedResult}");

                if (result.Move == expectedResult)
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
        }
    }
}