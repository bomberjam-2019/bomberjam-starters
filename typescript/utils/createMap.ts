export default function createMap(width: number, height: number, defaultValue: number = 0): number[][] {
    return (new Array(width))
        .fill(0)
        .map(_ => (new Array(height)).fill(defaultValue));
}