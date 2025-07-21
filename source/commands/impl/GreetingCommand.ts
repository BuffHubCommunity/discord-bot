import {Config} from '../../Config'

export type GreetingSchema = {
    role_id: string,
    channel_id: string,
    text: string
}

import {Command} from '../Command'
import {ChatInputCommandInteraction, Client, EmbedBuilder, TextChannel} from 'discord.js'

export class GreetingCommand extends Command {
    name = 'налаштувати-привітання'
    admin_only = true

    async init(client: Client): Promise<void> {
        client.on('guildMemberUpdate', async (old_member, new_member) => {
            const greeting_schema = (await Config.getConfig()).data.commands['налаштувати-привітання']
            if (!greeting_schema) return

            const old_roles = old_member.roles.cache
            const new_roles = new_member.roles.cache

            const added_roles = new_roles.filter((role) => !old_roles.has(role.id))
            if (added_roles.size <= 0) return

            const has_needed_role = added_roles.find((role) => role.id === greeting_schema.role_id)

            if (has_needed_role) {
                const global_chat = client.channels.cache.get(greeting_schema.channel_id)

                if (!global_chat || !(global_chat instanceof TextChannel)) return

                const user = {
                    mention: `<@${new_member.id}>`
                }

                await global_chat.send(greeting_schema.text.replace('{mention}', user.mention))
            }
        })
    }

    async execute(interaction: ChatInputCommandInteraction) {
        const greeting_config: GreetingSchema = {
            role_id: interaction.options.getRole('роль')?.id || '0',
            channel_id: interaction.options.getChannel('канал')?.id || '0',
            text: interaction.options.getString('текст') || '?'
        }

        await (await Config.getConfig()).update((config) => {
            config.commands['налаштувати-привітання'] = greeting_config
        })

        const embed = new EmbedBuilder()
            .setTitle('✅ Успішно!')
            .setDescription(`Привітання буде надіслано у <#${greeting_config.channel_id}>, коли учасник отримає роль <@&${greeting_config.role_id}>.\n\`\`\`\n${greeting_config.text}\n\`\`\``)
            .setColor('#4b73f5')
            .setTimestamp()

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        })
    }
}