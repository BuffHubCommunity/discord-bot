import {GreetingSchema} from "./commands/impl/GreetingCommand"
import {JSONFilePreset} from "lowdb/node";
import {Low} from "lowdb";

export type ConfigSchema = {
    commands: {
        'налаштувати-привітання': GreetingSchema
    }
}

async function getConfig() {
    return await JSONFilePreset('config.json', {
        commands: {}
    }) as unknown as Low<ConfigSchema>
}

export const Config = {
    getConfig: getConfig
}