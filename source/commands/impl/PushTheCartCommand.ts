import {Command} from "../Command"
import {ChannelType, ChatInputCommandInteraction, Client} from 'discord.js'
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

        client.on('messageCreate', async (message) => {
            if (!message.content) return
            if (message.author?.bot) return
            if (message.channel.type !== ChannelType.GuildText) return

            await Main.verifyUserIntegrity(message.author.id)

            message.content = message.content
                .replace(/\s+/g, ' ')
                .toLowerCase()
                .trim()

            const isPushing = possibleAliases.find((alias) => message.content.includes(alias))

            if (isPushing) {
                const config = await Config.getLowConfig()

                const pushDistance = Math.floor(Math.random() * 15) + 3
                const pushTheCart = config.data.push_the_cart

                if ((Date.now() - pushTheCart.last_time_pushed) >= (60 * 60 * 1000)) {
                    pushTheCart.current_distance = (!pushTheCart.current_distance ? 0 : pushTheCart.current_distance)
                    pushTheCart.last_time_pushed = Date.now()

                    pushTheCart.current_distance += pushDistance

                    await message.reply({
                        content: `<:pushing_the_cart_1:1407868049649963128><:pushing_the_cart_1:1407868062547447899> Вагонетка проїхала **${pushDistance}** метрів (${pushTheCart.current_distance.toLocaleString('en-US')} загалом).`
                    })

                    await config.write()
                }

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
