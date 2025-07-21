import {
    Client,
    GatewayIntentBits,
    Partials,
    ChatInputCommandInteraction, Interaction, CacheType
} from 'discord.js'
import {
    GreetingCommand
} from './commands/impl/GreetingCommand'
import {VerificationCommand} from "./commands/impl/VerificationCommand";

(async () => {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.GuildPresences
        ],
        partials: [Partials.Channel]
    })

    const commands = [new GreetingCommand(), new VerificationCommand()]
    commands.forEach((command) => command.init(client))

    client.on('ready', () => {
        console.log('Бот запущений.')
    })

    client.on('interactionCreate', async (interaction: Interaction<CacheType>) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) return

        for (let command of commands) {
            if (await command.canDispatch(interaction)) {
                await command.execute(interaction)
                break
            }
        }
    })

    await client.login(process.env.BOT_TOKEN)
})()

// адмін                /доступ-до-бота *роль*
// адмін/окрема роль    /привітання *роль* *канал* *текст*
// усі                  /сервер-тф