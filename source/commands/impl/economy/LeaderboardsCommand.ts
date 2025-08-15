import {Command} from '../../Command'
import {ChatInputCommandInteraction, Client, EmbedBuilder, Guild, GuildMember, time, User} from 'discord.js'
import {Config} from "../../../Config";
import {UserEconomySchema} from "./EconomyCommand";
import {Main} from "../../../Main";

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
            .sort(([, userEconomy1], [, userEconomy2]) => userEconomy2.balance - userEconomy1.balance)

        const top10 = sortedEntries.slice(0, 10)

        const yourIndex: number = sortedEntries.findIndex(([userId, userEconomy]) => userId === interaction.user.id)
        const yourPlace: string = yourIndex === -1 ? '?' : String(yourIndex + 1)

        const maxUsernameLength = Math.max(...top10.map(([username]) => username.length))
        const maxCoinLength = Math.max(...top10.map(([, userEconomy]) => String(userEconomy.balance).length))
        const maxTimeLength = Math.max(...top10.map(([, userEconomy]) => Main.millisToTime(userEconomy.voice_time_spent).length))

        const contentArray = []

        for (const [userId, userEconomy] of sortedEntries) {
            const member = (guild.members.cache.get(userId) as GuildMember)

            const index = (contentArray.length + 1)
            const place: string = `${index < 10 ? ' ' : ''}${index}) `

            const username = member.user.tag.padEnd(maxUsernameLength + 3)
            const coins = String(userEconomy.balance).padEnd(maxCoinLength + 3)
            const timeSpent = Main.millisToTime(userEconomy.voice_time_spent).padStart(maxTimeLength)

            contentArray.push(`${place}${username}${coins}${timeSpent}`)

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