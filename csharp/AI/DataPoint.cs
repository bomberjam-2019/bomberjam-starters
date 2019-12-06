using Microsoft.ML.Data;

namespace Bomberjam.Bot
{
    public class DataPoint
    {
        public string Label { get; set; }

        // Size = number of features
        [VectorType(2)]
        public float[] Features { get; set; }
    }
}