import {Command} from '../../../Command'
import {ChatInputCommandInteraction, Client, EmbedBuilder, GuildMember} from 'discord.js'
import {Config} from "../../../../Config";
import {GamblingSystem} from "./GamblingSystem";

export class CasinoCommand extends Command {
    readonly name = 'казино слот-машина'
    readonly emojis = ['🍋', '🫐', '🍓', '🍒', '🍉', '7️⃣', '👑']

    init(client: Client): void {
    }

    canAccept(interaction: ChatInputCommandInteraction): Promise<boolean> {
        return Promise.resolve(true)
    }

    async accept(interaction: ChatInputCommandInteraction): Promise<void> {
        const guildMember = (interaction.member as GuildMember)

        if (GamblingSystem.__PLAYERS__.has(guildMember.id)) {
            // Гравець сам видалиться зі списку після програття анімації.
            // GamblingSystem.__PLAYERS__.add(guildMember.id)
            await interaction.deferReply({ephemeral: true})

            await this.simpleReject(interaction, '🎰 Слот Машина', 'Ви вже приймаєте участь у казино.')
        } else {
            GamblingSystem.__PLAYERS__.add(guildMember.id)

            const deposit = Math.floor(interaction.options.getNumber('ставка') || 0)

            if (deposit < 50) {
                GamblingSystem.__PLAYERS__.delete(guildMember.id)
                await interaction.deferReply({ephemeral: true})

                await this.simpleReject(interaction, '🎰 Слот Машина', 'Ставка не може бути менше ніж 50.')
            } else {
                const config = await Config.getConfig()
                const userEconomy = config.economy.users[guildMember.user.id]

                if (userEconomy.balance < deposit) {
                    GamblingSystem.__PLAYERS__.delete(guildMember.id)
                    await interaction.deferReply({ephemeral: true})

                    await this.simpleReject(interaction, '🎰 Слот Машина', 'У Вас недостатньо монет для депозиту.')
                } else {
                    await interaction.deferReply()

                    // Отримуємо результат зараз, анімуємо пізніше.
                    const slots: string[] = []

                    for (let i = 0; i < 3; i++) {
                        const emoji = this.emojis[Math.floor(Math.random() * this.emojis.length)]
                        slots.push(emoji)
                    }

                    // Вираховуємо суму, та зберігаємо у конфіг.
                    const multiplier = getSlotMultiplier(slots)

                    await Config.asyncUpdate(async (config) => {
                        const memberEconomy = config.economy.users[guildMember.user.id]

                        memberEconomy.balance -= deposit
                        memberEconomy.balance += Math.floor((deposit * multiplier) - deposit)

                        return true
                    })

                    // Анімуємо.
                    await editReply(deposit, '❔', '❔', '❔')
                    await sleep(2.0)

                    for (let i = 0; i < slots.length; i++) {
                        await sleep(1.5)

                        await editReply(deposit,
                            i >= 0 ? slots[0] : '❔',
                            i >= 1 ? slots[1] : '❔',
                            i >= 2 ? slots[2] : '❔'
                        )
                    }

                    await sleep(1.5)

                    const win = Math.floor((deposit * multiplier) - deposit)
                    const result = (multiplier === 1) ? `-${deposit}` : `-${deposit}\n+${win}`

                    await editReply(deposit,
                        slots[0] || '❔',
                        slots[1] || '❔',
                        slots[2] || '❔',
                        result
                    )

                    GamblingSystem.__PLAYERS__.delete(guildMember.id)
                }
            }
        }

        async function sleep(seconds: number) {
            return await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
        }

        async function editReply(deposit: number, slot1: string, slot2: string, slot3: string, results?: string) {
            const fields = [
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
                }
            ]

            if (results) {
                fields.push({
                    name: '',
                    value: `\`\`\`diff\n${results}\n\`\`\``,
                    inline: false
                })
            }

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('🎰 Слот Машина')
                        .setDescription([
                            '```ansi',
                            `🪙 Ставка: ${deposit}`,
                            '```'
                        ].join('\n'))
                        .addFields(fields)
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
                case '🍋': return 5.00
                case '🫐': return 5.00
                case '🍓': return 7.00
                case '🍒': return 8.00
                case '🍉': return 9.00
                case '7️⃣': return 10.00
                case '👑': return 10.00
            }

            // 2
            if (a === b) emoji = a
            if (b === c) emoji = b
            if (c === a) emoji = c

            // '🍋', '🫐', '🍓', '🍒', '🍉', '7️⃣', '👑'

            if (emoji) {
                switch (emoji) {
                    case '🍋': return 1.50
                    case '🫐': return 1.75
                    case '🍓': return 2.00
                    case '🍒': return 3.00
                    case '🍉': return 4.00
                    case '7️⃣': return 5.00
                    case '👑': return 5.00
                }
            }

            return 1
        }
    }

    reject(interaction: ChatInputCommandInteraction): Promise<void> {
        return Promise.resolve(undefined)
    }
}