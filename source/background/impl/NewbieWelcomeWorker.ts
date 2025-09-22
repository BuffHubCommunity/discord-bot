import {BackgroundWorker} from "../BackgroundWorker";
import {ClientOverride} from "../../ClientOverride";
import {
    TextDisplayBuilder,
    ContainerBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    type MessageActionRowComponentBuilder,
    Client, GuildMember, TextChannel, EmbedBuilder, ActionRowData
} from 'discord.js';

export class NewbieWelcomeWorker extends BackgroundWorker {
    job(client: Client): Promise<void> {
        ClientOverride.on(client, 'guildMemberAddSafe', async (guildMember: GuildMember) => {
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#4b73f5')
                .setDescription(
                    `# Вітаємо на порозі до спільноти, ${guildMember.user.tag}! <:soldier_thumbup:1378127706750845071>\n\n` +
                    "У нашій спільноті діє обов’язкова система перевірки для кожного нового учасника. Вона допомагає нам краще пізнати новачків і запобігти можливим проблемам.\n\n" +
                    "*Якість учасника має більшу вагу, ніж кількість учасників* — (C) Керівництво BuffHub."
                )

            const components = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel("Правила")
                    .setEmoji("📜")
                    .setURL("https://discord.com/channels/1302584404094353471/1384604132349841552"),
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel("Нащо перевірка?")
                    .setEmoji("❓")
                    .setURL("https://discord.com/channels/1302584404094353471/1384317173392085163/1384567838378823680"),
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel("Перейти до перевірки")
                    .setEmoji("📄")
                    .setURL("https://discord.com/channels/1302584404094353471/1384317173392085163/1384567938542997616")
            ) as unknown as ActionRowData<any>

            const channel = client.channels.cache.get('1406737743135899679')
            if (!channel) return

            if (channel instanceof TextChannel) {
                await channel.send({
                    content: `<@${guildMember.id}>`,
                    embeds: [welcomeEmbed],
                    components: [components]
                })
            }
        })

        return Promise.resolve()
    }
}