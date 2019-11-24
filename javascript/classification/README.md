Note that 2000 games of 4 players represents ~3Gb in memory, depending on how you parse them.
Run ``node --max-old-space-size=4096 train.js`` to increase the memory limit in order to load more games at once.
Make sure to extract the data located in ``./data`` before running.