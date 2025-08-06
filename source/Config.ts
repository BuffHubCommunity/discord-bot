import {GreetVerifiedUserCommand, GreetVerifiedUserSchema} from "./commands/impl/GreetVerifiedUserCommand"
import {JSONFilePreset} from "lowdb/node";
import {Low} from "lowdb";
import {VerifierSchema} from "./commands/impl/SetupVerifierCommand";
import {EconomySchema} from "./commands/impl/economy/EconomyCommand";

export type ConfigSchema = {
    'commands': {
        'налаштувати-вартового': VerifierSchema,
        'налаштувати-привітання': GreetVerifiedUserSchema,
    },
    'economy': EconomySchema
}

async function getLowConfig() {
    return (await JSONFilePreset('config.json', {
        'commands': {},
        'economy': {
            'users': {}
        }
    }) as unknown as Low<ConfigSchema>)
}

async function getConfig() {
    return (await getLowConfig()).data as ConfigSchema
}

export const Config = {
    getLowConfig: getLowConfig,
    getConfig: getConfig
}