import {Command} from '../Command'
import {ChatInputCommandInteraction, Client, EmbedBuilder, TextChannel} from 'discord.js'
import {Config} from '../../Config'

export type GreetVerifiedUserSchema = {
    role: { id: string }
    channel: { id: string }
    text: string
}

export class GreetVerifiedUserCommand extends Command {
    readonly name = 'налаштувати-привітання'

    async init(client: Client): Promise<void> {
        client.on('guildMemberUpdate', async (old_member, new_member) => {
            const config = await Config.getConfig()
            const schema = {
                'привітання': config['команди'][this.name]
            }

            if (!schema['привітання']) return

            const old_roles = old_member.roles.cache
            const new_roles = new_member.roles.cache

            const added_roles = new_roles.filter((role) => !old_roles.has(role.id))
            if (added_roles.size <= 0) return

            const has_verified_role = added_roles.find((role) => role.id === schema['привітання'].role.id)

            if (has_verified_role) {
                const channel = client.channels.cache.get(schema['привітання'].channel.id)
                if (!channel || !(channel instanceof TextChannel)) return

                const user = {
                    mention: `<@${new_member.id}>`
                }

                await channel.send(schema['привітання'].text.replace('{mention}', user.mention))
            }
        })
    }

    canAccept(interaction: ChatInputCommandInteraction): Promise<boolean> {
        return Promise.resolve(this.isAdministrator(interaction.member))
    }

    async accept(interaction: ChatInputCommandInteraction): Promise<void> {
        const config = await Config.getLowConfig()

        const greet_schema: GreetVerifiedUserSchema = {
            role: {
                id: (interaction.options.getRole('роль')?.id || '0')
            },
            channel: {
                id: (interaction.options.getChannel('канал')?.id || '0')
            },
            text: (interaction.options.getString('текст') || '?')
        }

        await config.update((config) => {
            config['команди']['налаштувати-привітання'] = greet_schema
        })

        const embed = new EmbedBuilder()
            .setTitle('✅ Успішно!')
            .setDescription(`Привітання буде надіслано у <#${greet_schema.channel.id}>, коли учасник отримає роль <@&${greet_schema.role.id}>.\n\`\`\`\n${greet_schema.text}\n\`\`\``)
            .setColor('#4b73f5')
            .setTimestamp()

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        })
    }

    async reject(interaction: ChatInputCommandInteraction): Promise<void> {
        const embed = new EmbedBuilder()
            .setTitle('❌ Помилка!')
            .setDescription('Ви не можете використовувати цю команду.')
            .setColor('#4b73f5')
            .setTimestamp()

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        })
    }
}