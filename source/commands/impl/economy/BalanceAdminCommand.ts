import {Command} from '../../Command'
import {ChatInputCommandInteraction, Client, EmbedBuilder, GuildMember} from 'discord.js'
import {Config} from "../../../Config";
import {Main} from "../../../Main";

export class BalanceAdminCommand extends Command {
    readonly name = 'баланс-адмін'

    init(client: Client): void {
    }

    canAccept(interaction: ChatInputCommandInteraction): Promise<boolean> {
        return Promise.resolve(this.isAdministrator(interaction.member))
    }

    async accept(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ephemeral: true})

        const guildMember = interaction.options.getUser('учасник') as unknown as GuildMember
        const action = interaction.options.getString('дія') as unknown as string
        const amount = interaction.options.getNumber('кількість') as unknown as number

        await Config.asyncUpdate(async (config) => {
            const user = config.economy.users[guildMember.id]

            user.balance =
                (action === 'plus') ? (user.balance + amount) :
                    (action === 'minus') ? (user.balance - amount) : user.balance

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('💰 Баланс')
                        .setDescription(`Баланс учасника <@${guildMember.id}> було змінено 👇 \`\`\`\n🪙 ${user.balance}\n\`\`\``)
                        .setColor(this.DEFAULT_COLOR)
                ]
            })

            return true
        })

        /*await interaction.deferReply({ephemeral: true})
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
        })*/

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

    async reject(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('❌ Помилка!')
                    .setDescription('Ви не можете використовувати цю команду.')
                    .setColor(this.DEFAULT_COLOR)
            ],
            ephemeral: true
        })
    }
}