/*
 * Lady-Mina WhatsApp Bot
 * @description Open source WhatsApp bot based on Node.js and Baileys.
 * @author      གྷ OmegaTech <https://github.com/Omegatech-01>
 * @co-author   གྷ Lady-Mina Team <https://chat.whatsapp.com/FiGcVHByvd28Z1sT1OxWIY>
 * @copyright   © 2025 OmegaTech & Lady-Mina Team
 * @license     Apache License 2.0
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at:
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions
 * and limitations under the License.
 */

import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

global.config = {
    /*============== STAFF ==============*/
    owner: [
        ['23279729810', 'OmegaTech 𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥', true],
        ['989162872327', 'OmegaTech', true], // true: Mods
        ['989162872327', 'Queen-bella', false] // false: owner
    ],
    jids: [
        "120363420994100703@g.us", // Updated tag status WhatsApp
        "120363382653504904@g.us"  // Updated channel ID
    ],
    newsletter: '120363382653504904@newsletter',
    website: 'https://dixonomega.tech',
    group: 'https://chat.whatsapp.com/FiGcVHByvd28Z1sT1OxWIY',
    logo: "https://",
    /*============= PAIRING =============*/
    // Digits only: country code + number. NO +, spaces, or dashes.
    // Example: '23279729810' for Sierra Leone, '989162872327' for Iran, etc.
    // This must be the WhatsApp number that will run as the bot.
    pairingNumber: '989162872327',
    pairingAuth: true, // true = pair with code; false = show QR in terminal
    /*============== API ==============*/
    APIs: {
        lol: 'https://api.lolhuman.xyz',
        btz: 'https://api.betabotz.eu.org',
    }, //In Here Go to these web and get a api key//
    APIKeys: {
        'https://api.lolhuman.xyz': 'e63e81d8295848763427d6bc',
        'https://api.betabotz.eu.org': 'Btz-C3BRV'
    },
    domain: 'https://', // link panel pterodactyl
    apikey: 'ptla_', // Admin Key
    capikey: 'ptlc_', // CAdmin Key
    nestid: '-', // Nest ID pterodactyl
    egg: '-', // EGG ID pterodactyl
    loc: '1', // location pterodactyl
    VPS: {
        host: '123.456', // IP VPS
        port: '22', // open port
        username: 'root', // access
        password: '-', // password VPS
    },
    token: 'TOKEN', // token digital ocean
    qris: '', // decode Qris
    /*============= SUBDOMAIN =============*/
    Subdo: {
        "naruyaizumi.site": {
            zone: "",
            apitoken: ""
        }
    },
    /*============== MSG ==============*/
    watermark: 'Lady-Mina',
    author: 'OmegaTech',
    errorMsg: '*⚠️ Error.*',
    stickpack: 'Omega',
    stickauth: '© Lady-Mina',
}
global.loading = async (m, conn, back = false) => {
    if (!back) {
        return conn.sendReact(m.chat, "🍥", m.key)
    } else {
        return conn.sendReact(m.chat, "", m.key)
    }
}
/*============== EMOJI ==============*/
global.rpg = {
    emoticon(string) {
        string = string.toLowerCase()
        let emot = {
            level: '📊',
            limit: '🎫',
            health: '❤️',
            exp: '✨',
            atm: '💳',
            money: '💰',
            bank: '🏦',
            potion: '🥤',
            diamond: '💎',
            common: '📦',
            uncommon: '🛍️',
            mythic: '🎁',
            legendary: '🗃️',
            superior: '💼',
            pet: '🔖',
            trash: '🗑',
            armor: '🥼',
            sword: '⚔️',
            pickaxe: '⛏️',
            fishingrod: '🎣',
            wood: '🪵',
            rock: '🪨',
            string: '🕸️',
            horse: '🐴',
            cat: '🐱',
            dog: '🐶',
            fox: '🦊',
            robo: '🤖',
            dragon: '🐉',
            lion: '🦁',
            rhinoceros: '🦏',
            centaur: '🦄',
            scorpion: '🦂',
            griffin: '🦅',
            phoenix: '🐦‍🔥',
            wolf: '🐺',
            petfood: '🍖',
            iron: '⛓️',
            gold: '🪙',
            emerald: '❇️',
            upgrader: '🧰',
            bibitanggur: '🌱',
            bibitjeruk: '🌿',
            bibitapel: '☘️',
            bibitmangga: '🍀',
            bibitpisang: '🌴',
            anggur: '🍇',
            jeruk: '🍊',
            apel: '🍎',
            mangga: '🥭',
            pisang: '🍌',
            botol: '🍾',
            kardus: '📦',
            kaleng: '🏮',
            plastik: '📜',
            gelas: '🧋',
            chip: '♋',
            umpan: '🪱',
            skata: '🧩',
            bitcoin: '☸️',
            polygon: '☪️',
            dogecoin: '☯️',
            etherium: '⚛️',
            solana: '✡️',
            memecoin: '☮️',
            donasi: '💸',
            ammn: '⚖️',
            bbca: '💵',
            bbni: '💴',
            cuan: '💷',
            bbri: '💶',
            msti: '📡',
            steak: '🥩',
            ayam_goreng: '🍗',
            ribs: '🍖',
            roti: '🍞',
            udang_goreng: '🍤',
            bacon: '🥓',
            gandum: '🌾',
            minyak: '🥃',
            garam: '🧂',
            babi: '🐖',
            ayam: '🐓',
            sapi: '🐮',
            udang: '🦐'
        }
        if (typeof emot[string] !== 'undefined') {
            return emot[string]
        } else {
            return ''
        }
    }
}

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
    unwatchFile(file)
    console.log(chalk.cyan("Update 'config.js'"))
    import(`${file}?update=${Date.now()}`)
})
