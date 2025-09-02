import {Command} from '../../Command'
import {
    ChannelType,
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder,
    Guild,
    GuildMember, Message,
    VoiceChannel, VoiceState
} from 'discord.js'
import {Config} from "../../../Config";
import {Main} from "../../../Main";

export type UserEconomy = {
    balance: number,
    messages_sent: number,
    voice_time_spent: number,

    achievements: string[]
}
export type EconomySchema = {
    users: {
        [key: string]: UserEconomy
    }
}

export type VoiceMemberSchema = {
    voice_channel_id: string
    joined_at: number
}
export type RewardingVoiceMemberSchema = {
    voice_channel_id: string
    counting_since: number
}
export type LeftVoiceMemberSchema = {
    type: 'left-vc' | 'left-reward'
    member: GuildMember,
    voice_member: VoiceMemberSchema,
    rewarding_voice_member: RewardingVoiceMemberSchema
}

export type AchievementSchema = {
    id: string,
    name: string,
    reward: number,
    condition: (user: UserEconomy) => Promise<boolean>
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
        await guild.channels.fetch()
        await guild.members.fetch()

        const voiceMembers: { [key: string]: VoiceMemberSchema } = {}
        const rewardingVoiceMembers: { [key: string]: RewardingVoiceMemberSchema } = {}

        client.on('messageDeleteSafe', async (message: Message) => {
            if (message.partial) return

            const username = (message.author.globalName || message.author.username)
            const userId = message.author.id

            await Config.asyncUpdate(async (config) => {
                const user = config.economy.users[userId]
                user.balance -= 2

                console.log(`[messageDelete] @${username}(${userId}) видалив повідомлення. -2`)
                return true
            })
        })

        client.on('messageCreateSafe', async (message: Message) => {
            if (message.author?.bot) return
            if (message.content?.length < 10) return
            if (message.channel.type !== ChannelType.GuildText) return

            const username = (message.author.globalName || message.author.username)
            const userId = message.author.id

            // TODO: бонуси

            // TODO: ачівки

            // Зараховуємо монету за повідомлення.
            await Config.asyncUpdate(async (config) => {
                const user = config.economy.users[userId]

                user.balance += 1
                user.messages_sent += 1

                console.log(`[messageCreate] @${username}(${userId}) надіслав повідомлення. +1`)

                return true
            })
        })

        for (let [, channel] of guild.channels.cache) {
            if (!(channel instanceof VoiceChannel)) continue

            for (let [, member] of channel.members) {
                voiceMembers[member.id] = {
                    voice_channel_id: channel.id,
                    joined_at: Date.now()
                }

                if (channel.members.size >= 2) {
                    rewardingVoiceMembers[member.id] = {
                        voice_channel_id: channel.id,
                        counting_since: Date.now()
                    }
                }
            }
        }

        client.on('voiceStateUpdateSafe', async (oldState: VoiceState, newState: VoiceState) => {
            const oldChannel = oldState.channel
            const newChannel = newState.channel

            const mainMember = (newState.member as GuildMember)

            const leftVoiceMembers: LeftVoiceMemberSchema[] = []

            if (!oldChannel && newChannel) {
                const voiceChannel = newChannel

                voiceMembers[mainMember.id] = {
                    voice_channel_id: voiceChannel.id,
                    joined_at: Date.now()
                }

                if (voiceChannel.members.size >= 2) {
                    // Поточний учасник.
                    rewardingVoiceMembers[mainMember.id] = {
                        voice_channel_id: voiceChannel.id,
                        counting_since: Date.now()
                    }

                    // Інші учасники.
                    for (let [, member] of voiceChannel.members) {
                        if (member === mainMember) continue //

                        if (member.id in rewardingVoiceMembers) continue // Вже рахується.

                        rewardingVoiceMembers[member.id] = {
                            voice_channel_id: voiceChannel.id,
                            counting_since: Date.now()
                        }
                    }
                }
            }

            if (oldChannel && !newChannel) {
                leftVoiceMembers.push({
                    type: 'left-vc',
                    member: mainMember,
                    voice_member: voiceMembers[mainMember.id],
                    rewarding_voice_member: rewardingVoiceMembers[mainMember.id]
                })

                delete voiceMembers[mainMember.id]
                delete rewardingVoiceMembers[mainMember.id]

                if (oldChannel.members.size <= 1) {
                    oldChannel.members.forEach((member) => {
                        leftVoiceMembers.push({
                            type: 'left-reward',
                            member: member,
                            voice_member: voiceMembers[member.id],
                            rewarding_voice_member: rewardingVoiceMembers[member.id]
                        })

                        delete rewardingVoiceMembers[member.id]
                    })
                }
            }

            if (oldChannel && newChannel && (oldChannel !== newChannel)) {
                const voiceChannel = newChannel

                voiceMembers[mainMember.id].voice_channel_id = voiceChannel.id

                // Основний учасник.
                if (voiceChannel.members.size >= 2) {
                    if (mainMember.id in rewardingVoiceMembers) {
                        rewardingVoiceMembers[mainMember.id].voice_channel_id = voiceChannel.id
                    } else {
                        rewardingVoiceMembers[mainMember.id] = {
                            voice_channel_id: voiceChannel.id,
                            counting_since: Date.now()
                        }
                    }
                } else {
                    leftVoiceMembers.push({
                        type: 'left-reward',
                        member: mainMember,
                        voice_member: voiceMembers[mainMember.id],
                        rewarding_voice_member: rewardingVoiceMembers[mainMember.id]
                    })

                    delete rewardingVoiceMembers[mainMember.id]
                }

                // Інші учасники (Старий Чат)
                if (oldChannel.members.size <= 1) {
                    oldChannel.members.forEach((member) => {
                        leftVoiceMembers.push({
                            type: 'left-reward',
                            member: member,
                            voice_member: voiceMembers[member.id],
                            rewarding_voice_member: rewardingVoiceMembers[member.id]
                        })

                        delete rewardingVoiceMembers[member.id]
                    })
                }

                // Інші учасники (Новий Чат)
                if (voiceChannel.members.size >= 2) {
                    for (let [, member] of voiceChannel.members) {
                        if (member === mainMember) continue //

                        if (member.id in rewardingVoiceMembers) continue // Вже рахується.

                        rewardingVoiceMembers[member.id] = {
                            voice_channel_id: voiceChannel.id,
                            counting_since: Date.now()
                        }
                    }
                }
            }

            const contentArray: { [key: string]: string[] } = {}

            for (let userId in voiceMembers) {
                const voiceMember = voiceMembers[userId]
                const member = guild.members.cache.get(userId) as GuildMember

                if (voiceMember.voice_channel_id in contentArray) {
                    contentArray[voiceMember.voice_channel_id].push(member.user.tag + ' ' + (member.id in rewardingVoiceMembers))
                } else {
                    const voiceChannel = guild.channels.cache.get(voiceMember.voice_channel_id) as VoiceChannel

                    contentArray[voiceMember.voice_channel_id] = [
                        `**#${voiceChannel.name}**`,
                        member.user.tag + ' ' + (member.id in rewardingVoiceMembers)
                    ]
                }
            }

            // await eureka.send('> Оновлення\n' + Object.values(contentArray).map((ca) => ca.join('\n')).join('\n'))

            if (leftVoiceMembers.length >= 1) {
                await Config.asyncUpdate(async (config) => {
                    for (let leftVoiceMember of leftVoiceMembers) {
                        const userEconomy = config.economy.users[leftVoiceMember.member.id]

                        const voiceTimeSpent = (Date.now() - leftVoiceMember.voice_member.joined_at)

                        userEconomy.voice_time_spent += voiceTimeSpent

                        if (leftVoiceMember.rewarding_voice_member) {
                            const rewardingVoiceTimeSpent = (Date.now() - leftVoiceMember.rewarding_voice_member.counting_since)
                            const rewardingVoiceTimeSpentMinutes = Math.floor(rewardingVoiceTimeSpent / (1000 * 60))
                            const voiceReward = Math.floor(rewardingVoiceTimeSpentMinutes / 5)

                            userEconomy.balance += voiceReward
                        }

                        if (leftVoiceMember.type === 'left-reward') {
                            // Оновлюємо дату приєднання, так як ми оновили його інформацію у БД.
                            voiceMembers[leftVoiceMember.member.id].joined_at = Date.now()
                        } else {
                            // leftVoiceMember.type === 'left-vc'
                            // Учасник остаточно вийшов з ГЧ, інформації у 'voiceMembers' про нього нема.
                        }
                    }

                    return true
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