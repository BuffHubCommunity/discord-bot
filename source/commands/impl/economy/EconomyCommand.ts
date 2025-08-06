import {Command} from '../../Command'
import {
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder,
    Guild,
    GuildMember,
    TextBasedChannel,
    TextChannel,
    User
} from 'discord.js'
import {Config} from "../../../Config";

export type UserEconomySchema = {
    total_balance: number,
    total_messages: number,
    total_voice_time: number,
    earned_achievements: string[]
}
export type EconomySchema = {
    users: {
        [key: string]: UserEconomySchema
    }
}
export type VoiceUserSchema = {
    [user_id: string]: {
        channel_id: string
        time_since_last_reward: number
    }
}

export type AchievementSchema = {
    name: string,
    reward: number,
    condition: (userId: string) => Promise<boolean>
}

const achievements: AchievementSchema[] = [
    {
        name: 'Перше Повідомлення',
        reward: 50,
        condition: async function (userId: string) {
            const config = await Config.getConfig()
            const user = config.economy.users[userId]

            return Promise.resolve(
                !user.earned_achievements.includes(this.name) && user.total_messages === 0
            )
        }
    }
]

export class EconomyCommand extends Command {
    readonly name = 'економіка'

    async init(client: Client): Promise<void> {
        const guild = (client.guilds.cache.get(process.env.GUILD_ID as string) as Guild)

        // Зараховуємо валюту за повідомлення.
        client.on('messageCreate', async (message) => {
            if (message.author.bot) return

            if (message.content && message.content.length >= 10) {
                const config = await Config.getLowConfig()
                const userId = message.author.id

                let totalReward: number = 1 // Одразу зараховуємо за повідомлення.
                let earnedAchievements: AchievementSchema[] = []

                for (let achievement of achievements) {
                    const completed = await achievement.condition(userId)

                    if (completed) {
                        totalReward += achievement.reward
                        earnedAchievements.push(achievement)
                    }
                }

                await config.update(async (Config) => {
                    const user = Config.economy.users[userId]

                    user.total_balance += totalReward
                    user.total_messages += 1
                    user.earned_achievements.push(...earnedAchievements.map((achievement) => achievement.name))
                })

                const botChannel = guild.channels.cache.get('1361047517977907451') as TextChannel
                for (let achievement of earnedAchievements) {
                    await botChannel.send({
                        content: `<@${userId}>`,
                        embeds: [
                            new EmbedBuilder()
                                .setAuthor({name: 'Ви отримали нове досягнення!'})
                                .setTitle(`"${achievement.name}"`)
                                .setDescription(`Вам зараховано додаткові ${achievement.reward} монет.`)
                                .setColor(this.DEFAULT_COLOR)
                                .setThumbnail('https://images.emojiterra.com/twitter/v13.1/512px/1f3c6.png')
                                .setTimestamp()
                        ]
                    })
                }
            }
        })

        // Зараховуємо валюту за проведений час у ГЧ.
        await guild.members.fetch()
        const usersInVoiceChannels: VoiceUserSchema = {}

        for (let [userId, user] of guild.members.cache) {
            if (!user.voice.channel) continue

            usersInVoiceChannels[userId] = {
                channel_id: user.voice.channel.id,
                time_since_last_reward: Date.now()
            }
        }

        setInterval(async () => {
            for (let userId of Object.keys(usersInVoiceChannels)) {
                const UserData = usersInVoiceChannels[userId]

                const UserCountInCurrentVC = Object.values(usersInVoiceChannels).filter((ThisUserData) => ThisUserData.channel_id === UserData.channel_id).length
                if (UserCountInCurrentVC <= 1) continue

                const FiveMinutesPassed = (Date.now() - UserData.time_since_last_reward) >= (1000 * 60 * 5)

                if (FiveMinutesPassed) {
                    const User = (guild.members.cache.get(userId) as GuildMember)

                    // Передивлюємось, чи справді користувач у ГЧ.
                    if (!User || !User?.voice?.channel || (User?.voice?.channel?.id === guild?.afkChannel?.id)) {
                        delete usersInVoiceChannels[userId]
                    } else {
                        const config = await Config.getLowConfig()

                        await config.update((config) => {
                            const user = config.economy.users[userId]

                            user.total_balance += 1
                            user.total_voice_time += (60 * 50) * 1000
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
                usersInVoiceChannels[UserID] = {
                    channel_id: NewChannel.id,
                    time_since_last_reward: Date.now()
                }
            }

            // Користувач перемістився у інший ГЧ.
            if (OldChannel && NewChannel && (OldChannel !== NewChannel)) {
                if (UserID in usersInVoiceChannels) {
                    usersInVoiceChannels[UserID].channel_id = NewChannel.id
                } else {
                    usersInVoiceChannels[UserID] = {
                        channel_id: NewChannel.id,
                        time_since_last_reward: Date.now()
                    }
                }
            }

            // Користувач вийшов з ГЧ.
            if (OldChannel && !NewChannel) {
                delete usersInVoiceChannels[UserID]
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