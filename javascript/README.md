# Bomberjam Javascript Starter
In here you will find useful scripts to train and test your bot
Use these commands:
``node train.js`` to start training your model.
``node test.js`` to have details on how your model behaves.
``node simulate.js 20`` to play multiple games (20 in this case) fast and see how your bot scores.
``node play.js`` to see your bot in action or play against others.

Note that training might take a lot of RAM. Node has a low memory limit, but you can increase it like so:
``node --max-old-space-size=4096 train.js``
Make sure to extract the data located in ``data/`` before running.

You can edit any code you find in here, if you need more flexiblity, but you technically don't need to.
The ``src/`` folder contains code you shouldn't need.
The ``bots/`` folder is where you'll work. 
An example bot was laid out for you in ``bots/deep-cnn``