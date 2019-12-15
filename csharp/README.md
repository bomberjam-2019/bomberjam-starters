ML.Net documentation: https://docs.microsoft.com/en-us/dotnet/machine-learning/

Voici le starter C# qui utilise Ml.net et un algorithme basé sur le decision tree (par défaut)

## Où jouer dans le code?

Plusieurs commentaires TODO ont été ajouté dans le codebase pour vous aider à vous retrouver.

### 1. Préalable

Partir le game-server de BomberJam localement. 

Au root du repo, exécuter les commandes suivantes (faut node d'installer):
* Installer les packages: "npm i"
* Lancer le serveur: "npm run server"

Le port affiché dans le terminal est celui a mettre dans config.json pour les parties en local.


### 2. TODO-Setup: 

Les commentaires "// TODO-Setup" vont être nécéssaire pour rendre votre setup fonctionelle.

**TODO-Setup-1**: Mettre à jour les path vers les parties enregistrées (gamelog)

ps: il faut unzip et enlever le folder macos

**TODO-Setup-2**: Choisir si le programme doit entrainer un modèle ou jouer une partie.


### 3. TODO-Main: Extraire les features

Où vous allez passer la majorité de votre temps puisque le feature-engineering est le plus grand défi en machine learning.

**TODO-Main-2**: Les méthodes utilitaires

Une implémentation de base a été fournit, mais elle a des défauts: est ce qu'il faut la modifier ou créer des méthodes plus spécialisée à vous de voir ;)


### 4. TODO-Extra: Allez plus loins

Des pistes potentielles pour se donner un edge par rapport aux autres équipes.

