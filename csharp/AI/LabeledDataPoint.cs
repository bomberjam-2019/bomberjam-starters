using Microsoft.ML.Data;

namespace Bomberjam.Bot
{
    public abstract class LabeledDataPoint
    {
        public string Label { get; set; }
    }
}