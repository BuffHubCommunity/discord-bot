import {Command} from '../../Command'
import {ChatInputCommandInteraction, Client, EmbedBuilder, GuildMember} from 'discord.js'
import {Config} from "../../../Config";
export class BalanceCommand extends Command {
    readonly name = 'баланс'

    init(client: Client): void {}

    canAccept(interaction: ChatInputCommandInteraction): Promise<boolean> {
        return Promise.resolve(true)
    }

    async accept(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ephemeral: true})

        const config = await Config.getConfig()
        const balance =  config['economy']['users'][(interaction.member as GuildMember).user.id] || 0

        const embed = new EmbedBuilder()
            .setTitle('💰 Баланс')
            .setDescription(`Ваш поточний баланс: \`\`\`${balance.total_balance}\`\`\``)
            .setColor('#4b73f5')

        await interaction.editReply({
            embeds: [embed]
        })
    }

    reject(interaction: ChatInputCommandInteraction): Promise<void> {
        return Promise.resolve(undefined)
    }
}