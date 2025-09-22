import {Client} from "discord.js";

export abstract class BackgroundWorker {
    abstract job(client: Client): Promise<void>
}