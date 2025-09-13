import {Command} from '../../../Command'
import {ChatInputCommandInteraction, Client, EmbedBuilder, GuildMember} from 'discord.js'
import {GamblingSystem} from "./GamblingSystem";

export class DiceCommand extends Command {
    readonly name = 'казино кубики'

    readonly currentPlayers: Set<string> = new Set<string>()

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
            await interaction.deferReply()

            const deposit = Math.floor(interaction.options.getNumber('ставка') || 0)
            const result = '7️⃣'

            const array = [
                `\`\`\`\n      🎲      \n\`\`\``,
                `\`\`\`\n     🎲🎲     \n\`\`\``,
                `\`\`\`\n    🎲🎲🎲    \n\`\`\``,
                `\`\`\`\n      ${result}      \n\`\`\``
            ]

            for (let string of array) {
                await new Promise((resolve) => setTimeout(resolve, 1000))

                const embed = new EmbedBuilder()
                    .setTitle('🎲 Кубики')
                    .setDescription(`\`\`\`🪙 Ставка: ${deposit}\`\`\``)
                    .addFields(
                        {
                            name: "",
                            value: string,
                            inline: false
                        },
                    );

                await interaction.editReply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setTitle('🎲 Кубики')
                .setDescription(`\`\`\`🪙 Ставка: ${deposit}\`\`\``)
                .addFields(
                    {
                        name: "",
                        value: "```\n      7️⃣      \n```",
                        inline: false
                    },
                ).setFooter({text: 'Тестова функція, монети не зараховуються.'})

            await interaction.editReply({ embeds: [embed] });

            GamblingSystem.__PLAYERS__.delete(guildMember.id)
        }
    }

    reject(interaction: ChatInputCommandInteraction): Promise<void> {
        return Promise.resolve(undefined)
    }


}