import {Command} from '../../Command'
import {ChatInputCommandInteraction, Client, EmbedBuilder, Guild, GuildMember, User} from 'discord.js'
import {Config} from "../../../Config";

export type EconomySchema = {
    'користувачі': { [key: string]: number }
}

export class EconomyCommand extends Command {
    readonly name = 'економіка'

    async init(client: Client): Promise<void> {
        const guild = (client.guilds.cache.get(process.env.GUILD_ID as string) as Guild)

        // Зараховуємо валюту за повідомлення.
        client.on('messageCreate', async (message) => {
            if (message.author.bot) return

            if (message.content && message.content.length >= 10) {
                const config = await Config.getLowConfig()
                const user_id = message.author.id

                await config.update((config) => {
                    const user = config[this.name]['користувачі']
                    user[user_id] = (user[user_id] || 0) + 1
                })
            }
        })

        // Зараховуємо валюту за проведений час у ГЧ.
        await guild.members.fetch()

        type UserDataSchema = {
            [user_id: string]: {
                channel_id: string
                time_since_last_reward: number
            }
        }
        const UsersInVC: UserDataSchema = {}

        for (let [UserID, User] of guild.members.cache) {
            if (User.voice.channel) {
                UsersInVC[UserID] = {
                    channel_id: User.voice.channel.id,
                    time_since_last_reward: Date.now()
                }
            }
        }

        setInterval(async () => {
            for (let UserID of Object.keys(UsersInVC)) {
                const UserData = UsersInVC[UserID]

                const UserCountInCurrentVC = Object.values(UsersInVC).filter((ThisUserData) => ThisUserData.channel_id === UserData.channel_id).length
                if (UserCountInCurrentVC <= 1) continue

                if ((Date.now() - UserData.time_since_last_reward) >= (1000 * 60 * 5)) {
                    const user = (guild.members.cache.get(UserID) as GuildMember)

                    // Передивлюємось, чи справді користувач у ГЧ.
                    if (!user || !user.voice.channel) {
                        delete UsersInVC[UserID]
                    } else {
                        // Зараховуємо валюту та скидуємо time_since_last_reward.
                        await (await Config.getLowConfig()).update((Config) => {
                            const user = Config[this.name]['користувачі']
                            user[UserID] = (user[UserID] || 0) + 1
                        })

                        UserData.time_since_last_reward = Date.now()
                    }
                }
            }
        }, (1000 * 30))

        client.on('voiceStateUpdate', (OldState, NewState) => {
            const OldChannel = OldState.channel
            const NewChannel = NewState.channel
            const UserID = NewState.id

            // Користувач під'єднався до ГЧ.
            if (!OldChannel && NewChannel) {
                UsersInVC[UserID] = {
                    channel_id: NewChannel.id,
                    time_since_last_reward: Date.now()
                }
            }

            // Користувач перемістився у інший ГЧ.
            if (OldChannel && NewChannel && (OldChannel !== NewChannel)) {
                if (UserID in UsersInVC) {
                    UsersInVC[UserID].channel_id = NewChannel.id
                } else {
                    UsersInVC[UserID] = {
                        channel_id: NewChannel.id,
                        time_since_last_reward: Date.now()
                    }
                }
            }

            // Користувач вийшов з ГЧ.
            if (OldChannel && !NewChannel) {
                delete UsersInVC[UserID]
            }
        })
    }

    canAccept(interaction: ChatInputCommandInteraction): Promise<boolean> {
        return Promise.resolve(true)
    }

    async accept(interaction: ChatInputCommandInteraction): Promise<void> {
        const embed = new EmbedBuilder()
            .setTitle('Економіка')
            .setDescription('Ви можете отримувати аксесуари у TF2 за активну участь у житті спільноти, отримуючи валюту "Бафи" <:soldier_thumbsup:1378127706750845071>')
            .setColor('#4b73f5')
            .setTimestamp()

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        })
    }

    reject(interaction: ChatInputCommandInteraction): Promise<void> {
        return Promise.resolve(undefined)
    }
}