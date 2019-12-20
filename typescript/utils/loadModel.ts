import * as tf from '@tensorflow/tfjs-node';

export default async function LoadModel(modelPath: string): Promise<tf.Sequential> {
    const model = tf.sequential();
    const layers = await tf.loadLayersModel(modelPath);
    model.add(layers);

    return model;
}