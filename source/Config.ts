import {GreetVerifiedUserCommand, GreetVerifiedUserSchema} from "./commands/impl/GreetVerifiedUserCommand"
import {JSONFilePreset} from "lowdb/node";
import {Low} from "lowdb";
import {VerifierSchema} from "./commands/impl/SetupVerifierCommand";
import {EconomySchema} from "./commands/impl/economy/EconomyCommand";
import {PushTheCartScheme} from "./commands/impl/PushTheCartCommand";

export type ConfigSchema = {
    'commands': {
        'налаштувати-вартового': VerifierSchema,
        'налаштувати-привітання': GreetVerifiedUserSchema,
    },
    'economy': EconomySchema,
    'push_the_cart': PushTheCartScheme
}

async function getLowConfig() {
    return (await JSONFilePreset('config.json', {
        'commands': {},
        'economy': {
            'users': {}
        },
        'push_the_cart': {}
    }) as unknown as Low<ConfigSchema>)
}

async function getConfig() {
    return (await getLowConfig()).data as ConfigSchema
}

export const Config = {
    getLowConfig: getLowConfig,
    getConfig: getConfig
}