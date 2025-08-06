import {Command} from "../Command"
import {ChatInputCommandInteraction, Client, EmbedBuilder, RestOrArray} from "discord.js"
import {Config} from "../../Config"

const __COUNTRIES__ = JSON.parse(`{"NULL": "Невідома", "US": "United States", "CA": "Canada", "AF": "Afghanistan", "AX": "Aland Islands", "AL": "Albania", "DZ": "Algeria", "AS": "American Samoa", "AD": "Andorra", "AO": "Angola", "AI": "Anguilla", "AQ": "Antarctica", "AG": "Antigua & Barbuda", "AR": "Argentina", "AM": "Armenia", "AW": "Aruba", "AU": "Australia", "AT": "Austria", "AZ": "Azerbaijan", "BS": "Bahamas", "BH": "Bahrain", "BD": "Bangladesh", "BB": "Barbados", "BY": "Belarus", "BE": "Belgium", "BZ": "Belize", "BJ": "Benin", "BM": "Bermuda", "BT": "Bhutan", "BO": "Bolivia", "BQ": "Bonaire, Sint Eustatius and Saba", "BA": "Bosnia and Herzegovina", "BW": "Botswana", "BV": "Bouvet Island", "BR": "Brazil", "IO": "British Indian Ocean Territory", "VG": "British Virgin Islands", "BN": "Brunei Darussalam", "BG": "Bulgaria", "BF": "Burkina Faso", "BI": "Burundi", "KH": "Cambodia", "CM": "Cameroon", "CV": "Cape Verde", "KY": "Cayman Islands", "CF": "Central African Republic", "TD": "Chad", "CL": "Chile", "CN": "China", "CX": "Christmas Island", "CC": "Cocos (Keeling) Islands", "CO": "Colombia", "KM": "Comoros", "CG": "Congo", "CD": "Congo, the Democratic Republic of the", "CK": "Cook Islands", "CR": "Costa Rica", "CI": "Cote D'ivoire (Ivory Coast)", "HR": "Croatia", "CU": "Cuba", "CW": "Curacao", "CY": "Cyprus", "CZ": "Czech Republic", "DK": "Denmark", "DJ": "Djibouti", "DM": "Dominica", "DO": "Dominican Republic", "EC": "Ecuador", "EG": "Egypt", "SV": "El Salvador", "GQ": "Equatorial Guinea", "ER": "Eritrea", "EE": "Estonia", "ET": "Ethiopia", "FK": "Falkland Islands (Malvinas)", "FO": "Faroe Islands", "FJ": "Fiji", "FI": "Finland", "FR": "France", "GF": "French Guiana", "PF": "French Polynesia", "TF": "French Southern Territories", "GA": "Gabon", "GM": "Gambia", "GE": "Georgia", "DE": "Germany", "GH": "Ghana", "GI": "Gibraltar", "GR": "Greece", "GL": "Greenland", "GD": "Grenada", "GP": "Guadeloupe", "GU": "Guam", "GT": "Guatemala", "GG": "Guernsey", "GN": "Guinea", "GW": "Guinea-Bissau", "GY": "Guyana", "HT": "Haiti", "HM": "Heard & McDonald Islands", "HN": "Honduras", "HK": "Hong Kong", "HU": "Hungary", "IS": "Iceland", "IN": "India", "ID": "Indonesia", "IQ": "Iraq", "IE": "Ireland", "IR": "Islamic Republic of Iran", "IM": "Isle of Man", "IL": "Israel", "IT": "Italy", "JM": "Jamaica", "JP": "Japan", "JE": "Jersey", "JO": "Jordan", "KZ": "Kazakhstan", "KE": "Kenya", "KI": "Kiribati", "KP": "Korea, Democratic People's Republic of", "KR": "Korea, Republic of", "XK": "Kosovo", "KW": "Kuwait", "KG": "Kyrgyzstan", "LA": "Laos", "LV": "Latvia", "LB": "Lebanon", "LS": "Lesotho", "LR": "Liberia", "LY": "Libya", "LI": "Liechtenstein", "LT": "Lithuania", "LU": "Luxembourg", "MO": "Macau", "MK": "Macedonia, The Former Yugoslav Republic of", "MG": "Madagascar", "MW": "Malawi", "MY": "Malaysia", "MV": "Maldives", "ML": "Mali", "MT": "Malta", "MH": "Marshall Islands", "MQ": "Martinique", "MR": "Mauritania", "MU": "Mauritius", "YT": "Mayotte", "MX": "Mexico", "FM": "Micronesia", "MD": "Moldova, Republic of", "MC": "Monaco", "MN": "Mongolia", "MS": "Monserrat", "ME": "Montenegro", "MA": "Morocco", "MZ": "Mozambique", "MM": "Myanmar", "NA": "Namibia", "NR": "Nauru", "NP": "Nepal", "NL": "Netherlands", "NC": "New Caledonia", "NZ": "New Zealand", "NI": "Nicaragua", "NE": "Niger", "NG": "Nigeria", "NU": "Niue", "NF": "Norfolk Island", "MP": "Northern Mariana Islands", "NO": "Norway", "OM": "Oman", "PK": "Pakistan", "OM": "Oman", "PK": "Pakistan", "PW": "Palau", "PS": "Palestinian Territory, Occupied", "PA": "Panama", "PG": "Papua New Guinea", "PY": "Paraguay", "PE": "Peru", "PH": "Philippines", "PN": "Pitcairn", "PL": "Poland", "PT": "Portugal", "PR": "Puerto Rico", "QA": "Qatar", "RE": "Reunion", "RO": "Romania", "RU": "Russian Federation", "RW": "Rwanda", "BL": "Saint Barthelemy", "LC": "Saint Lucia", "MF": "Saint Martin (French part)", "WS": "Samoa", "SM": "San Marino", "ST": "Sao Tome & Principe", "SA": "Saudi Arabia", "SN": "Senegal", "RS": "Serbia", "SC": "Seychelles", "SL": "Sierra Leone", "SG": "Singapore", "SX": "Sint Maarten (Dutch part)", "SK": "Slovakia", "SI": "Slovenia", "SB": "Solomon Islands", "SO": "Somalia", "ZA": "South Africa", "GS": "South Georgia and the South Sandwich Islands", "SS": "South Sudan", "ES": "Spain", "LK": "Sri Lanka", "SH": "St. Helena", "KN": "St. Kitts and Nevis", "PM": "St. Pierre & Miquelon", "VC": "St. Vincent & the Grenadines", "SD": "Sudan", "SR": "Suriname", "SJ": "Svalbard & Jan Mayen Islands", "SZ": "Swaziland", "SE": "Sweden", "CH": "Switzerland", "SY": "Syrian Arab Republic", "TW": "Taiwan", "TJ": "Tajikistan", "TZ": "Tanzania, United Republic of", "TH": "Thailand", "TL": "Timor-Leste", "TG": "Togo", "TK": "Tokelau", "TO": "Tonga", "TT": "Trinidad & Tobago", "TN": "Tunisia", "TR": "Turkey", "TM": "Turkmenistan", "TC": "Turks & Caicos Islands", "TV": "Tuvalu", "UG": "Uganda", "UA": "Ukraine", "AE": "United Arab Emirates", "GB": "United Kingdom", "UM": "United States Minor Outlying", "VI": "United States Virgin Islands", "UY": "Uruguay", "UZ": "Uzbekistan", "VU": "Vanuatu", "VA": "Vatican City State (Holy See)", "VE": "Venezuela", "VN": "Viet Nam", "WF": "Wallis & Futuna Islands", "EH": "Western Sahara", "YE": "Yemen", "ZM": "Zambia", "ZW": "Zimbabwe"}`)
const __DANGEROUS_COUNTRIES__ = JSON.parse(`["RU", "BY", "KZ", "TJ", "KG", "CN", "KP", "AM"]`)
const __DANGEROUS_COUNTRIES_AS_EMOJI__ = JSON.parse(`{"RU": "🇷🇺", "BY": "🇧🇾", "KZ": "🇰🇿", "TJ": "🇹🇯", "KG": "🇰🇬", "CN": "🇨🇳", "KP": "🇰🇵", "AM": "🇦🇲"}`)

const __FIELD_CHAR_LIMIT__ = 1024
const __FALLBACK_CHAR_LIMIT__ = 24

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
        const VerifierSchema = config['commands']['налаштувати-вартового']

        return Promise.resolve(
            this.isAdministrator(interaction.member) || (VerifierSchema && this.hasRole(interaction.member, VerifierSchema.role.id))
        )
    }

    async accept(interaction: ChatInputCommandInteraction): Promise<any> {
        await interaction.deferReply()

        const CheckType = (interaction.options.getString('тип') || '?')
        const SteamUrl = (interaction.options.getString('посилання') || '?')

        const Username = this.parseInput(SteamUrl)

        if (!Username) {
            return this.simpleReject(interaction,
                '❌ Помилка!',
                'Некоректний SteamID64 (має бути 17 цифр або посилання на профіль).'
            )
        }

        let SteamID64: string

        if (Username.type === 'SteamID64') {
            SteamID64 = Username.value
        } else {
            try {
                const SteamID64_response = await this.getSich(`https://sich.nesilar.com/api/user_vanityurl.php?vanityurl=${Username.value}`)
                if (!SteamID64_response.ok) throw new Error('Статус: ' + SteamID64_response.status)

                const SteamID64_Local = await SteamID64_response.json()
                if (SteamID64_Local.error) throw new Error(SteamID64_Local.error)

                SteamID64 = SteamID64_Local.steamid
            } catch (error) {
                return this.simpleReject(interaction,
                    '❌ Помилка!',
                    `Невдалось отримати SteamID64 ${Username.value} (${error}).`
                )
            }
        }

        switch (CheckType) {
            case 'profile': {
                let UserProfile: any

                try {
                    const UserProfile_response = await this.checkCategory('user_profile.php', SteamID64)
                    if (!UserProfile_response.ok) throw new Error('Статус: ' + UserProfile_response.status)

                    const UserProfile_Local = await UserProfile_response.json()
                    if (UserProfile_Local.error) throw new Error(UserProfile_Local.error)

                    UserProfile = UserProfile_Local.data
                } catch (error) {
                    return this.simpleReject(interaction,
                        '❌ Помилка!',
                        `Невдалось отримати інформацію про ${Username.value} (${error}).`
                    )
                }

                UserProfile.real_name = (UserProfile.real_name === 'NULL')
                    ? 'Приховано'
                    : UserProfile.real_name
                UserProfile.timecreated = (UserProfile.timecreated === 'NULL')
                    ? 'Приховано'
                    : new Date(UserProfile.timecreated * 1000).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    })
                UserProfile.country = (UserProfile.country === 'NULL')
                    ? 'Приховано'
                    : UserProfile.country

                const Content = [
                    '```ansi',
                    `1) SteamID64           ${UserProfile.steamid}`,
                    `2) Нікнейм             ${UserProfile.name}`,
                    `3) Справжнє ім'я       ${UserProfile.real_name}`,
                    `4) Дата Створення      ${UserProfile.timecreated}`,
                    `5) Країна              ${UserProfile.country}`,
                    '```'
                ].join("\n")

                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Профіль Користувача')
                            .setDescription(Content)
                            .setThumbnail(`https://avatars.steamstatic.com/${UserProfile.avatar_hash}_medium.jpg`)
                            .setColor(this.DEFAULT_COLOR)
                            .setFooter(SichFooter)
                            .setTimestamp()
                    ]
                })
            }

            case 'games': {
                let PurchasedGames: any

                try {
                    const PurchasedGames_response = await this.checkCategory('user_purchased.php', SteamID64)
                    if (!PurchasedGames_response.ok) throw new Error('Статус: ' + PurchasedGames_response.status)

                    const PurchasedGames_Local = await PurchasedGames_response.json()
                    if (PurchasedGames_Local.error) throw new Error(PurchasedGames_Local.error)

                    PurchasedGames = PurchasedGames_Local.data
                } catch (error) {
                    return this.simpleReject(interaction,
                        '❌ Помилка!',
                        `Невдалось отримати інформацію про придбані ігри ${Username.value} (${error}).`
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
                    const WishlistGames_response = await this.checkCategory('user_wishlist.php', SteamID64)
                    if (!WishlistGames_response.ok) throw new Error('Статус: ' + WishlistGames_response.status)

                    const WishlistGames_Local = await WishlistGames_response.json()
                    if (WishlistGames_Local.error) throw new Error(WishlistGames_Local.error)

                    WishlistGames = WishlistGames_Local.data
                } catch (error) {
                    return this.simpleReject(interaction,
                        '❌ Помилка!',
                        `Невдалось отримати інформацію про список бажаних ігор ${Username.value} (${error}).`
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
                    const Friends_response = await this.checkCategory('user_friends.php', SteamID64)
                    if (!Friends_response.ok) throw new Error('Статус: ' + Friends_response.status)

                    const Friends_Local = await Friends_response.json()
                    if (Friends_Local.error) throw new Error(Friends_Local.error)

                    Friends = Friends_Local.data
                } catch (error) {
                    return this.simpleReject(interaction,
                        '❌ Помилка!',
                        `Невдалось отримати список друзів ${Username.value} (${error}).`
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
                            .setTimestamp()
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
            .setTimestamp()

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