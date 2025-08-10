import {Command} from '../../Command'
import {ChatInputCommandInteraction, Client, EmbedBuilder, GuildMember} from 'discord.js'
import {Config} from "../../../Config";

export class BalanceCommand extends Command {
    readonly name = 'баланс'

    init(client: Client): void {
    }

    canAccept(interaction: ChatInputCommandInteraction): Promise<boolean> {
        return Promise.resolve(true)
    }

    async accept(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ephemeral: true})
        const user = (interaction.member as GuildMember).user

        const config = await Config.getConfig()
        const userId = user.id

        const userEconomy = config.economy.users[userId]

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('💰 Баланс')
                    .addFields(
                        {
                            name: 'Мій Баланс',
                            value: [
                                '```ansi',
                                `🪙 ${userEconomy.total_balance}`,
                                '```'
                            ].join('\n'),
                            inline: false
                        },
                        {
                            name: 'Час у ГЧ',
                            value: [
                                '```ansi',
                                `⌚ ${this.millisToTime(userEconomy.total_voice_time)}`,
                                '```'
                            ].join('\n'),
                            inline: true
                        },
                        {
                            name: 'Повідомлення у ТЧ',
                            value: [
                                '```ansi',
                                `✉️ ${userEconomy.total_messages}`,
                                '```'
                            ].join('\n'),
                            inline: true
                        },
                    )
                    .setColor(this.DEFAULT_COLOR)
            ]
        })

        /*await interaction.deferReply({ephemeral: true})

        const config = await Config.getConfig()
        const balance =  config['economy']['users'][(interaction.member as GuildMember).user.id] || 0

        const embed = new EmbedBuilder()
            .setTitle('💰 Баланс')
            .setDescription(`Ваш поточний баланс: \`\`\`${balance.total_balance}\`\`\``)
            .setColor('#4b73f5')

        await interaction.editReply({
            embeds: [embed]
        })*/
    }

    reject(interaction: ChatInputCommandInteraction): Promise<void> {
        return Promise.resolve(undefined)
    }

    millisToTime(millis: number): string {
        const totalSeconds = Math.floor(millis / 1000)

        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)

        return `${hours}г ${minutes}хв`
    }
}