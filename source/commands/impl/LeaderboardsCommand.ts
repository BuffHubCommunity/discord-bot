import {Command} from '../Command'
import {ChatInputCommandInteraction, Client, EmbedBuilder, Guild, GuildMember} from 'discord.js'
import {Config} from "../../Config";
export class LeaderboardsCommand extends Command {
    readonly name = 'таблиця-лідерів'

    init(client: Client): void {}

    canAccept(interaction: ChatInputCommandInteraction): Promise<boolean> {
        return Promise.resolve(true)
    }

    async accept(interaction: ChatInputCommandInteraction): Promise<void> {
        const config = await Config.getConfig()
        const users =  config['економіка']['користувачі']

        const sortedEntries = Object.entries(users)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)

        const keys: string = sortedEntries.map(([key], index) => {
            const member = (interaction.guild as Guild).members.cache.get(key)

            if (member) {
                return ((index + 1) + ') ' + (member.user.username || member.user.globalName))
            } else {
                return ((index + 1) + ') ' + key)
            }
        }).join('\n')
        const values: string = sortedEntries.map(([, value]) => value).join('\n')

        const embed = new EmbedBuilder()
            .setTitle("💰 Таблиця Лідерів")
            .setDescription("Можливо хтось хоче зайняти місце? <:soldier_goon:1378505616401760346>")
            .addFields(
                {
                    name: "Місце & Нікнейм",
                    value: keys,
                    inline: true
                },
                {
                    name: "Баланс",
                    value: values,
                    inline: true
                },
            )
            .setColor('#4b73f5')
            .setTimestamp()

        await interaction.reply({
            embeds: [embed],
            ephemeral: false
        })
    }

    reject(interaction: ChatInputCommandInteraction): Promise<void> {
        return Promise.resolve(undefined)
    }
}