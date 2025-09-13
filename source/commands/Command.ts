import {
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder,
    GuildMember,
    PermissionResolvable,
    PermissionsBitField
} from 'discord.js'

export abstract class Command {
    readonly DEFAULT_COLOR = '#4b73f5'

    readonly abstract name: string

    abstract init(client: Client): void

    abstract canAccept(interaction: ChatInputCommandInteraction): Promise<boolean>

    abstract accept(interaction: ChatInputCommandInteraction): Promise<any>

    abstract reject(interaction: ChatInputCommandInteraction): Promise<any>

    async simpleReject(interaction: ChatInputCommandInteraction, title: string, reason: string): Promise<any> {
        return Promise.resolve(await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(title)
                    .setDescription(reason)
                    .setColor(this.DEFAULT_COLOR)
                    .setTimestamp()
            ]
        }))
    }

    hasPermission(
        member: (GuildMember | any),
        permission: PermissionResolvable
    ): boolean {
        if (!(member instanceof GuildMember)) {
            console.log('Користувач не є GuildMember.')
            return false
        }

        return member.permissions.has(permission)
    }

    hasRole(
        member: (GuildMember | any),
        role_id: string
    ): boolean {
        if (!(member instanceof GuildMember)) {
            console.log('Користувач не є GuildMember.')
            return false
        }

        return member.roles.cache.has(role_id)
    }

    isAdministrator(member: (GuildMember | any)) {
        return this.hasPermission(member, PermissionsBitField.Flags.Administrator)
    }


    userWantsToExecuteThisCommand(interaction: ChatInputCommandInteraction): boolean {
        const fullCommand = [
            interaction.commandName,
            interaction.options.getSubcommandGroup(false),
            interaction.options.getSubcommand(false)
        ]
            .map((part) => part ? part : null)
            .filter((part) => part != null)
            .join(' ')

        return fullCommand === this.name
    }
}