import {Config} from '../../Config'

export type GuardRoleSchema = {
    role_id: string
}

import {Command} from '../Command'
import {ChatInputCommandInteraction, Client, EmbedBuilder, TextChannel} from 'discord.js'

export class GuardRoleCommand extends Command {
    name = 'налаштувати-вартового'
    admin_only = true

    async init(client: Client): Promise<void> {}

    async execute(interaction: ChatInputCommandInteraction) {
        const guard_role_config: GuardRoleSchema = {
            role_id: interaction.options.getRole('роль')?.id || '0'
        }

        await (await Config.getConfig()).update((config) => {
            config.commands['налаштувати-вартового'] = guard_role_config
        })

        const embed = new EmbedBuilder()
            .setTitle('✅ Успішно!')
            .setDescription(`Тепер <@&${guard_role_config.role_id}> буде перевіряти заявки від учасників на вступ до сервера.`)
            .setColor('#4b73f5')
            .setTimestamp()

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        })
    }
}