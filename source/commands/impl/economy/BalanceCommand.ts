import {Command} from '../../Command'
import {ChatInputCommandInteraction, Client, EmbedBuilder, GuildMember} from 'discord.js'
import {Config} from "../../../Config";
import {Main} from "../../../Main";

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
                                `🪙 ${userEconomy.balance}`,
                                '```'
                            ].join('\n'),
                            inline: false
                        },
                        {
                            name: 'Час у ГЧ',
                            value: [
                                '```ansi',
                                `⌚ ${Main.millisToTime(userEconomy.voice_time_spent)}`,
                                '```'
                            ].join('\n'),
                            inline: true
                        },
                        {
                            name: 'Повідомлення у ТЧ',
                            value: [
                                '```ansi',
                                `✉️ ${userEconomy.messages_sent}`,
                                '```'
                            ].join('\n'),
                            inline: true
                        },
                    )
                    .setColor(this.DEFAULT_COLOR)
            ]
        })
    }

    reject(interaction: ChatInputCommandInteraction): Promise<void> {
        return Promise.resolve(undefined)
    }
}