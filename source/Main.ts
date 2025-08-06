import {
    Client,
    GatewayIntentBits,
    Partials,
    ChatInputCommandInteraction, Interaction, CacheType, GuildMember, EmbedBuilder, TextChannel
} from 'discord.js'
import {
    GreetVerifiedUserCommand
} from './commands/impl/GreetVerifiedUserCommand'
import {TemplateCommand} from "./commands/impl/TemplateCommand";
import {SetupVerifierCommand} from "./commands/impl/SetupVerifierCommand";
import {EconomyCommand} from "./commands/impl/economy/EconomyCommand";
import {BalanceCommand} from "./commands/impl/economy/BalanceCommand";
import {LeaderboardsCommand} from "./commands/impl/economy/LeaderboardsCommand";
import {VerifySteamProfileCommand} from "./commands/impl/VerifySteamProfileCommand";
import {Config} from "./Config";

(async () => {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.GuildPresences,
            GatewayIntentBits.GuildVoiceStates,
        ],
        partials: [Partials.Channel]
    })

    const commands = [
        new GreetVerifiedUserCommand(),
        new SetupVerifierCommand(),
        new TemplateCommand(),
        new EconomyCommand(),
        new BalanceCommand(),
        new LeaderboardsCommand(),
        new VerifySteamProfileCommand()
    ]

    client.on('interactionCreate', async (interaction: Interaction<CacheType>) => {
        if (!interaction.guild) return
        if (!(interaction instanceof ChatInputCommandInteraction)) return

        for (let command of commands) {
            if (command.isNeededCommand(interaction)) {
                const canAccept = await command.canAccept(interaction)

                if (canAccept) {
                    return await command.accept(interaction)
                } else {
                    return await command.reject(interaction)
                }
            }
        }
    })

    client.on('ready', () => {
        console.log('Бот запущений.')
    })

    await client.login(process.env.BOT_TOKEN)

    commands.forEach((command) => command.init(client))

    /*;((await (await client.guilds.fetch(process.env.GUILD_ID as string)).channels.fetch('1401556527856357436')) as TextChannel).send({
        embeds: [
            new EmbedBuilder()
                .setTitle()
                .setDescription()
                .setThumbnail()
                .setColor('#4b73f5')
        ]
    })*/
})()