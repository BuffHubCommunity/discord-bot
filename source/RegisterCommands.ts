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
            )
    ].map((command) => command.toJSON())

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
                {body: commands},
            )

            console.log('Guild slash commands registered.')
        } catch (error) {
            console.error(error)
        }

        resolve(true)
    })
})()