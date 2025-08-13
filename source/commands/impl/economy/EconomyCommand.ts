import {Command} from '../../Command'
import {
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder,
    Guild,
    GuildMember,
    TextBasedChannel,
    TextChannel,
    User,
    ChannelType
} from 'discord.js'
import {Config} from "../../../Config";
import {Main} from "../../../Main";

export type UserEconomySchema = {
    balance: number,
    messages_sent: number,
    voice_time_spent: number,

    achievements: string[]
}
export type EconomySchema = {
    users: {
        [key: string]: UserEconomySchema
    }
}

export type VoiceChannelMembersSchema = {
    [user_id: string]: VoiceChannelMemberSchema
}
export type VoiceChannelMemberSchema = {
    channel_id: string,
    voice_time_spent: number
}

export type VoiceDataSchema = {
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
    /*{
        id: 'first_message',
        name: 'Перше Повідомлення',
        reward: 50,
        condition: async function (user: UserEconomySchema) {
            return Promise.resolve(
                !user.earned_achievements.includes(this.name) && user.total_messages === 0
            )
        }
    }*/
]


export class EconomyCommand extends Command {
    readonly name = 'економіка'

    async init(client: Client): Promise<void> {
        const guild = (client.guilds.cache.get(process.env.GUILD_ID as string) as Guild)
        await guild.members.fetch()

        const voiceChannelMembers: VoiceChannelMembersSchema = {}

        client.on('messageDelete', async (message) => {
            if (message.partial) return

            await Main.verifyUserIntegrity(message.author.id)

            const config = await Config.getLowConfig()

            const username = (message.author.globalName || message.author.username)
            const userId = message.author.id

            await config.update((config) => {
                const user = config.economy.users[userId]

                user.balance -= 2

                console.log(`[messageDelete] @${username}(${userId}) видалив повідомлення. -2`)
            })
        })

        client.on('messageCreate', async (message) => {
            await Main.verifyUserIntegrity(message.author.id)

            if (message.author?.bot) return
            if (message.content?.length < 10) return
            if (message.channel.type !== ChannelType.GuildText) return

            const config = await Config.getLowConfig()

            const username = (message.author.globalName || message.author.username)
            const userId = message.author.id
            const user: UserEconomySchema = config.data.economy.users[userId]

            // TODO: бонуси

            // TODO: ачівки

            // Зараховуємо монету за повідомлення.
            await config.update((config) => {
                const user = config.economy.users[userId]

                user.balance += 1
                user.messages_sent += 1

                console.log(`[messageCreate] @${username}(${userId}) надіслав повідомлення. +1`)
            })
        })

        // Додаємо усіх наявних учасників у голосових чатах до списку.
        for (let [userId, member] of guild.members.cache) {
            if (!member.voice.channel) continue
            const username = member.user.globalName || member.user.username

            voiceChannelMembers[userId] = {
                channel_id: member.voice.channel.id,
                voice_time_spent: Date.now()
            }

            console.log(`[init] @${username}(${userId}) приєднався до голосового чату.`)
        }

        client.on('voiceStateUpdate', async (oldState, newState) => {
            await Main.verifyUserIntegrity(newState.id)

            const oldChannel = oldState.channel
            const newChannel = newState.channel

            const config = await Config.getLowConfig()

            const userId = newState.id
            const user = (newState.member as GuildMember)?.user
            const username = (user?.globalName || user?.username || '?')

            // Користувач під'єднався до ГЧ.
            if (!oldChannel && newChannel) {
                voiceChannelMembers[userId] = {
                    channel_id: newChannel.id,
                    voice_time_spent: Date.now()
                }

                console.log(`[voiceStateUpdate] @${username}(${userId}) приєднався до голосового чату.`)
            }

            // Користувач перемістився у інший ГЧ.
            if (oldChannel && newChannel && (oldChannel !== newChannel)) {
                if (userId in voiceChannelMembers) {
                    voiceChannelMembers[userId].channel_id = newChannel.id
                } else {
                    voiceChannelMembers[userId] = {
                        channel_id: newChannel.id,
                        voice_time_spent: Date.now()
                    }
                }

                console.log(`[voiceStateUpdate] @${username}(${userId}) перемістився до голосового чату.`)
            }

            // Користувач вийшов з ГЧ.
            if (oldChannel && !newChannel) {
                await config.update((config) => {
                    const user = config.economy.users[userId]

                    const voiceTimeSpent = (Date.now() - voiceChannelMembers[userId].voice_time_spent)
                    const voiceTimeSpentMinutes = Math.floor(voiceTimeSpent / (1000 * 60))

                    user.balance += Math.floor(voiceTimeSpentMinutes / 5)
                    user.voice_time_spent += voiceTimeSpent

                    delete voiceChannelMembers[userId]
                })

                console.log(`[voiceStateUpdate] @${username}(${userId}) вийшов з голосового чату.`)
            }
        })

        /*const guild = (client.guilds.cache.get(process.env.GUILD_ID as string) as Guild)

        // Зараховуємо валюту за повідомлення.
        client.on('messageCreate', async (message) => {
            if (message.author.bot || message.content?.length < 10) return

            const config = await Config.getLowConfig()

            const userId = message.author.id
            const user = config.data.economy.users[userId]

            // Випадковий бонус.
            const roll = Math.floor(Math.random() * 200) + 1
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

                if (user) {
                    user.total_balance += totalReward
                    user.total_messages += 1

                    const earnedAchievementIDs = earnedAchievements.map((achievement) => achievement.id)
                    user.earned_achievements.push(...earnedAchievementIDs)
                } else {
                    console.info(`@${userId} === undefined.`)
                }
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

                            if (user) {
                                user.total_balance += 1
                                user.total_voice_time += (60 * 50) * 1000

                                console.info(`@${userId} вже як 5 хвилин у голосовому чаті! +1.`)
                            } else {
                                console.info(`@${userId} вже як 5 хвилин у голосовому чаті! Він відсутній у БД.`)
                            }
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

                if (user) {
                    user.total_balance -= 2

                    console.info(`@${message.author.id} видалив повідомлення! -2.`)
                } else {
                    console.info(`@${message.author.id} видалив повідомлення! Він відсутній у БД.`)
                }
            })
        })*/
    }

    canAccept(interaction: ChatInputCommandInteraction): Promise<boolean> {
        return Promise.resolve(true)
    }

    async accept(interaction: ChatInputCommandInteraction): Promise<void> {
        const embed = new EmbedBuilder()
            .setTitle('Економіка')
            .setDescription('Ви можете отримувати аксесуари у TF2 за активну участь у житті спільноти, отримуючи валюту "Бафи" <:soldier_thumbsup:1378127706750845071>')
            .setColor(this.DEFAULT_COLOR)
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