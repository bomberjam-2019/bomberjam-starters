open Bomberjam.Client
open System

let rng = Random 42

let allGameActions =
    Enum.GetValues typeof<GameAction>
    |> Seq.cast<GameAction>
    |> Seq.toArray

let generateRandomAction (state: GameState) (myPlayerId: string) =
    let idx = rng.Next allGameActions.Length
    allGameActions.[idx]

let generateRandomActionFunc = Func<GameState, string, GameAction>(generateRandomAction)

[<EntryPoint>]
let main _ =
    let options = BomberjamOptions(generateRandomActionFunc)
    let task = BomberjamRunner.PlayInBrowser options
    task.GetAwaiter().GetResult() |> ignore
    0
