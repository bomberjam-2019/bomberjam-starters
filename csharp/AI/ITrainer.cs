using System.Collections.Generic;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace Bomberjam.Bot.AI
{
    public interface ITrainer<T, TP>
    {
        void Train(IEnumerable<T> trainingSet);
        
        void ComputeMetrics(IEnumerable<T> testSet);
        
        Task Save(string path);

        Task Load(string path);

        TP Predict(T dataPoint);
    }
}