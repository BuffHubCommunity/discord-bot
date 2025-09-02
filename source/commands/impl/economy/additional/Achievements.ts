import {UserEconomy} from '../EconomyCommand'
import {ClientEvents} from 'discord.js'

export type Achievement = {
    id: string,
    name: string,
    reward: number,
    condition: (user: UserEconomy) => Promise<boolean>,
    event: ClientEvents
}

const achievements = []
