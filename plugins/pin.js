import axios from 'axios' 
import {
    proto,
    generateWAMessageFromContent,
    generateWAMessageContent
} from 'baileys'

const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    if (!text) return m.reply(`⊏|⊐ Contoh: ${usedPrefix + command} nemophila flowers`);

    await conn.sendMessage(m.chat, {
        react: {
            text: `⏱️`,
            key: m.key
        }
    });

    async function createImage(url) {
        const {
            imageMessage
        } = await generateWAMessageContent({
            image: {
                url
            }
        }, {
            upload: conn.waUploadToServer
        });
        return imageMessage;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random()  (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    let push = [];
    const {
        data
    } = await axios.get(`https://theresapis.vercel.app/search/pinterest?q=${encodeURIComponent(text)}`);

    let res = Array.isArray(data.result) ? data.result : [];
    if (!res.length) return m.reply('Tidak ada gambar ditemukan dari Pinterest.');

    res = res.map(v => v.directLink || v.link);

    shuffleArray(res);

    res = res.slice(0, 10);

    let i = 1;
    for (let img of res) {
        push.push({
            body: proto.Message.InteractiveMessage.Body.fromObject({
                text: `Image ke - ${i++}`,
            }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: '乂 P I N T E R E S T',
            }),
            header: proto.Message.InteractiveMessage.Header.fromObject({
                title: '',
                hasMediaAttachment: true,
                imageMessage: await createImage(img),
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons: [{
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: 'Source 🔍',
                        url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(text)}`,
                        merchant_url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(text)}`
                    }),
                }],
            }),
        });
    }

    const message = generateWAMessageFromContent(
        m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2,
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.create({
                            text: `Hasil Dari: ${text}`,
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.create({
                            text: '乂 P I N T - C A R O U S E L',
                        }),
                        header: proto.Message.InteractiveMessage.Header.create({
                            hasMediaAttachment: false,
                        }),
                        carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                            cards: [...push],
                        }),
                    }),
                },
            },
        }, {
            quoted: m
        }
    );

    await conn.relayMessage(m.chat, message.message, {
        messageId: message.key.id
    });
    await conn.sendMessage(m.chat, {
        react: {
            text: `✅`,
            key: m.key
        }
    });
};

handler.help = ['pinterest'];
handler.tags = ['search'];
handler.command = /^(pinterest|pin)$/i;
handler.limit = true
handler.register = true
export default handler