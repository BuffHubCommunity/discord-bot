import {ChatInputCommandInteraction, Client, GuildMember, PermissionResolvable, PermissionsBitField} from 'discord.js'

export abstract class Command {
    readonly abstract name: string

    abstract init(client: Client): void

    isNeededCommand(interaction: ChatInputCommandInteraction): boolean {
        return interaction.commandName === this.name
    }

    abstract canAccept(interaction: ChatInputCommandInteraction): Promise<boolean>

    abstract accept(interaction: ChatInputCommandInteraction): Promise<void>
    abstract reject(interaction: ChatInputCommandInteraction): Promise<void>

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
}