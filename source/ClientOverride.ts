import {CacheType, Client, Interaction} from "discord.js";
import {Config} from "./Config";

type safeEventType =
    'guildMemberAddSafe' |
    'messageCreateSafe' |
    'messageDeleteSafe' |
    'guildMemberUpdateSafe' |
    'voiceStateUpdateSafe' |
    'interactionCreateSafe'

function on(client: Client, eventType: safeEventType, listener: (...args: any[]) => void): void {
    client.on(eventType, listener)
}

function overrideDiscordEvents(client: Client) {
    client.on('guildMemberAdd', async (guildMember) => {
        await Config.ensureUserExists(guildMember.id)

        client.emit('guildMemberAddSafe', guildMember)
    })

    client.on('messageCreate', async (message) => {
        await Config.ensureUserExists(message.author.id)

        client.emit('messageCreateSafe', message)
    })

    client.on('messageDelete', async (message) => {
        if (message.partial) {
            // Відсутня більшість інформації про повідомлення.
        } else {
            await Config.ensureUserExists(message.author.id)
        }

        client.emit('messageDeleteSafe', message)
    })

    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        await Config.ensureUserExists(newMember.id)

        client.emit('guildMemberUpdateSafe', oldMember, newMember)
    })

    client.on('voiceStateUpdate', async (oldState, newState) => {
        await Config.ensureUserExists(newState.id)

        client.emit('voiceStateUpdateSafe', oldState, newState)
    })

    client.on('interactionCreate', async (interaction: Interaction<CacheType>) => {
        if (!interaction.member) return

        await Config.ensureUserExists(interaction.member.user.id)

        client.emit('interactionCreateSafe', interaction)
    })
}

export const ClientOverride = {
    on: on,
    overrideDiscordEvents: overrideDiscordEvents
}