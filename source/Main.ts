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
import {EconomyCommand, UserEconomySchema} from "./commands/impl/economy/EconomyCommand";
import {BalanceCommand} from "./commands/impl/economy/BalanceCommand";
import {LeaderboardsCommand} from "./commands/impl/economy/LeaderboardsCommand";
import {VerifySteamProfileCommand} from "./commands/impl/VerifySteamProfileCommand";
import {Config} from "./Config";
import {CasinoCommand} from "./commands/impl/economy/CasinoCommand";

(async () => {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.GuildPresences,
            GatewayIntentBits.GuildVoiceStates
        ],
        partials: [Partials.Channel]
    })

    const commands = [
        new GreetVerifiedUserCommand(),
        new SetupVerifierCommand(),
        new TemplateCommand(),
        new VerifySteamProfileCommand(),

        new EconomyCommand(),
        new BalanceCommand(),
        new LeaderboardsCommand()
        //new CasinoCommand()
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

async function verifyUserIntegrity(userId: string) {
    const config = await Config.getLowConfig()

    const user: UserEconomySchema = config.data.economy.users[userId]

    if (!user) {
        await config.update((config) => {
            config.economy.users[userId] = {
                balance: 0,
                messages_sent: 0,
                voice_time_spent: 0,
                achievements: []
            }
        })
    }
}

function millisToTime(millis: number): string {
    const totalSeconds = Math.floor(millis / 1000)

    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const timeArray = []

    if (hours > 0) timeArray.push(`${hours}г`)
    if (minutes > 0) timeArray.push(`${minutes}хв`)
    if (seconds > 0) timeArray.push(`${seconds}с`)

    return timeArray.join(' ')
}

export const Main = {
    verifyUserIntegrity: verifyUserIntegrity,
    millisToTime: millisToTime
}