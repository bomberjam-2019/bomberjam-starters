export default function gaussianRand() {
    var rand = 0;

    for (var i = 0; i < 6; i += 1) {
        rand += Math.random() - 0.5;
    }

    return rand / 6;
}