import {Command} from '../../Command'
import {ChatInputCommandInteraction, Client, EmbedBuilder, Guild, GuildMember} from 'discord.js'
import {Config} from "../../../Config";

export class LeaderboardsCommand extends Command {
    readonly name = 'таблиця-лідерів'

    init(client: Client): void {
    }

    canAccept(interaction: ChatInputCommandInteraction): Promise<boolean> {
        return Promise.resolve(true)
    }

    async accept(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply()

        const guild = (interaction.guild as Guild) // Ніколи не undefined, перевіряємо у Main.ts.

        const config = await Config.getConfig()
        const users = config['економіка']['користувачі']

        // Видаляємо учасників, яких немає у спільноті, та залишаємо своїх.
        const valid_users = await Promise.all(
            Object.entries(users)
                .map(async ([id, balance]) => {
                    const user = await this.getUser(guild, id)
                    return user ? [id, balance] : null
                })
        )

        //
        const sorted_entries = valid_users
            .filter((entry): entry is [string, number] => !!entry)
            .map((entry) => entry)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)

        const keys: string = (await Promise.all(
            sorted_entries.map(async ([key], index) => {
                const member = await this.getUser(guild, key)

                if (member) {
                    return `${index + 1}) ${member.user.username || member.user.globalName}`
                } else {
                    return `${index + 1}) ${key}`
                }
            })
        )).join('\n')
        const values: string = sorted_entries.map(([, value]) => value).join('\n')

        const embed = new EmbedBuilder()
            .setTitle("💰 Таблиця Лідерів")
            .setDescription("Можливо хтось хоче зайняти місце? <:soldier_goon:1378505616401760346>")
            .addFields(
                {
                    name: 'Місце & Нікнейм',
                    value: '```\n' + keys + '```',
                    inline: true
                },
                {
                    name: 'Баланс',
                    value: '```\n' + values + '```',
                    inline: true
                }
            )
            .setColor('#4b73f5')
            .setTimestamp()

        await interaction.editReply({ embeds: [embed] })
    }

    reject(interaction: ChatInputCommandInteraction): Promise<void> {
        return Promise.resolve(undefined)
    }

    async getUser(guild: Guild, id: string) {
        const member = guild.members.cache.get(id)
        if (member) return member

        try {
            return await guild.members.fetch(id)
        } catch (error) {
            return undefined
        }
    }
}