using Microsoft.ML.Data;

namespace Bomberjam.Bot
{
    public class Prediction
    {
        // Predicted label from the trainer.
        [ColumnName("PredictedLabel")] 
        public string PredictedLabel { get; set; }
    }
}