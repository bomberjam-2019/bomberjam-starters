using System.Threading.Tasks;
using Bomberjam.Client;

namespace Bomberjam.Bot.SmartBot
{
    public interface ISmartBot<T> : IBot where T : LabeledDataPoint
    {
        T ExtractDataPoint(GameState state, string myPlayerId, string label = null);

        // Create model + output metrics
        void Train(string gameLogsPath, bool calculateMetrics = false);

        Task Save(string path);

        Task Load(string path);

        GameAction Predict(T dataPoint);

        void EvaluateFeatures(string gameLogsPath);
    }
}