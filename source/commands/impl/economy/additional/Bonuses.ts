import {UserEconomy} from '../EconomyCommand'
import {ClientEvents} from 'discord.js/typings'

export type Bonus = {
    name: string,
    reward: number,
    condition: (user: UserEconomy) => Promise<boolean>,
    event: ClientEvents
}