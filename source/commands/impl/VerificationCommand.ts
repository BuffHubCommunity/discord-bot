import {Command} from '../Command'
import {
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder
} from 'discord.js'

export class VerificationCommand extends Command {
    name = 'шаблон-перевірки'
    admin_only = true

    async init(client: Client): Promise<void> {}

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const embed = new EmbedBuilder()
            .setDescription("Ми відбираємо учасників зі свідомою позицією, які не толерують контент країни-агресора.\nДля початку **просимо переглянути** <#1384604132349841552> спільноти.\n\n> 1. Розпишіть свою думку про Ваше ставлення щодо російської мови та російського контенту. Чи споживаєте ви такого роду контент, та чому споживаєте/не споживаєте?\nЦе також розповсюджується на контент від країн ОДКБ та компанії-колаборантів, які працюють з росією (як приклад MiHoYo).\n\n> 2. Чи погоджуєтесь Ви на перевірку Вашого профілю на виявлення росіян у списку друзів та ігор, розробленими росіянами/виданими ними?\nЯкщо щось подібне буде виявлено, ми попросимо Вас видалити цих друзів та ігри, оскільки це суперечить правилам нашої спільноти.")
            .setColor('#4467ea')
            .setTimestamp()

        await interaction.reply({
            embeds: [embed]
        })
    }
}