import {GreetVerifiedUserCommand, GreetMember} from "./commands/impl/GreetVerifiedUserCommand"
import {JSONFilePreset} from "lowdb/node";
import {Low} from "lowdb";
import {SetupVerifier} from "./commands/impl/SetupVerifierCommand";
import {EconomySchema, UserEconomy} from "./commands/impl/economy/EconomyCommand";

export type ConfigSchema = {
    commands: {
        setupVerifier?: SetupVerifier,
        greetMember?: GreetMember
    }
    economy: {
        users: {
            [key: string]: UserEconomy
        }
        games: {
            pushTheCart?: {
                current_distance: number
                last_time_pushed: number
            },
            kingOfTheHill?: {
                last_winner_score: number,
                last_winner_id: string
            },
            captureTheIntel?: {
                last_winner_id: string
            }
        }
    },
}

const __DEFAULT_CONFIG__: ConfigSchema = {
    commands: {
        setupVerifier: undefined
    },
    economy: {
        users: {},
        games: {
            pushTheCart: undefined,
            kingOfTheHill: undefined,
            captureTheIntel: undefined
        }
    }
}

async function getLowConfig() {
    return (await JSONFilePreset('config.json', __DEFAULT_CONFIG__) as unknown as Low<ConfigSchema>)
}

async function getConfig() {
    return (await getLowConfig()).data as ConfigSchema
}

async function asyncUpdate(configModifier: (config: ConfigSchema) => Promise<boolean>) {
    const config = await getLowConfig()

    const accepted = await configModifier(config.data)
    if (!accepted) return

    await config.write()
}

async function ensureUserExists(userID: string) {
    await asyncUpdate(async (config) => {
        const userEconomy = config.economy.users[userID]
        if (userEconomy) return false

        config.economy.users[userID] = Config.createDefaultUser()
        return true
    })
}

function createDefaultUser(): UserEconomy {
    return {
        balance: 0,
        messages_sent: 0,
        voice_time_spent: 0,
        achievements: []
    }
}

export const Config = {
    getLowConfig: getLowConfig,
    getConfig: getConfig,

    asyncUpdate: asyncUpdate,
    ensureUserExists: ensureUserExists,
    createDefaultUser: createDefaultUser
}