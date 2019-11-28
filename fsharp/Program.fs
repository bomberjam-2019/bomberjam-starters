open Bomberjam.Client
open System

let rng = Random()

let allGameActions =
    Enum.GetValues typeof<GameAction>
    |> Seq.cast<GameAction>
    |> Seq.toArray

let generateRandomAction (state: GameState) (myPlayerId: string) =
    let idx = rng.Next allGameActions.Length
    allGameActions.[idx]

let generateRandomActionFunc = Func<GameState, string, GameAction>(generateRandomAction)

type RandomBot() =
    interface IBot with
        member this.GetAction(state, myPlayerId) =
            generateRandomAction state myPlayerId

let playInBrowserExample =
    let bot = RandomBot()
    BomberjamRunner.PlayInBrowser bot
        |> Async.AwaitTask
        |> Async.RunSynchronously

[<EntryPoint>]
let main _ =
    playInBrowserExample
    0
