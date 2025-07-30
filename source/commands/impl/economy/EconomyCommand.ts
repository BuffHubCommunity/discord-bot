import {Command} from '../../Command'
import {ChatInputCommandInteraction, Client, EmbedBuilder} from 'discord.js'
import {Config} from "../../../Config";

export type EconomySchema = {
    'користувачі': { [key: string]: number }
}

export class EconomyCommand extends Command {
    readonly name = 'економіка'

    init(client: Client): void {
        client.on('messageCreate', async (message) => {
            if (message.author.bot) return

            if (message.content && message.content.length >= 10) {
                const config = await Config.getLowConfig()
                const user_id = message.author.id

                await config.update((config) => {
                    const user = config[this.name]['користувачі']
                    user[user_id] = (user[user_id] || 0) + 1
                })
            }
        })
    }

    canAccept(interaction: ChatInputCommandInteraction): Promise<boolean> {
        return Promise.resolve(true)
    }

    async accept(interaction: ChatInputCommandInteraction): Promise<void> {
        const embed = new EmbedBuilder()
            .setTitle('Економіка')
            .setDescription('Ви можете отримувати аксесуари у TF2 за активну участь у житті спільноти, отримуючи валюту "Бафи" <:soldier_thumbsup:1378127706750845071>')
            .setColor('#4b73f5')
            .setTimestamp()

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        })
    }

    reject(interaction: ChatInputCommandInteraction): Promise<void> {
        return Promise.resolve(undefined)
    }
}