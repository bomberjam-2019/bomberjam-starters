using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Accord.IO;
using Accord.MachineLearning.DecisionTrees;
using Accord.MachineLearning.DecisionTrees.Learning;
using Accord.MachineLearning.VectorMachines;
using Accord.MachineLearning.VectorMachines.Learning;
using Accord.Statistics.Analysis;
using Accord.Statistics.Filters;
using Accord.Statistics.Kernels;

namespace Bomberjam.Bot.AI.AccordNet
{
    public class AccordClassificationTrainer : ITrainer<DataPoint, string>
    {
        public enum AlgorithmType
        {
            SupportVectorLearning,
            DecisionTree
        }

        private readonly AlgorithmType _algoType;
        private Codification<string> _codebook;
        private Func<double[][], int[]> _predictor;
        private object _predictorObj;


        public AccordClassificationTrainer(AlgorithmType algoType)
        {
            _algoType = algoType;
        }


        public void Train(IEnumerable<DataPoint> trainingSet)
        {
            var (trainingInputs, trainingOutputs) = Convert(trainingSet);

            _codebook = new Codification<string>().Learn(trainingOutputs);
            var codedTrainingOutput = _codebook.Transform(trainingOutputs);
            
            switch (_algoType)
            {
                case AlgorithmType.SupportVectorLearning:
                    this._predictor = UseSvm(trainingInputs, codedTrainingOutput);
                    break;
                case AlgorithmType.DecisionTree:
                    this._predictor = UseDecisionTree(trainingInputs, codedTrainingOutput);
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }
        }

        public void ComputeMetrics(IEnumerable<DataPoint> testSet)
        {
            var (testInputs, testOutputs) = Convert(testSet);
            var codedTestOutput = _codebook.Transform(testOutputs);

            var predicted = _predictor(testInputs);

            var confusionMatrix = new GeneralConfusionMatrix(codedTestOutput, predicted);
            Console.WriteLine($"{confusionMatrix.Accuracy}");
        }

        public Task Save(string path)
        {
            this._predictorObj.Save(path);
            
            // Issue can't save codebook..........
            // https://github.com/accord-net/framework/issues/1541
            this._codebook.Save($"{path}_codebook");

            return Task.CompletedTask;
        }

        public Task Load(string path)
        {
            switch (_algoType)
            {
                case AlgorithmType.SupportVectorLearning:
                    var loaded_svm = Serializer.Load<MulticlassSupportVectorMachine<Gaussian>>(path);
                    this._predictor = x => loaded_svm.Decide(x);
                    break;
                case AlgorithmType.DecisionTree:
                    var loaded_tree = Serializer.Load<DecisionTree>(path);
                    this._predictor = x => loaded_tree.Decide(x);
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }
            
            this._codebook = Serializer.Load<Codification<string>>($"{path}_codebook");

            return Task.CompletedTask;
        }

        public string Predict(DataPoint dataPoint)
        {
            var (trainingInputs, _) = Convert(new[] {dataPoint});
            var predicted = _predictor(trainingInputs);

            return this._codebook.Revert(predicted).First();
        }


        private Func<double[][], int[]> UseSvm(
            double[][] trainingInputs,
            int[] codedTrainingOutput)
        {
            var teacher = new MulticlassSupportVectorLearning<Gaussian>
            {
                // Configure the learning algorithm to use SMO to train the
                //  underlying SVMs in each of the binary class subproblems.
                Learner = param => new SequentialMinimalOptimization<Gaussian>
                {
                    // Estimate a suitable guess for the Gaussian kernel's parameters.
                    // This estimate can serve as a starting point for a grid search.
                    UseKernelEstimation = true
                }
            };
            
            MulticlassSupportVectorMachine<Gaussian> predictor = teacher.Learn(trainingInputs, codedTrainingOutput);
            this._predictorObj = predictor;
            
            return x => predictor.Decide(x);
        }


        private Func<double[][], int[]> UseDecisionTree(
            double[][] trainingInputs,
            int[] codedTrainingOutput)
        {
            C45Learning teacher = new C45Learning();

            var predictor = teacher.Learn(trainingInputs, codedTrainingOutput);
            this._predictorObj = predictor;

            return x => predictor.Decide(x);
        }

//        // TODO: I have no idea what I am doing...
//        private static Func<double[][], int[]> UseNeuralNetwork(
//            double[][] trainingInputs,
//            int[] codedTrainingOutput)
//        {
//            IActivationFunction function = new IdentityFunction();
//
//            // In our problem, we have 2 inputs (x, y pairs), and we will 
//            // be creating a network with 5 hidden neurons and 1 output:
//            //
//            var network = new ActivationNetwork(function,
//                11, 10, 1);
//
//            // Create a Levenberg-Marquardt algorithm
//            var teacher = new LevenbergMarquardtLearning(network)
//            {
//                UseRegularization = true
//            };
//
//            // Because the network is expecting multiple outputs,
//            // we have to convert our single variable into arrays
//            var y = codedTrainingOutput.ToDouble().ToArray();
//
//            // Iterate until stop criteria is met
//            var error = double.PositiveInfinity;
//            double previous;
//
//            do
//            {
//                previous = error;
//
//                // Compute one learning iteration
//                error = teacher.RunEpoch(trainingInputs, y);
//            } while (Math.Abs(previous - error) < 1e-10 * previous);
//
//            return x => x.Apply(network.Compute).GetColumn(0).Apply(z => (int) z);
//        }


        private static (double[][] features, string[] output) Convert(IEnumerable<DataPoint> set)
        {
            var dataPoints = set.ToList();
            var features = dataPoints.Select(x => x.Features.Select(y => (double) y).ToArray()).ToArray();
            var output = dataPoints.Select(x => x.Label).ToArray();

            return (features, output);
        }
    }
}