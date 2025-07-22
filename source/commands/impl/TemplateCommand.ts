import {Command} from '../Command'
import {
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder
} from 'discord.js'

export class TemplateCommand extends Command {
    name = 'шаблон'
    admin_only = true

    async init(client: Client): Promise<void> {}

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const type = interaction.options.getString('тип')

        switch (type) {
            case 'questions': {
                const embed = new EmbedBuilder()
                    .setDescription("Ми відбираємо учасників зі свідомою позицією, які не толерують контент країни-агресора.\nДля початку **просимо переглянути** <#1384604132349841552> спільноти.\n\n> 1. Розпишіть свою думку про Ваше ставлення щодо російської мови та російського контенту. Чи споживаєте ви такого роду контент, та чому споживаєте/не споживаєте?\nЦе також розповсюджується на контент від країн ОДКБ та компанії-колаборантів, які працюють з росією (як приклад MiHoYo).\n\n> 2. Чи погоджуєтесь Ви на перевірку Вашого профілю на виявлення росіян у списку друзів та ігор, розробленими росіянами/виданими ними?\nЯкщо щось подібне буде виявлено, ми попросимо Вас видалити цих друзів та ігри, оскільки це суперечить правилам нашої спільноти.")
                    .setColor('#4467ea')
                    .setTimestamp()

                await interaction.reply({
                    embeds: [embed]
                })

                break
            }

            case 'how-to-public-profile': {
                const embed_1 = new EmbedBuilder()
                    .setImage("https://raw.githubusercontent.com/BuffHubCommunity/discord-bot/master/assets/public-profile-step-1.png")
                    .setColor("#4467ea")

                const embed_2 = new EmbedBuilder()
                    .setImage("https://raw.githubusercontent.com/BuffHubCommunity/discord-bot/master/assets/public-profile-step-2.png")
                    .setColor("#4467ea")

                const embed_3 = new EmbedBuilder()
                    .setImage("https://raw.githubusercontent.com/BuffHubCommunity/discord-bot/master/assets/public-profile-step-2.png")
                    .setColor("#4467ea")

                await interaction.reply({
                    embeds: [
                        embed_1,
                        embed_2,
                        embed_3
                    ]
                })

                break
            }

            case 'how-to-delete-game': {
                break
            }
        }
    }
}