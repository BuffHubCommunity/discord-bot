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
            const voiceChannel = member.voice.channel
            if (!voiceChannel) continue

            if (voiceChannel.members.size >= 2) {
                voiceChannel.members.forEach((member) => {
                    if (member.id in voiceChannelMembers) return

                    voiceChannelMembers[member.id] = {
                        channel_id: voiceChannel.id,
                        voice_time_spent: Date.now()
                    }

                    console.log(`-# @${member.user.tag} під'єднався до #${voiceChannel.name} (${voiceChannel.members.size}).`)
                })
            }
        }

        client.on('voiceStateUpdate', async (oldState, newState) => {
            await Main.verifyUserIntegrity(newState.id)

            const oldChannel = oldState.channel
            const newChannel = newState.channel

            const config = await Config.getLowConfig()

            const userId = newState.id
            const mainMember = (newState.member as GuildMember)

            // Користувач під'єднався до ГЧ.
            if (!oldChannel && newChannel) {
                // Рахуємо монети лише від двух учасників.
                switch (newChannel.members.size) {
                    case 1: {
                        // Учасник самотній у голосовому чаті, не рахуємо монети.
                        console.log(`-# @${mainMember.user.tag} під'єднався до #${newChannel.name} (${newChannel.members.size}).`)
                        break
                    }

                    case 2: {
                        // Кількість учасників у голосовому чаті 2, тепер рахуємо монети обом.
                        console.log(`-# #${newChannel.name}: починаємо рахувати монети для двох учасників (${newChannel.members.map((member) => member.user.tag).join(', ')}).`)

                        for (let [userId, member] of newChannel.members) {
                            voiceChannelMembers[userId] = {
                                channel_id: newChannel.id,
                                voice_time_spent: Date.now()
                            }
                        }
                        break
                    }

                    default: {
                        // Учасник під'єднався до групи з 2+ учасників, у яких вже рахуються монети, тому починаємо рахувати лише йому.
                        console.log(`-# #${newChannel.name}: починаємо рахувати монети новому учаснику (${mainMember.user.tag}).`)

                        voiceChannelMembers[userId] = {
                            channel_id: newChannel.id,
                            voice_time_spent: Date.now()
                        }
                        break
                    }
                }
            }

            // Користувач вийшов з ГЧ.
            if (oldChannel && !newChannel) {
                const emptyVoiceChannelParticipants: GuildMember[] = [mainMember]

                if (oldChannel.members.size <= 1) {
                    oldChannel.members.forEach((member) => emptyVoiceChannelParticipants.push(member))
                }

                await config.update((config) => {
                    for (let member of emptyVoiceChannelParticipants) {
                        const user = config.economy.users[member.id]

                        const voiceUser = voiceChannelMembers[member.id]
                        if (!voiceUser) continue

                        const voiceTimeSpent = (Date.now() - voiceUser.voice_time_spent)
                        const voiceTimeSpentMinutes = Math.floor(voiceTimeSpent / (1000 * 60))
                        const voiceReward = Math.floor(voiceTimeSpentMinutes / 5)

                        user.balance += voiceReward
                        user.voice_time_spent += voiceTimeSpent

                        delete voiceChannelMembers[member.id]

                        if (mainMember === member) {
                            console.log(`-# @${member.user.tag} від'єднався від #${oldChannel.name} (${oldChannel.members.size}). Заробив +${voiceReward}`)
                        } else {
                            console.log(`-# @${member.user.tag} все ще у голосовому каналі #${oldChannel.name} (${oldChannel.members.size}), але учасників для зарахування монет недостатньо. Заробив +${voiceReward}`)
                        }
                    }
                })
            }

            // Користувач перемістився у інший ГЧ.
            if (oldChannel && newChannel && (oldChannel !== newChannel)) {
                console.log(`-# @${mainMember.user.tag} перемістився з #${oldChannel.name} (${oldChannel.members.size}) до #${newChannel.name} (${newChannel.members.size}).`)

                const emptyVoiceChannelParticipants: GuildMember[] = []

                // Попередній ГЧ.
                if (oldChannel.members.size <= 1) {
                    oldChannel.members.forEach((member) => emptyVoiceChannelParticipants.push(member))
                }

                // Новий ГЧ.
                switch (newChannel.members.size) {
                    case 1: {
                        // Чат, у якому є лише переміщений учасник.
                        // Більше не рахуємо йому монети.
                        newChannel.members.forEach((member) => emptyVoiceChannelParticipants.push(member))
                        break
                    }

                    case 2: {
                        // Чат, у якому тепер є мінімум учасників для зарахування монет.
                        newChannel.members.forEach((member) => {
                            if ((mainMember === member) && (member.id in voiceChannelMembers)) {
                                // Змінюємо канал, якщо під'єднаний учасник був у попередньому каналі.
                                voiceChannelMembers[member.id].channel_id = newChannel.id
                            } else {
                                // Інакше додаємо до списку.
                                voiceChannelMembers[member.id] = {
                                    channel_id: newChannel.id,
                                    voice_time_spent: Date.now()
                                }
                            }
                        })
                        break
                    }

                    default: {
                        // Чат, у якому вже сидить більше осіб, ніж потрібно для мінімальної нагороди.
                        // Додаємо до списку лише під'єднаного учасника.
                        if (mainMember.id in voiceChannelMembers) {
                            voiceChannelMembers[mainMember.id].channel_id = newChannel.id
                        } else {
                            voiceChannelMembers[mainMember.id] = {
                                channel_id: newChannel.id,
                                voice_time_spent: Date.now()
                            }
                        }
                        break
                    }
                }

                await config.update((config) => {
                    for (let member of emptyVoiceChannelParticipants) {
                        const user = config.economy.users[member.id]

                        const voiceUser = voiceChannelMembers[member.id]
                        if (!voiceUser) continue

                        const voiceTimeSpent = (Date.now() - voiceUser.voice_time_spent)
                        const voiceTimeSpentMinutes = Math.floor(voiceTimeSpent / (1000 * 60))
                        const voiceReward = Math.floor(voiceTimeSpentMinutes / 5)

                        user.balance += voiceReward
                        user.voice_time_spent += voiceTimeSpent

                        delete voiceChannelMembers[member.id]

                        console.log(`-# @${member.user.tag} все ще у голосовому каналі #${newChannel.name} (${newChannel.members.size}), але учасників для зарахування монет недостатньо. Заробив +${voiceReward}`)
                    }
                })
            }
        })
    }

    canAccept(interaction: ChatInputCommandInteraction): Promise<boolean> {
        return Promise.resolve(true)
    }

    async accept(interaction: ChatInputCommandInteraction): Promise<void> {
        const embed = new EmbedBuilder()
            .setTitle('<:buffcoin:1403721284629565501> Наша Економіка')
            .setDescription([
                'Економіка тримається на монетах — "БафКоїни" <:buffcoin:1403721284629565501>. Їх можна отримати лише за активну участь у житті спільноти.',
                'Нижче будуть наведені дії, за які Ви буде нагороджені валютою.',
                '```ansi',
                '1 Повідомлення               1 монета',
                '5 Хвилин У Голосовому Чаті   1 монета',
                '```',
                'Це не єдині способи отримання валюти, Ви також можене отримати її за **досягнення** та **бонуси**.'
            ].join('\n'))
            .setColor(this.DEFAULT_COLOR)

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        })
    }

    reject(interaction: ChatInputCommandInteraction): Promise<void> {
        return Promise.resolve(undefined)
    }
}