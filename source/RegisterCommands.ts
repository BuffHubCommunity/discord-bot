import {REST, Routes, SlashCommandBuilder} from "discord.js";

(async () => {
    const commands = [
        new SlashCommandBuilder()
            .setName('налаштувати-привітання')
            .setDescription('Надсилає привітання у вказаний канал учаснику, після отримання вказаної ролі.')
            .addRoleOption((option) => option
                .setName('роль')
                .setDescription('Привітання буде надсилатись після того, як учасник отримає вказану роль.')
                .setRequired(true)
            )
            .addChannelOption((option) => option
                .setName('канал')
                .setDescription('Канал, у який буде надсилатись привітання.')
                .addChannelTypes(0)
                .setRequired(true)
            )
            .addStringOption((option) => option
                .setName('текст')
                .setDescription('Текст привітання. {mention} — згадування учасника.')
                .setRequired(true)
            ),

        new SlashCommandBuilder()
            .setName('шаблон')
            .setDescription('Надсилає шаблон тексту для перевірки.')
            .addStringOption((option) => option
                .setName('тип')
                .setDescription('Оберіть тип шаблону')
                .setRequired(true)
                .addChoices(
                    {name: 'питання-перевірки', value: 'questions'},
                    {name: 'як-відкрити-профіль', value: 'how-to-public-profile'},
                    {name: 'як-видалити-гру', value: 'how-to-delete-game'}
                )
            ),

        new SlashCommandBuilder()
            .setName('налаштувати-вартового')
            .setDescription('Налаштовує роль вартового.')
            .addRoleOption((option) => option
                .setName('роль')
                .setDescription('Роль учасника, який буде перевіряти заявки інших.')
                .setRequired(true)
            ),

        new SlashCommandBuilder()
            .setName('економіка')
            .setDescription('Деталі про економіку спільноти.'),

        new SlashCommandBuilder()
            .setName('таблиця-лідерів')
            .setDescription('Переглянути ТОП-10 найактивніших учасників спільноти.')
    ].map((command) => command.toJSON())

    const economy = [
        new SlashCommandBuilder()
            .setName('баланс')
            .setDescription('Перевірити поточну кількість монет.'),

        new SlashCommandBuilder()
            .setName('баланс-адмін')
            .setDescription('Маніпуляції з балансом учасників.')
            .addUserOption((option) => option
                .setName('учасник')
                .setDescription('Учасник, якому потрібно відредагувати баланс.')
                .setRequired(true)
            )
            .addStringOption((option) => option
                .setName('дія')
                .setDescription('Тип дії відносно до балансу.')
                .setRequired(true)
                .addChoices(
                    {name: 'додати', value: 'plus'},
                    {name: 'відняти', value: 'minus'}
                )
            )
            .addNumberOption((option) => option
                .setName('кількість')
                .setDescription('Кількість монет для додання/відняття від балансу.')
                .setRequired(true)
                .setMinValue(1)
            ),

        new SlashCommandBuilder()
            .setName('казино')
            .setDescription('Маніпуляції з балансом учасників.')
            .addNumberOption((option) => option
                .setName('ставка')
                .setDescription('Кількість монет для депозиту.')
                .setRequired(true)
                .setMinValue(1)
            )
    ]

    const VerifyCommands = [
        new SlashCommandBuilder()
            .setName('перевірити')
            .setDescription('Певерірити профіль Steam на наявність російських ігор, друзів та груп.')
            .addStringOption((option) => option
                .setName('тип')
                .setDescription('Оберіть тип перевірки')
                .addChoices(
                    {name: 'профіль', value: 'profile'},
                    {name: 'придбані-ігри', value: 'games'},
                    {name: 'бажані-ігри', value: 'wishlist'},
                    {name: 'друзів', value: 'friends'}
                )
                .setRequired(true)
            )
            .addStringOption((option) => option
                .setName('посилання')
                .setDescription('Посилання на профіль учасника.')
                .setRequired(true)
            )
    ]

    const Commands = [...commands, ...VerifyCommands, ...economy]

    const rest = new REST({version: '10'})
        .setToken(process.env.BOT_TOKEN as string)

    new Promise(async (resolve) => {
        try {
            console.log('Registering guild slash commands...')

            await rest.put(
                Routes.applicationGuildCommands(
                    process.env.CLIENT_ID as string,
                    process.env.GUILD_ID as string
                ),
                {body: Commands},
            )

            console.log('Guild slash commands registered.')
        } catch (error) {
            console.error(error)
        }

        resolve(true)
    })
})()