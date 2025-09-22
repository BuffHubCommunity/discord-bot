import {Command} from '../Command'
import {ChatInputCommandInteraction, Client, EmbedBuilder} from 'discord.js'
import {Config} from '../../Config'

export class TemplateCommand extends Command {
    name = 'шаблон'

    init(client: Client): Promise<void> {
        return Promise.resolve()
    }

    async canAccept(interaction: ChatInputCommandInteraction): Promise<boolean> {
        const config = await Config.getConfig()

        const verifier = config.commands.setupVerifier
        if (!verifier) return Promise.resolve(false)

        return Promise.resolve(
            this.hasRole(interaction.member, verifier.role_id) || this.isAdministrator(interaction.member)
        )
    }

    async accept(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply()

        const type = interaction.options.getString('тип') || '?'

        switch (type) {
            case 'questions': {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription("Ми відбираємо учасників зі свідомою позицією, які не толерують контент країни-агресора.\nДля початку **просимо переглянути** <#1384604132349841552> спільноти.\n\n> 1. Розпишіть свою думку про Ваше ставлення щодо російської мови та російського контенту. Чи споживаєте ви такого роду контент, та чому споживаєте/не споживаєте?\nЦе також розповсюджується на контент від країн ОДКБ та компанії-колаборантів, які працюють з росією (як приклад MiHoYo).\n\n> 2. Чи погоджуєтесь Ви на автоматичну перевірку Вашого профілю Steam на виявлення росіян у списку друзів та ігор, розробленими росіянами/виданими ними?\nДля перевірки достатньо надіслати посилання на свій Steam профіль.\nЯкщо щось подібне буде виявлено, ми попросимо Вас видалити цих друзів та ігри, оскільки це суперечить правилам нашої спільноти.")
                            .setColor(this.DEFAULT_COLOR)
                    ]
                })

                break
            }

            case 'how-to-public-profile': {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setImage("https://raw.githubusercontent.com/BuffHubCommunity/discord-bot/master/assets/public-profile-step-1.png")
                            .setColor(this.DEFAULT_COLOR),
                        new EmbedBuilder()
                            .setImage("https://raw.githubusercontent.com/BuffHubCommunity/discord-bot/master/assets/public-profile-step-2.png")
                            .setColor(this.DEFAULT_COLOR),
                        new EmbedBuilder()
                            .setImage("https://raw.githubusercontent.com/BuffHubCommunity/discord-bot/master/assets/public-profile-step-3.png")
                            .setColor(this.DEFAULT_COLOR),
                    ]
                })

                break
            }

            case 'how-to-delete-game': {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setImage("https://raw.githubusercontent.com/BuffHubCommunity/discord-bot/master/assets/remove-game-step-1.png")
                            .setColor(this.DEFAULT_COLOR),
                        new EmbedBuilder()
                            .setImage("https://raw.githubusercontent.com/BuffHubCommunity/discord-bot/master/assets/remove-game-step-2.png")
                            .setColor(this.DEFAULT_COLOR),
                        new EmbedBuilder()
                            .setImage("https://raw.githubusercontent.com/BuffHubCommunity/discord-bot/master/assets/remove-game-step-3.png")
                            .setColor(this.DEFAULT_COLOR),
                    ]
                })

                break
            }
        }
    }

    async reject(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('❌ Помилка!')
                    .setDescription('Ви не можете використовувати цю команду.')
                    .setColor(this.DEFAULT_COLOR)
                    .setFooter({
                        text: 'Використайте команду \'налаштувати-вартового\', щоб дати іншим можливість використовувати цю команду.',
                    })
            ],
            ephemeral: true
        })
    }
}