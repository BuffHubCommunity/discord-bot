import {UserEconomySchema} from '../EconomyCommand'
import {ClientEvents} from 'discord.js/typings'

export type Bonus = {
    name: string,
    reward: number,
    condition: (user: UserEconomySchema) => Promise<boolean>,
    event: ClientEvents
}