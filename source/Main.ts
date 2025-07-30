import {
    Client,
    GatewayIntentBits,
    Partials,
    ChatInputCommandInteraction, Interaction, CacheType
} from 'discord.js'
import {
    GreetVerifiedUserCommand
} from './commands/impl/GreetVerifiedUserCommand'
import {TemplateCommand} from "./commands/impl/TemplateCommand";
import {VerifierCommand} from "./commands/impl/VerifierCommand";
import {EconomyCommand} from "./commands/impl/economy/EconomyCommand";
import {BalanceCommand} from "./commands/impl/economy/BalanceCommand";
import {LeaderboardsCommand} from "./commands/impl/economy/LeaderboardsCommand";

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

    const commands = [
        new GreetVerifiedUserCommand(),
        new VerifierCommand(),
        new TemplateCommand(),
        new EconomyCommand(),
        new BalanceCommand(),
        new LeaderboardsCommand()
    ]
    commands.forEach((command) => command.init(client))

    client.on('interactionCreate', async (interaction: Interaction<CacheType>) => {
        if (!interaction.guild) return
        if (!(interaction instanceof ChatInputCommandInteraction)) return

        for (let command of commands) {
            if (command.isNeededCommand(interaction)) {
                const canAccept = await command.canAccept(interaction)

                if (canAccept) {
                    await command.accept(interaction)
                } else {
                    await command.reject(interaction)
                }
            }
        }
    })

    client.on('ready', () => {
        console.log('Бот запущений.')
    })

    await client.login(process.env.BOT_TOKEN)
})()