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
            .setName('шаблон-перевірки')
            .setDescription('Надсилає шаблон тексту для перевірки.')
    ].map(command => command.toJSON())

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
                { body: commands },
            )

            console.log('Guild slash commands registered.')
        } catch (error) {
            console.error(error)
        }

        resolve(true)
    })
})()