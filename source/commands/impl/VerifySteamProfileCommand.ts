import {Command} from "../Command"
import {ChatInputCommandInteraction, Client, EmbedBuilder, RestOrArray} from "discord.js"
import {Config} from "../../Config"

const __DANGEROUS_COUNTRIES__ = JSON.parse(`["RU", "BY", "KZ", "TJ", "KG", "CN", "KP", "AM"]`)
const __DANGEROUS_COUNTRIES_AS_EMOJI__ = JSON.parse(`{"RU": "🇷🇺", "BY": "🇧🇾", "KZ": "🇰🇿", "TJ": "🇹🇯", "KG": "🇰🇬", "CN": "🇨🇳", "KP": "🇰🇵", "AM": "🇦🇲"}`)

const SichFooter = {
    text: 'Ця перевірка стала можливою завдяки спільноті Sich',
    iconURL: 'https://r.8b.io/82562/images/logo1-h_ledcbxum.png',
}

export class VerifySteamProfileCommand extends Command {
    readonly name = 'перевірити'

    init(client: Client): void {
    }

    async canAccept(interaction: ChatInputCommandInteraction): Promise<boolean> {
        const config = await Config.getConfig()

        const verifier = config.commands.setupVerifier
        if (!verifier) return Promise.resolve(false)

        return Promise.resolve(
            this.hasRole(interaction.member, verifier.role_id) || this.isAdministrator(interaction.member)
        )
    }

    async accept(interaction: ChatInputCommandInteraction): Promise<any> {
        await interaction.deferReply()

        const checkType = interaction.options.getString('тип') || '?'
        const steamUrl = interaction.options.getString('посилання') || '?'

        const username = this.parseInput(steamUrl)

        if (!username) {
            return this.simpleReject(interaction,
                '❌ Помилка!',
                'Некоректний SteamID64 (має бути 17 цифр або посилання на профіль).'
            )
        }

        let steamID64: string

        if (username.type === 'SteamID64') {
            steamID64 = username.value
        } else {
            try {
                const steamID64Response = await this.getSich(`https://sich.nesilar.com/api/user_vanityurl.php?vanityurl=${username.value}`)
                if (!steamID64Response.ok) throw new Error('Статус: ' + steamID64Response.status)

                const steamID64Local = await steamID64Response.json()
                if (steamID64Local.error) throw new Error(steamID64Local.error)

                steamID64 = steamID64Local.steamid
            } catch (error) {
                return this.simpleReject(interaction,
                    '❌ Помилка!',
                    `Невдалось отримати SteamID64 ${username.value} (${error}).`
                )
            }
        }

        switch (checkType) {
            case 'profile': {
                let userProfile: any

                try {
                    const userProfileResponse = await this.checkCategory('user_profile.php', steamID64)
                    if (!userProfileResponse.ok) throw new Error('Статус: ' + userProfileResponse.status)

                    const userProfileLocal = await userProfileResponse.json()
                    if (userProfileLocal.error) throw new Error(userProfileLocal.error)

                    userProfile = userProfileLocal.data
                } catch (error) {
                    return this.simpleReject(interaction,
                        '❌ Помилка!',
                        `Невдалось отримати інформацію про ${username.value} (${error}).`
                    )
                }

                userProfile.real_name = (userProfile.real_name === 'NULL')
                    ? 'Приховано'
                    : userProfile.real_name
                userProfile.timecreated = (userProfile.timecreated === 'NULL')
                    ? 'Приховано'
                    : new Date(userProfile.timecreated * 1000).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    })
                userProfile.country = (userProfile.country === 'NULL')
                    ? 'Приховано'
                    : userProfile.country

                const Content = [
                    '```ansi',
                    `1) SteamID64           ${userProfile.steamid}`,
                    `2) Нікнейм             ${userProfile.name}`,
                    `3) Справжнє ім'я       ${userProfile.real_name}`,
                    `4) Дата Створення      ${userProfile.timecreated}`,
                    `5) Країна              ${userProfile.country}`,
                    '```'
                ].join("\n")

                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Профіль Користувача')
                            .setDescription(Content)
                            .setThumbnail(`https://avatars.steamstatic.com/${userProfile.avatar_hash}_medium.jpg`)
                            .setColor(this.DEFAULT_COLOR)
                            .setFooter(SichFooter)
                            .setTimestamp()
                    ]
                })
            }

            case 'games': {
                let PurchasedGames: any

                try {
                    const PurchasedGames_response = await this.checkCategory('user_purchased.php', steamID64)
                    if (!PurchasedGames_response.ok) throw new Error('Статус: ' + PurchasedGames_response.status)

                    const PurchasedGames_Local = await PurchasedGames_response.json()
                    if (PurchasedGames_Local.error) throw new Error(PurchasedGames_Local.error)

                    PurchasedGames = PurchasedGames_Local.data
                } catch (error) {
                    return this.simpleReject(interaction,
                        '❌ Помилка!',
                        `Невдалось отримати інформацію про придбані ігри ${username.value} (${error}).`
                    )
                }

                const BadPurchasedGames_Format = PurchasedGames
                    .sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}))
                    .map((data: any) => `[${data.name}](https://store.steampowered.com/app/${data.appid})`)
                    .slice(0, 30)

                if (BadPurchasedGames_Format.length === 0) {
                    return await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Бібліотека')
                                .setDescription('Ігор з російським корінням не виявлено.')
                                .setColor(this.DEFAULT_COLOR)
                                .setFooter(SichFooter)
                                .setTimestamp()
                        ]
                    })
                }

                const Fields: RestOrArray<any> = this.chunkArray(BadPurchasedGames_Format, 10).map((BadGamesChunk) => ({
                    name: '',
                    value: BadGamesChunk.join('\n'),
                    inline: true
                }))

                if (PurchasedGames.length > BadPurchasedGames_Format.length) {
                    Fields[Fields.length - 1].value += `\n**... та ще ${PurchasedGames.length - BadPurchasedGames_Format.length}.**`
                }

                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Бібліотека')
                            .setDescription('Список придбаних ігор, які мають російське коріння.')
                            .addFields(Fields)
                            .setColor(this.DEFAULT_COLOR)
                            .setFooter(SichFooter)
                            .setTimestamp()
                    ]
                })
            }

            case 'wishlist': {
                let WishlistGames: any

                try {
                    const WishlistGames_response = await this.checkCategory('user_wishlist.php', steamID64)
                    if (!WishlistGames_response.ok) throw new Error('Статус: ' + WishlistGames_response.status)

                    const WishlistGames_Local = await WishlistGames_response.json()
                    if (WishlistGames_Local.error) throw new Error(WishlistGames_Local.error)

                    WishlistGames = WishlistGames_Local.data
                } catch (error) {
                    return this.simpleReject(interaction,
                        '❌ Помилка!',
                        `Невдалось отримати інформацію про список бажаних ігор ${username.value} (${error}).`
                    )
                }

                const BadWishlistGames_Format = WishlistGames
                    .sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}))
                    .map((data: any) => `[${data.name}](https://store.steampowered.com/app/${data.appid})`)
                    .slice(0, 30)

                if (BadWishlistGames_Format.length === 0) {
                    return await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Список Бажаного')
                                .setDescription('Ігор з російським корінням не виявлено.')
                                .setColor(this.DEFAULT_COLOR)
                                .setFooter(SichFooter)
                                .setTimestamp()
                        ]
                    })
                }

                const Fields: RestOrArray<any> = this.chunkArray(BadWishlistGames_Format, 10).map((BadGamesChunk) => ({
                    name: '',
                    value: BadGamesChunk.join('\n'),
                    inline: true
                }))

                if (WishlistGames.length > BadWishlistGames_Format.length) {
                    Fields[Fields.length - 1].value += `\n**... та ще ${WishlistGames.length - BadWishlistGames_Format.length}.**`
                }

                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Список Бажаного')
                            .setDescription('Список бажаних ігор, які мають російське коріння.')
                            .addFields(Fields)
                            .setColor(this.DEFAULT_COLOR)
                            .setFooter(SichFooter)
                            .setTimestamp()
                    ]
                })
            }

            case 'friends': {
                let Friends: any

                try {
                    const Friends_response = await this.checkCategory('user_friends.php', steamID64)
                    if (!Friends_response.ok) throw new Error('Статус: ' + Friends_response.status)

                    const Friends_Local = await Friends_response.json()
                    if (Friends_Local.error) throw new Error(Friends_Local.error)

                    Friends = Friends_Local.data
                } catch (error) {
                    return this.simpleReject(interaction,
                        '❌ Помилка!',
                        `Невдалось отримати список друзів ${username.value} (${error}).`
                    )
                }

                const BadFriends = Friends
                    .filter((friend: any) => __DANGEROUS_COUNTRIES__.includes(friend.country))

                const BadFriends_Format = BadFriends
                    .sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}))
                    .map((friend: any) => `${__DANGEROUS_COUNTRIES_AS_EMOJI__[friend.country]} [${this.escapeMarkdown(friend.name)}](https://steamcommunity.com/profiles/${friend.steamid})`)
                    .slice(0, 30)

                if (BadFriends_Format.length === 0) {
                    return await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Друзі')
                                .setDescription('Друзів які проживають у країнах-членах ОДКБ не виявлено.')
                                .setColor(this.DEFAULT_COLOR)
                                .setFooter(SichFooter)
                                .setTimestamp()
                        ]
                    })
                }

                const Fields: RestOrArray<any> = this.chunkArray(BadFriends_Format, 10).map((BadFriendsChunk) => ({
                    name: '',
                    value: BadFriendsChunk.join('\n'),
                    inline: true
                }))

                if (BadFriends.length > BadFriends_Format.length) {
                    Fields[Fields.length - 1].value += `\n**... та ще ${BadFriends.length - BadFriends_Format.length}.**`
                }

                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Друзі')
                            .setDescription('Список друзів, які проживають у країнах-членах ОДКБ.')
                            .addFields(Fields)
                            .setColor(this.DEFAULT_COLOR)
                            .setFooter(SichFooter)
                    ]
                })
            }
        }
    }

    async reject(interaction: ChatInputCommandInteraction): Promise<void> {
        const embed = new EmbedBuilder()
            .setTitle('❌ Помилка!')
            .setDescription('Ви не можете використовувати цю команду.')
            .setColor(this.DEFAULT_COLOR)

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        })
    }

    async checkCategory(category: string, steam_id64: string) {
        return await this.getSich(`https://sich.nesilar.com/api/${category}?steamid=${steam_id64}`)
    }

    async getSich(url: string) {
        return await fetch(url, {
            headers: {
                cookie: `access_key=${process.env.SICH_ACCESS_KEY}`
            },
            method: 'GET'
        })
    }

    parseInput(input: string) {
        const steam_id64 = /^\d{17}$/
        const steam_id64_url = /^(?:https:\/\/)?steamcommunity\.com\/profiles\/\d{17}\/?$/
        const username = /^[\w\d_-]+$/
        const username_url = /^(?:https:\/\/)?steamcommunity\.com\/id\/[\w\d_-]+\/?$/

        if (steam_id64.test(input)) {
            return {type: 'SteamID64', value: input}
        } else if (steam_id64_url.test(input)) {
            return {type: 'SteamID64', value: input.split('/profiles/')[1].split('/')[0]}
        } else if (username.test(input)) {
            return {type: 'Username', value: input}
        } else if (username_url.test(input)) {
            return {type: 'Username', value: input.split('/id/')[1].split('/')[0]}
        } else {
            return undefined
        }
    }

    chunkArray(array: any, chunk_size: number) {
        const result: any[] = []

        for (let i = 0; i < array.length; i += chunk_size) {
            result.push(array.slice(i, i + chunk_size))
        }

        return result
    }

    escapeMarkdown(text: string) {
        return text
            .replace(/\\/g, '')
            .replace(/\[/g, '')
            .replace(/\]/g, '')
            .replace(/\(/g, '')
            .replace(/\)/g, '')
    }
}