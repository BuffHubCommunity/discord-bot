import {ChatInputCommandInteraction, Client, GuildMember, PermissionsBitField} from 'discord.js'

export abstract class Command {
    abstract name: string;
    abstract admin_only: boolean;

    abstract init(
        client: Client
    ): Promise<void>

    abstract execute(
        interaction: ChatInputCommandInteraction
    ): Promise<void>

    async canDispatch(interaction: ChatInputCommandInteraction): Promise<boolean> {
        if (interaction.commandName === this.name) {
            if (this.admin_only) {
                if (!(interaction.member instanceof GuildMember)) {
                    return false
                }

                if (interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    return true
                } else {
                    await interaction.reply({
                        content: 'nuh uh <:scout:1337132860410167366>',
                        ephemeral: true
                    })

                    return false
                }
            } else {
                return true
            }
        } else {
            return false
        }
    }
}