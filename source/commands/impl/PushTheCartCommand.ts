import {Command} from "../Command"
import {ChannelType, ChatInputCommandInteraction, Client, Message} from 'discord.js'
import {Main} from "../../Main"
import {Config} from "../../Config";

export type PushTheCartScheme = {
    current_distance: number
    last_time_pushed: number
}

export class PushTheCartCommand extends Command {
    readonly name = 'undefined'
    readonly aliases = [
        ['рухайте', 'рухаю', 'пуште', 'пушу', 'двигайте', 'двигаю', 'штовхайте', 'штовхаю', 'товкайте', 'товкаю'],
        ['вагонетку', 'пейлоад', 'пейлоуд', 'вагон']
    ]

    init(client: Client): void {
        const possibleAliases: string[] = []
        this.aliases[0].forEach((a) => {
            this.aliases[1].forEach((b) => {
                possibleAliases.push(a + ' ' + b)
            })
        })

        client.on('messageCreateSafe', async (message: Message) => {
            if (!message.content) return
            if (message.author?.bot) return
            if (message.channel.type !== ChannelType.GuildText) return

            await Main.verifyUserIntegrity(message.author.id)

            message.content = message.content
                .replace(/\s+/g, ' ')
                .toLowerCase()
                .trim()

            const isPushing = possibleAliases.find((alias) => message.content.includes(alias))
            if (!isPushing) return

            if (isPushing) {
                await Config.asyncUpdate(async (config) => {
                    const pushDistance = Math.floor(Math.random() * 15) + 3

                    const user = config.economy.users[message.author.id]
                    const games = config.economy.games

                    games.pushTheCart = games.pushTheCart ? games.pushTheCart : {
                        current_distance: 0,
                        last_time_pushed: 0
                    }

                    const oneHour = 60 * 60 * 1000
                    const timePassed = (Date.now() - games.pushTheCart.last_time_pushed) >= oneHour
                    if (!timePassed) return false

                    games.pushTheCart.last_time_pushed = Date.now()
                    games.pushTheCart.current_distance += pushDistance
                    user.balance += pushDistance

                    const pushingCartEmoji = '<:pushing_the_cart_1:1407868049649963128><:pushing_the_cart_1:1407868062547447899>'
                    const totalDistance = games.pushTheCart.current_distance.toLocaleString('en-US')
                    const discordTimestamp = `<t:${Math.floor((Date.now() + oneHour) / 1000)}:R>`

                    await message.reply({
                        content: `${pushingCartEmoji} Вагонетка проїхала **${pushDistance}** метрів (${totalDistance} загалом).\n-# Ворожий шпигун перестане блокувати вагонетку ${discordTimestamp}.`
                    })

                    return true
                })

                /*
                Можна пушити через 4 години після останнього пушу
                Наступні 16 годин вагонетка стоїть, після чого рухається назад та пише про це.
                Наступні кожні 4 години вона їде назад
                 */
            }
        })
    }

    accept(interaction: ChatInputCommandInteraction): Promise<any> {
        return Promise.resolve(undefined)
    }

    canAccept(interaction: ChatInputCommandInteraction): Promise<boolean> {
        return Promise.resolve(false)
    }

    reject(interaction: ChatInputCommandInteraction): Promise<any> {
        return Promise.resolve(undefined)
    }
}
