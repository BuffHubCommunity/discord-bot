import {Command} from '../../Command'
import {ChatInputCommandInteraction, Client, EmbedBuilder, GuildMember} from 'discord.js'
import {Config} from "../../../Config";

export class CasinoCommand extends Command {
    readonly name = 'казино'

    init(client: Client): void {
    }

    canAccept(interaction: ChatInputCommandInteraction): Promise<boolean> {
        return Promise.resolve(true)
    }

    async accept(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply()
        const user = (interaction.member as GuildMember).user

        const config = await Config.getConfig()
        const userId = user.id

        const deposit = interaction.options.getNumber('ставка') as number

        const userEconomy = config.economy.users[userId]

        for (let i = 0; i < 5; i++) {
            const char = (i % 2 === 1) ? '❓' : '❔'

            await editReply(deposit, char, char, char)
            await sleep(300)
        }

        const emojis = ['🍒', '🫐', '🍋', '7️⃣']
        const slots = []

        for (let i = 0; i < 3; i++) {
            await sleep(1500)

            const emoji = emojis[Math.floor(Math.random() * emojis.length)]
            slots.push(emoji)

            await editReply(deposit,
                slots[0] || '❔',
                slots[1] || '❔',
                slots[2] || '❔'
            )
        }

        async function editReply(deposit: number, slot1: string, slot2: string, slot3: string) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('🎰 Слот Машина')
                        .setDescription([
                            '```ansi',
                            `🪙 Ставка: ${deposit}`,
                            '```'
                        ].join('\n'))
                        .addFields(
                            {
                                name: '',
                                value: `\`\`\` ${slot1} \`\`\``,
                                inline: true
                            },
                            {
                                name: '',
                                value: `\`\`\` ${slot2} \`\`\``,
                                inline: true
                            },
                            {
                                name: '',
                                value: `\`\`\` ${slot3} \`\`\``,
                                inline: true
                            },
                        )
                        .setFooter({text: 'Не зараховує монетки :3'})
                        .setColor('#4b73f5')
                ]
            })
        }

        async function sleep(millis: number) {
            return new Promise((resolve) => {
                setTimeout(resolve, millis)
            })
        }

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