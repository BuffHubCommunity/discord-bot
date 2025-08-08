import {Command} from '../../Command'
import {ChatInputCommandInteraction, Client, EmbedBuilder, Guild, GuildMember, User} from 'discord.js'
import {Config} from "../../../Config";
import {UserEconomySchema} from "./EconomyCommand";

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
        const users = config['economy']['users']

        // Замінюємо користувачів з undefined, які не у спільноті.
        const validUsers = await Promise.all(
            Object.entries(users)
                .map(async ([id, balance]) => {
                    const user = await this.getUser(guild, id)
                    return user ? [id, balance] : null
                })
        )

        //

        const sortedEntries = validUsers
            .filter((entry): entry is [/* userId: */ string, /* userEconomy */ UserEconomySchema] => !!entry) // Прибираємо усіх undefined користувачів.
            .sort(([, userEconomy1], [, userEconomy2]) => userEconomy2.total_balance - userEconomy1.total_balance)

        const yourIndex: number = sortedEntries.findIndex(([userId, userEconomy]) => userId === interaction.user.id)
        const yourPlace: string = yourIndex === -1 ? '?' : String(yourIndex + 1)

        const maxUsernameLength = Math.max(...sortedEntries.slice(0, 10).map(([username]) => username.length))
        const contentArray = []

        for (const [userId, userEconomy] of sortedEntries) {
            const user = (guild.members.cache.get(userId) as GuildMember).user
            const username = (user.username || user.globalName || (`[?] ${user.id}`))

            const index = (contentArray.length + 1)
            const place: string = `${index < 10 ? ' ' : ''}${index}) `

            const padding = username.padEnd(maxUsernameLength, ' ')
            contentArray.push(`${place}${padding}\t${userEconomy.total_balance}`)

            if (contentArray.length >= 10) break
        }

        contentArray.unshift('```ansi')
        contentArray.push('```')

        const content = [
            'Можливо хтось хоче зайняти місце? <:soldier_goon:1378505616401760346>',
            contentArray.join('\n')
        ].join('\n')

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("💰 Таблиця Лідерів")
                    .setDescription(content)
                    .setColor('#4b73f5')
                    .setFooter({text: `Ви знаходитесь на ${yourPlace} місці.`})
            ]
        })

        //

        /*const keys: string = (await Promise.all(
            sortedEntries.map(async ([key], index) => {
                const member = await this.getUser(guild, key)

                if (member) {
                    return `${index + 1}) ${member.user.username || member.user.globalName}`
                } else {
                    return `${index + 1}) ${key}`
                }
            })
        )).join('\n')
        const values: string = sortedEntries.map(([, value]) => value.total_balance).join('\n')

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

        await interaction.editReply({ embeds: [embed] })*/
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