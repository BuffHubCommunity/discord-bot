import {Command} from '../../Command'
import {ChatInputCommandInteraction, Client, EmbedBuilder, GuildMember} from 'discord.js'
import {Config} from "../../../Config";

export class CasinoCommand extends Command {
    readonly name = 'казино'
    readonly emojis = ['🍒', '🫐', '🍋', '7️⃣']

    readonly currentPlayers: Set<string> = new Set<string>()

    init(client: Client): void {
    }

    canAccept(interaction: ChatInputCommandInteraction): Promise<boolean> {
        return Promise.resolve(true)
    }

    async accept(interaction: ChatInputCommandInteraction): Promise<void> {
        const guildMember = (interaction.member as GuildMember)

        if (this.currentPlayers.has(guildMember.id)) {
            await interaction.deferReply({ephemeral: true})
            await this.simpleReject(interaction, '🎰 Слот Машина', 'Ви вже приймаєте участь у казино.')
        } else {
            this.currentPlayers.add(guildMember.id)
            await interaction.deferReply()

            const deposit = Math.floor(interaction.options.getNumber('ставка') || 0)

            if (deposit < 50) {
                this.currentPlayers.delete(guildMember.id)
                await this.simpleReject(interaction, '🎰 Слот Машина', 'Ставка не може бути менше ніж 50.')
            } else {
                const config = await Config.getConfig()

                const memberEconomy = config.economy.users[guildMember.user.id]

                if (memberEconomy.balance >= deposit) {
                    // Крутимо одразу щоб уникнути проблем з абузом системи, анімуємо пізніше.
                    const slots: string[] = []

                    for (let i = 0; i < 3; i++) {
                        const emoji = this.emojis[Math.floor(Math.random() * this.emojis.length)]
                        slots.push(emoji)
                    }

                    const multiplier = getSlotMultiplier(slots)

                    await Config.asyncUpdate(async (config) => {
                        const memberEconomy = config.economy.users[guildMember.user.id]

                        memberEconomy.balance -= deposit
                        memberEconomy.balance += Math.floor((deposit * multiplier) - deposit)

                        return true
                    })

                    // Анімуємо.
                    await editReply(deposit, '❔', '❔', '❔')

                    await new Promise((resolve) => setTimeout(resolve, 2_000))

                    for (let i = 0; i < slots.length; i++) {
                        await new Promise((resolve) => setTimeout(resolve, 1_500))

                        await editReply(deposit,
                            i >= 0 ? slots[0] : '❔',
                            i >= 1 ? slots[1] : '❔',
                            i >= 2 ? slots[2] : '❔'
                        )
                    }

                    await new Promise((resolve) => setTimeout(resolve, 1_500))

                    if (multiplier === 1) {
                        await editReply(deposit,
                            slots[0] || '❔',
                            slots[1] || '❔',
                            slots[2] || '❔',
                            `Ви програли ${deposit} монет.`
                        )
                    } else {
                        const win = Math.floor((deposit * multiplier) - deposit)

                        await editReply(deposit,
                            slots[0] || '❔',
                            slots[1] || '❔',
                            slots[2] || '❔',
                            (deposit === win ? 'Ви нічого не програли' : `Ви виграли ${win} монет.`)
                        )
                    }

                    this.currentPlayers.delete(guildMember.id)
                } else {
                    this.currentPlayers.delete(guildMember.id)
                    await this.simpleReject(interaction, '🎰 Слот Машина', 'У Вас недостатньо монет для депозиту.')
                }
            }
        }

        async function editReply(deposit: number, slot1: string, slot2: string, slot3: string, footer?: string) {
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
                        .setFooter({text: footer || ' '})
                        .setColor('#4b73f5')
                ]
            })
        }

        function getSlotMultiplier(slots: String[]): number {
            const [a, b, c] = slots

            let emoji

            // 3
            if (a === b && b === c) emoji = a

            switch (emoji) {
                case '7️⃣': return 15
                case '🍒': return 10
                case '🫐': return 7.5
                case '🍋': return 5
            }

            // 2
            if (a === b) emoji = a
            if (b === c) emoji = b
            if (c === a) emoji = c

            if (emoji) {
                switch (emoji) {
                    case '7️⃣': return 5
                    case '🍒': return 3
                    case '🫐': return 2
                    case '🍋': return 1.5
                }
            }

            return 1
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