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
    id: string,
    name: string,
    reward: number,
    condition: (user: UserEconomySchema) => Promise<boolean>
}

const achievements: AchievementSchema[] = [
    {
        id: 'first_message',
        name: 'Перше Повідомлення',
        reward: 50,
        condition: async function (user: UserEconomySchema) {
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
            if (message.author.bot || message.content?.length < 10) return

            const config = await Config.getLowConfig()

            const userId = message.author.id
            const user = config.data.economy.users[userId]

            // Випадковий бонус.
            const roll = Math.floor(Math.random() * 111) + 1
            const randomBoost = (roll === 1)

            if (randomBoost) {
                await config.update((config) => {
                    const user = config.economy.users[userId]

                    user.total_balance += 10
                })

                await message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Бот зірвав куш.')
                            .setDescription(`Вам зараховано додаткові 10 монет.`)
                            .setColor(this.DEFAULT_COLOR)
                            .setThumbnail('https://em-content.zobj.net/source/twitter/53/slot-machine_1f3b0.png')
                    ]
                })
            }

            //
            let totalReward: number = 1 // Одразу зараховуємо за повідомлення.
            let earnedAchievements: AchievementSchema[] = []

            for (let achievement of achievements) {
                const completed = await achievement.condition(user)

                if (completed) {
                    totalReward += achievement.reward
                    earnedAchievements.push(achievement)
                }
            }

            await config.update((config) => {
                const user = config.economy.users[userId]

                user.total_balance += totalReward
                user.total_messages += 1

                const earnedAchievementIDs = earnedAchievements.map((achievement) => achievement.id)
                user.earned_achievements.push(...earnedAchievementIDs)
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
                    ]
                })
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
                const userData = usersInVoiceChannels[userId]

                const userCountInCurrentVoiceChannel = Object.values(usersInVoiceChannels).filter((ThisUserData) => ThisUserData.channel_id === userData.channel_id).length
                if (userCountInCurrentVoiceChannel <= 1) continue

                const fiveMinutesPassed = (Date.now() - userData.time_since_last_reward) >= (1000 * 60 * 5)

                if (fiveMinutesPassed) {
                    const user = (guild.members.cache.get(userId) as GuildMember)

                    // Передивлюємось, чи справді користувач у ГЧ.
                    if (!user || !user?.voice?.channel || (user?.voice?.channel?.id === guild?.afkChannel?.id)) {
                        delete usersInVoiceChannels[userId]
                    } else {
                        const config = await Config.getLowConfig()

                        await config.update((config) => {
                            const user = config.economy.users[userId]

                            user.total_balance += 1
                            user.total_voice_time += (60 * 50) * 1000

                            console.info(`@${userId} вже як 5 хвилин у голосовому чаті! +1.`)
                        })

                        userData.time_since_last_reward = Date.now()
                    }
                }
            }
        }, (1000 * 30))

        client.on('voiceStateUpdate', (OldState, NewState) => {
            const oldChannel = OldState.channel
            const newChannel = NewState.channel
            const userId = NewState.id

            // Користувач під'єднався до ГЧ.
            if (!oldChannel && newChannel) {
                usersInVoiceChannels[userId] = {
                    channel_id: newChannel.id,
                    time_since_last_reward: Date.now()
                }

                console.info(`@${userId} під'єднався до голосового чату, починаємо рахувати.`)
            }

            // Користувач перемістився у інший ГЧ.
            if (oldChannel && newChannel && (oldChannel !== newChannel)) {
                if (userId in usersInVoiceChannels) {
                    usersInVoiceChannels[userId].channel_id = newChannel.id
                } else {
                    usersInVoiceChannels[userId] = {
                        channel_id: newChannel.id,
                        time_since_last_reward: Date.now()
                    }
                }

                console.info(`@${userId} перемістився до голосового чату, продовжуємо рахувати.`)
            }

            // Користувач вийшов з ГЧ.
            if (oldChannel && !newChannel) {
                delete usersInVoiceChannels[userId]

                console.info(`@${userId} вийшов з голосового чату, більше не рахуємо.`)
            }
        })

        client.on('messageDelete', async (message) => {
            if (message.partial) return

            const config = await Config.getLowConfig()
            const userId = message.author.id

            await config.update((config) => {
                const user = config.economy.users[userId]

                user.total_balance -= 2
            })

            console.info(`@${message.author.id} видалив повідомлення! -2.`)
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