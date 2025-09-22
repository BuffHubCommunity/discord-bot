import {Command} from '../Command'
import {Channel, ChatInputCommandInteraction, Client, EmbedBuilder, GuildMember, Message, TextChannel} from 'discord.js'
import {Config} from '../../Config'
import {ClientOverride} from "../../ClientOverride";

export type GreetMember = {
    role_id: string,
    channel_id: string,
    text: string
}

export class GreetVerifiedUserCommand extends Command {
    readonly name = 'налаштувати-привітання'

    async init(client: Client): Promise<void> {
        ClientOverride.on(client, 'guildMemberUpdateSafe', async (oldMember: GuildMember, newMember: GuildMember) => {
            const config = await Config.getConfig()

            const greetMember = config.commands.greetMember
            if (!greetMember) return

            const oldRoles = oldMember.roles.cache
            const newRoles = newMember.roles.cache

            const addedRoles = newRoles.filter((role) => !oldRoles.has(role.id))
            if (addedRoles.size <= 0) return

            const isVerified = addedRoles.find((role) => role.id === greetMember.role_id)

            if (isVerified) {
                const channel = client.channels.cache.get(greetMember.channel_id) as Channel
                if (!channel || !(channel instanceof TextChannel)) return

                await channel.send(
                    greetMember.text.replace('{mention}', `<@${newMember.id}>`)
                )
            }
        })
    }

    canAccept(interaction: ChatInputCommandInteraction): Promise<boolean> {
        return Promise.resolve(this.isAdministrator(interaction.member))
    }

    async accept(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ephemeral: true})

        const greetMember: GreetMember = {
            role_id: interaction.options.getRole('роль')?.id || '?',
            channel_id: (interaction.options.getChannel('канал')?.id || '?'),
            text: (interaction.options.getString('текст') || '?')
        }

        if (greetMember.role_id === '?' || greetMember.channel_id === '?' || greetMember.text === '?') {
            // this.simpleReject(interaction)
        } else {
            await Config.asyncUpdate(async (config) => {
                config.commands.greetMember = greetMember

                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('✅ Успішно!')
                            .setDescription(`Привітання буде надіслано у <#${greetMember.channel_id}>, коли учасник отримає роль <@&${greetMember.role_id}>.\n\`\`\`\n${greetMember.text}\n\`\`\``)
                            .setColor('#4b73f5')
                    ]
                })

                return true
            })
        }
    }

    async reject(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('❌ Помилка!')
                    .setDescription('Ви не можете використовувати цю команду.')
                    .setColor('#4b73f5')
            ],
            ephemeral: true
        })
    }
}