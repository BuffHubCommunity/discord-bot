import {Command} from '../../../Command'
import {ChatInputCommandInteraction, Client, EmbedBuilder, GuildMember} from 'discord.js'
import {GamblingSystem} from "./GamblingSystem";
import {Config} from "../../../../Config";
import {UserEconomy} from "../EconomyCommand";

export class DiceCommand extends Command {
    readonly name = 'казино кубики'

    readonly animationFrames = ['        🎲\n‎\n‎', '\n‎\n‎     🎲\n‎', '\n‎\n‎\n‎    🎲', '\n‎\n‎\n‎    %result%']
    readonly emojiNumbers: { [key: number]: string } = {1: '1️⃣', 2: '2️⃣', 3: '3️⃣', 4: '4️⃣', 5: '5️⃣', 6: '6️⃣'}

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

            await this.simpleReject(interaction, '🎲 Кубики', 'Ви вже приймаєте участь у казино.')
        } else {
            GamblingSystem.__PLAYERS__.add(guildMember.id)

            const bet = Math.floor(interaction.options.getNumber('число') || 0)
            const deposit = Math.floor(interaction.options.getNumber('ставка') || 0)

            if (bet < 1 || bet > 6) {
                GamblingSystem.__PLAYERS__.delete(guildMember.id)
                await interaction.deferReply({ephemeral: true})

                return await this.simpleReject(interaction, '🎲 Кубики', 'Число не може бути менше 1 та більше 6.')
            }

            if (deposit < 10) {
                GamblingSystem.__PLAYERS__.delete(guildMember.id)
                await interaction.deferReply({ephemeral: true})

                return await this.simpleReject(interaction, '🎲 Кубики', 'Ставка не може бути менше ніж 10.')
            }

            const config = await Config.getConfig()
            const userEconomy = config.economy.users[guildMember.user.id]

            if (userEconomy.balance < deposit) {
                GamblingSystem.__PLAYERS__.delete(guildMember.id)
                await interaction.deferReply({ephemeral: true})

                return await this.simpleReject(interaction, '🎲 Кубики', 'У Вас недостатньо монет для депозиту.')
            }

            //
            await interaction.deferReply()

            // Отримуємо результат.
            const diceRoll = Math.floor(Math.random() * Object.keys(this.emojiNumbers).length) + 1
            const userWon = (bet === diceRoll)
            const multiplier = 2.5

            const lostCoins = deposit
            const winCoins = Math.floor(userWon ? (deposit * multiplier) : 0)

            await Config.asyncUpdate(async (config) => {
                const userEconomy = config.economy.users[guildMember.id]

                userEconomy.balance -= lostCoins
                userEconomy.balance += winCoins

                return true
            })

            // Анімуємо (Редагуємо один фрейм двічі, бо особисто мені не подобається здвиг повідомлення через тег "(змінено)").
            await this.editReply(interaction, this.animationFrames[0], deposit)

            for (let animationFrame of this.animationFrames) {
                // Перевірка на останній фрейм.
                const announceResults = animationFrame === this.animationFrames[this.animationFrames.length - 1]

                await this.editReply(
                    interaction,
                    animationFrame.replace('%result%', this.emojiNumbers[diceRoll]),
                    deposit
                )

                await this.sleep(1.5)

                if (announceResults) {
                    // Це останній фрейм, тому відображаємо результати поверх останнього фрейму.
                    const resultDiff = userWon ? `-${lostCoins}\n+${winCoins}` : `-${lostCoins}`

                    await this.editReply(
                        interaction,
                        animationFrame.replace('%result%', this.emojiNumbers[diceRoll]),
                        deposit,
                        resultDiff
                    )
                }
            }

            GamblingSystem.__PLAYERS__.delete(guildMember.id)
        }
    }

    reject(interaction: ChatInputCommandInteraction): Promise<void> {
        return Promise.resolve(undefined)
    }

    async sleep(seconds: number): Promise<void> {
        return await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
    }

    async editReply(interaction: ChatInputCommandInteraction, animationFrame: string, deposit: number, results?: string) {
        const fields = [{
            name: '',
            value: `\`\`\`\n${animationFrame}\n\`\`\``,
            inline: false
        }]

        if (results) {
            if (results) {
                fields.push({
                    name: '',
                    value: `\`\`\`diff\n${results}\n\`\`\``,
                    inline: false
                })
            }
        }

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('🎲 Кубики')
                    .setDescription(`\`\`\`🪙 Ставка: ${deposit}\`\`\``)
                    .addFields(fields)
                    .setColor(this.DEFAULT_COLOR)
            ]
        })
    }
}