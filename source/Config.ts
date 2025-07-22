import {GreetingSchema} from "./commands/impl/GreetingCommand"
import {JSONFilePreset} from "lowdb/node";
import {Low} from "lowdb";
import {GuardRoleSchema} from "./commands/impl/GuardRoleCommand";

export type ConfigSchema = {
    commands: {
        'налаштувати-привітання': GreetingSchema,
        'налаштувати-вартового': GuardRoleSchema
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