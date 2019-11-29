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

type RandomBot() =
    interface IBot with
        member this.GetAction(state, myPlayerId) =
            generateRandomAction state myPlayerId

[<EntryPoint>]
let main _ =
    let bots = [| for _ in 1 .. 4 -> RandomBot() :> IBot |]
    BomberjamRunner.PlayInBrowser bots
        |> Async.AwaitTask
        |> Async.RunSynchronously
    0