import {Config} from '../../Config'
import {Command} from '../Command'
import {ChatInputCommandInteraction, Client, EmbedBuilder} from 'discord.js'

export type SetupVerifier = {
    role_id: string
}

export class SetupVerifierCommand extends Command {
    readonly name = 'налаштувати-вартового'

    async init(client: Client): Promise<void> {}

    canAccept(interaction: ChatInputCommandInteraction): Promise<boolean> {
        return Promise.resolve(this.isAdministrator(interaction.member))
    }

    async accept(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ephemeral: true})

        const config = await Config.getLowConfig()

        const verifier: SetupVerifier = {
            role_id: (interaction.options.getRole('роль')?.id || '0')
        }

        await config.update((config) => {
            config.commands.setupVerifier = verifier
        })

        const embed = new EmbedBuilder()
            .setTitle('✅ Успішно!')
            .setDescription(`Тепер <@&${verifier.role_id}> буде перевіряти заявки від учасників на вступ до сервера.`)
            .setColor('#4b73f5')
            .setTimestamp()

        await interaction.editReply({
            embeds: [embed]
        })
    }

    async reject(interaction: ChatInputCommandInteraction): Promise<void> {
        const embed = new EmbedBuilder()
            .setTitle('❌ Помилка!')
            .setDescription('Ви не можете використовувати цю команду.')
            .setColor('#4b73f5')

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        })
    }
}