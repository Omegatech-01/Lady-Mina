import { join } from 'path'
import { xpRange } from '../lib/levelling.js'
import os from 'os'
import fs from 'fs'

const defaultMenu = {
  before: `
${wish()}

🌸 *U S E R   I N F O* 🌸
────────────────────────
🧚‍♀️ *Name: %name*
🎀 *Status: %status*
🍭 *Limit: %limit*
📈 *Level: %level*
🧸 *Role: %role*
🫧 *EXP: %exp*

🌸 *C O M M A N D   I N F O* 🌸
────────────────────────
*🅟 = Premium*
*🅛 = Limit*
*🅐 = Admin*
*🅓 = Developer*
*🅞 = Owner*
`.trimStart(),
  header: `*%category*
────────────────────────`,
  body: `*⚘ %cmd* %islimit %isPremium %isAdmin %isMods %isOwner`,
  footer: `────────────────────────`,
  after: `🍓 *Copyright © OmegaTech 2025*\n🌟 *Powered by Lady-Mina | Owner: Omegatech-01 | Support: https://github.com/Omegatech-01*`
}

let handler = async (m, { conn, usedPrefix, command, __dirname, isOwner, isMods, isPrems, args }) => {
  try {
    console.log('Processing .menu command for:', m.sender)
    await global.loading(m, conn)
    let tags
    let teks = `${args[0]}`.toLowerCase()
    let arrayMenu = [
      'all', 'ai', 'anime', 'audio', 'database', 'downloader', 'fun', 'game', 'genshin', 'group', 'info', 'internet',
      'kerang', 'maker', 'main', 'news', 'nulis', 'nsfw', 'owner', 'primbon', 'quran', 'quotes', 'random', 'rpg',
      'search', 'server', 'sound', 'sticker', 'store', 'tools', 'xp'
    ]
    if (!arrayMenu.includes(teks)) teks = 'all' // Default to 'all' if invalid
    if (teks === 'all') tags = {
      'ai': '🧠 AI & Chatbot',
      'anime': '🐰 Anime & Manga',
      'audio': '🎧 Audio & Music',
      'database': '🧺 Database & Storage',
      'downloader': '🍥 Download Media',
      'fun': '🍭 Fun & Entertainment',
      'game': '🕹️ Game & Fun',
      'genshin': '🌸 Genshin Impact',
      'group': '🧃 Group & Admin',
      'info': '📖 Info & Help',
      'internet': '💌 Internet & Social',
      'kerang': '🧿 Magic Conch',
      'main': '🧁 Main Menu',
      'maker': '🎀 Creator & Design',
      'news': '📰 News & Info',
      'nsfw': '🍓 Adult Content',
      'nulis': '✏️ Writing & Logo',
      'owner': '🪄 Admin & Developer',
      'primbon': '🔮 Fortune & Primbon',
      'quran': '🍃 Al-Qur\'an & Islamic',
      'quotes': '🫧 Quotes & Motivation',
      'random': '🎲 Random & Fun',
      'rpg': '🗡️ RPG & Adventure',
      'search': '🔍 Search & Info',
      'server': '🖥️ Server Management',
      'sound': '🔊 Sound & Effects',
      'sticker': '🌼 Sticker & Creator',
      'store': '🛍️ Store & Premium',
      'tools': '🧸 Tools & Utilities',
      'xp': '🍰 Level & Exp System'
    }
    if (teks === 'ai') tags = { 'ai': '🧠 AI & Chatbot' }
    if (teks === 'anime') tags = { 'anime': '🐰 Anime & Manga' }
    if (teks === 'audio') tags = { 'audio': '🎧 Audio & Music' }
    if (teks === 'database') tags = { 'database': '🧺 Database & Storage' }
    if (teks === 'downloader') tags = { 'downloader': '🍥 Download Media' }
    if (teks === 'fun') tags = { 'fun': '🍭 Fun & Entertainment' }
    if (teks === 'game') tags = { 'game': '🕹️ Game & Fun' }
    if (teks === 'genshin') tags = { 'genshin': '🌸 Genshin Impact' }
    if (teks === 'group') tags = { 'group': '🧃 Group & Admin' }
    if (teks === 'info') tags = { 'info': '📖 Info & Help' }
    if (teks === 'internet') tags = { 'internet': '💌 Internet & Social' }
    if (teks === 'kerang') tags = { 'kerang': '🧿 Magic Conch' }
    if (teks === 'main') tags = { 'main': '🧁 Main Menu' }
    if (teks === 'maker') tags = { 'maker': '🎀 Creator & Design' }
    if (teks === 'news') tags = { 'news': '📰 News & Info' }
    if (teks === 'nulis') tags = { 'nulis': '✏️ Writing & Logo' }
    if (teks === 'nsfw') tags = { 'nsfw': '🍓 Adult Content' }
    if (teks === 'owner') tags = { 'owner': '🪄 Admin & Developer' }
    if (teks === 'primbon') tags = { 'primbon': '🔮 Fortune & Primbon' }
    if (teks === 'quran') tags = { 'quran': '🍃 Al-Qur\'an & Islamic' }
    if (teks === 'quotes') tags = { 'quotes': '🫧 Quotes & Motivation' }
    if (teks === 'random') tags = { 'random': '🎲 Random & Fun' }
    if (teks === 'rpg') tags = { 'rpg': '🗡️ RPG & Adventure' }
    if (teks === 'search') tags = { 'search': '🔍 Search & Info' }
    if (teks === 'server') tags = { 'server': '🖥️ Server Management' }
    if (teks === 'sound') tags = { 'sound': '🔊 Sound & Effects' }
    if (teks === 'sticker') tags = { 'sticker': '🌼 Sticker & Creator' }
    if (teks === 'store') tags = { 'store': '🛍️ Store & Premium' }
    if (teks === 'tools') tags = { 'tools': '🧸 Tools & Utilities' }
    if (teks === 'xp') tags = { 'xp': '🍰 Level & Exp System' }

    let { exp, level, role } = global.db.data.users[m.sender]
    let { min, xp, max } = xpRange(level, global.multiplier)
    let user = global.db.data.users[m.sender]
    if (!user) {
      console.log('User data not found, initializing for:', m.sender)
      global.db.data.users[m.sender] = {}
      user = global.db.data.users[m.sender]
    }
    let limit = isPrems ? 'Unlimited' : toRupiah(user.limit)
    let name = user.registered ? user.name : conn.getName(m.sender)
    let status = isMods ? '🧁 Developer' : isOwner ? '🪄 Owner' : isPrems ? '💖 Premium User' : user.level > 1000 ? '🌟 Elite User' : '🍬 Free User'
    if (!global._imageIndex) global._imageIndex = 0
    let imageList = [
      'https://files.catbox.moe/x5b6y9.jpg',
      'https://files.catbox.moe/88kbh8.jpg',
      'https://files.catbox.moe/cuuilf.png',
      'https://files.catbox.moe/cuuilf.png',
      'https://files.catbox.moe/88kbh8.jpg',
      'https://files.catbox.moe/cuuilf.png',
      'https://files.catbox.moe/cuuilf.png',
      'https://files.catbox.moe/cuuilf.png',
      'https://files.catbox.moe/x5b6y9.jpg',
      'https://files.catbox.moe/88kbh8.jpg',
      'https://files.catbox.moe/88kbh8.jpg'
    ]
    let image = imageList[global._imageIndex % imageList.length]
    global._imageIndex++
    let member = Object.keys(global.db.data.users).filter(v => typeof global.db.data.users[v].commandTotal != 'undefined' && v != conn.user.jid).sort((a, b) => {
      const totalA = global.db.data.users[a].command
      const totalB = global.db.data.users[b].command
      return totalB - totalA
    })
    let commandToday = 0
    for (let number of member) {
      commandToday += global.db.data.users[number].command
    }
    let totalf = Object.values(global.plugins)
      .filter(v => Array.isArray(v.help))
      .reduce((acc, v) => acc + v.help.length, 0)
    let totalreg = Object.keys(global.db.data.users).length
    let uptime = formatUptime(process.uptime())
    let muptime = formatUptime(os.uptime())
    let listRate = Object.values(global.db.data.bots.rating).map(v => v.rate)
    let averageRating = listRate.length > 0 ? listRate.reduce((sum, rating) => sum + rating, 0) / listRate.length : 0
    let timeID = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(new Date())
    let subtitle = `🕒 ${timeID}`
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
    const Version = packageJson.version
    const mode = global.opts.self ? 'Private' : 'Public'
    let listCmd = `
🌸 *B O T   I N F O* 🌸
────────────────────────
🧁 *Name: ${conn.user.name}*
🧸 *Version: ${Version}*
🍰 *Bot Mode: ${mode}*
🗂️ *Database: ${bytesToMB(fs.readFileSync("./database.json").byteLength)} MB*
⏱️ *Uptime: ${uptime}*
🔋 *Machine Uptime: ${muptime}*
👤 *Total Registered: ${totalreg}*
📝 *Commands Today: ${commandToday}*
⭐ *Rating: ${averageRating.toFixed(2)}/5.00 (${listRate.length} Users)*
────────────────────────
`.trimStart()
    let lists = arrayMenu.map((v, i) => {
      return {
        title: `📂 ${capitalize(v)} Menu`,
        description: `🚀 To Open ${v} Menu`,
        id: `${usedPrefix + command} ${v}`
      }
    })
    let help = Object.values(global.plugins).filter(plugin => !plugin.disabled).map(plugin => {
      return {
        help: Array.isArray(plugin.tags) ? plugin.help : [plugin.help],
        tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
        prefix: 'customPrefix' in plugin,
        limit: plugin.limit,
        premium: plugin.premium,
        mods: plugin.mods,
        owner: plugin.owner,
        admin: plugin.admin,
        enabled: !plugin.disabled,
      }
    })
    let groups = {}
    for (let tag in tags) {
      groups[tag] = []
      for (let plugin of help)
        if (plugin.tags && plugin.tags.includes(tag))
          if (plugin.help) groups[tag].push(plugin)
    }
    conn.menu = conn.menu ? conn.menu : {}
    let before = conn.menu.before || defaultMenu.before
    let header = conn.menu.header || defaultMenu.header
    let body = conn.menu.body || defaultMenu.body
    let footer = conn.menu.footer || defaultMenu.footer
    let after = conn.menu.after || (conn.user.jid == global.conn.user.jid ? '' : `*Powered by https://wa.me/${global.conn.user.jid.split`@`[0]}*`) + defaultMenu.after
    let _text = [
      before,
      ...Object.keys(tags).map(tag => {
        return header.replace(/%category/g, tags[tag]) + '\n' + [
          ...help.filter(menu => menu.tags && menu.tags.includes(tag) && menu.help).map(menu => {
            return menu.help.map(help => {
              return body.replace(/%cmd/g, menu.prefix ? help : '%p' + help)
                .replace(/%islimit/g, menu.limit ? '🅛' : '')
                .replace(/%isPremium/g, menu.premium ? '🅟' : '')
                .replace(/%isAdmin/g, menu.admin ? '🅐' : '')
                .replace(/%isMods/g, menu.mods ? '🅓' : '')
                .replace(/%isOwner/g, menu.owner ? '🅞' : '')
                .trim()
            }).join('\n')
          }),
          footer
        ].join('\n')
      }),
      after
    ].join('\n')
    let text = typeof conn.menu == 'string' ? conn.menu : typeof conn.menu == 'object' ? _text : ''
    let replace = {
      '%': '%',
      p: usedPrefix,
      exp: toRupiah(exp - min),
      level: toRupiah(level),
      limit,
      name,
      role,
      status
    }
    text = text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replace[name])
    console.log('Sending menu with text length:', text.length)
    await conn.sendMessage(m.chat, {
      image: { url: image },
      caption: text.trim(),
      footer: 'Lady-Mina',
      buttons: [
        {
          buttonId: `${usedPrefix + command} all`,
          buttonText: { displayText: '🍭 Show All Menus' },
          type: 1
        },
        {
          buttonId: '.owner',
          buttonText: { displayText: '🎐 Contact Owner' },
          type: 1
        }
      ]
    })
  } catch (e) {
    console.error('Error in .menu command:', e)
    m.reply(`😞 *Failed to load menu, sweetie.*\n💡 Error: ${e.message}\n📌 Contact: +23279729810 or https://github.com/Omegatech-01`)
  } finally {
    await global.loading(m, conn, true)
    console.log('Command execution completed for:', m.sender)
  }
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = /^(menu|help)$/i
handler.register = true

export default handler

function formatUptime(seconds) {
  let minutes = Math.floor(seconds / 60)
  let hours = Math.floor(minutes / 60)
  let days = Math.floor(hours / 24)
  let months = Math.floor(days / 30)
  let years = Math.floor(months / 12)
  minutes %= 60
  hours %= 24
  days %= 30
  months %= 12
  let result = []
  if (years) result.push(`${years} year${years > 1 ? 's' : ''}`)
  if (months) result.push(`${months} month${months > 1 ? 's' : ''}`)
  if (days) result.push(`${days} day${days > 1 ? 's' : ''}`)
  if (hours) result.push(`${hours} hour${hours > 1 ? 's' : ''}`)
  if (minutes || result.length === 0) result.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`)
  return result.join(' ')
}

function wish() {
  let time = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  let hours = time.getHours()
  let minutes = time.getMinutes()
  let quarter = Math.floor(minutes / 15)
  const messages = {
    0: [
      '🌙 It’s super late at night—time to sleep, don’t stay up too long~',
      '💤 It’s really late now. Still awake? Take a break and rest.',
      '🌌 So quiet at midnight, don’t forget to sleep for a fresh start!',
    ],
    1: [
      '🛌 Past 1 AM, let’s hit the bed. No more late nights~',
      '😴 Eyes getting heavy? Time to sleep for a rested body.',
      '🌙 This hour’s perfect for bed and sweet dreams~',
    ],
    2: [
      '💤 Still up at 2 AM? Take care of your health, okay!',
      '🌌 It’s super early morning now, rest up to avoid fatigue~',
      '🌙 Chilly 2 AM vibes—perfect for a cozy sleep, try it~',
    ],
    3: [
      '🛌 It’s 3 AM, time to sleep and care for your health~',
      '💤 Let’s nap, so you wake up refreshed tomorrow~',
      '🌌 This hour’s great for a deep, restful sleep—go for it!',
    ],
    4: [
      '☀️ Early dawn! It’s getting bright, time to rise with energy!',
      '🍵 Early morning vibes—grab a coffee or tea, agree?',
      '🌅 Dawn’s here, cool air perfect for a light workout!',
    ],
    5: [
      '🐓 Roosters are crowing, time to wake up bright and early!',
      '🌞 Sunrise is starting, good morning! No laziness today~',
      '🥪 Breakfast time—fuel up for your day ahead~',
    ],
    6: [
      '🏃‍♂️ Morning workout time, let’s get healthy~',
      '📚 Don’t forget tasks or work prep today!',
      '☀️ Sun’s up high, stay motivated for your day~',
    ],
    7: [
      '💻 Productive morning—focus on work or tasks~',
      '☕ Had your coffee yet? Time to brew one if not!',
      '📊 Check your schedule or to-do list for today~',
    ],
    8: [
      '🍎 Morning snacks keep you energized, you know!',
      '🖥️ Working or studying? Take a quick eye break~',
      '🥗 Lunch is nearing—get ready to eat soon!',
    ],
    9: [
      '🌤️ Good afternoon! Time to refuel with lunch~',
      '🍛 What’s for lunch? Keep it healthy and tasty~',
      '😌 Post-lunch relax time—let your body unwind~',
    ],
    10: [
      '📖 Afternoon’s perfect for reading with iced tea, right?',
      '☀️ Heat’s picking up—stay hydrated, okay!',
      '🖋️ Still motivated? Keep pushing work or studies~',
    ],
    11: [
      '🌇 Evening’s approaching—finish your tasks~',
      '🛋️ Work with a snack break for extra productivity~',
      '📸 Last noon hours before evening—check the view, it’s stunning!',
    ],
    12: [
      '🌤️ It’s noon now, time to prepare lunch~',
      '🍽️ Don’t skip lunch—keep your energy up~',
      '😌 After lunch, take a short rest, okay~',
    ],
    13: [
      '📖 Post-lunch, afternoon’s great for a chill read~',
      '☀️ It’s hot now—drink water to avoid exhaustion!',
      '☀️ Heatwave alert—stay hydrated to avoid dehydration~',
    ],
    14: [
      '📖 Afternoon’s ideal for books or podcasts!',
      '🥤 Snack or refreshment time—pick something cool~',
      '🖋️ Work still pending? Take it step by step~',
    ],
    15: [
      '🌇 Evening’s here! Stretch to avoid stiffness~',
      '🍪 Afternoon snack time—what about cookies?~',
      '🏞️ Evening sky’s changing colors—gorgeous, huh~',
    ],
    16: [
      '📸 Snap some evening sky pics, super aesthetic!',
      '🛋️ Evening’s perfect for sofa chilling and watching~',
      '🍵 Evening tea hits different with a snack~',
    ],
    17: [
      '🌅 Night’s nearing, such a cool vibe~',
      '🕯️ Evening now—prepare dinner, don’t forget~',
      '🍽️ What’s for dinner? Let’s eat together~',
    ],
    18: [
      '🌙 Night’s here, time to calm your mind~',
      '🍲 Don’t skip dinner to avoid hunger later~',
      '📺 Time for your favorite show or movie tonight~',
    ],
    19: [
      '🎮 Gaming? Check the time, don’t overdo it!',
      '📱 Scroll socials with music—great night vibe~',
      '🎶 Slow music makes the night so relaxing~',
    ],
    20: [
      '📖 Night’s perfect for novels or journaling~',
      '✨ Night skincare keeps you glowing—don’t skip~',
      '🛌 Past 8 PM, time to unwind before bed~',
    ],
    21: [
      '🌌 It’s late—avoid staying up, it’s not good~',
      '💤 Prep for a good sleep, stay fresh tomorrow~',
      '🌙 Early sleep’s healthy—try making it a habit~',
    ],
    22: [
      '🌌 Super late now—turn off lights and sleep~',
      '✨ Sweet dreams ahead, hope tomorrow’s better~',
      '🛌 Get enough sleep for a healthy body~',
    ],
    23: [
      '💤 It’s deep midnight—time for a solid sleep~',
      '🌙 No more late nights, take care of yourself~',
      '🕯️ Deep sleep tonight keeps you refreshed tomorrow!',
      '✨ Good night, see you tomorrow! Sleep tight~'
    ]
  }
  let message = messages[hours]?.[quarter] || messages[hours]?.[3] || '✨ Time keeps moving—stay motivated for your day~'
  return `*${message}*`
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.substr(1)
}

const toRupiah = number => parseInt(number).toLocaleString().replace(/,/g, ".")

function bytesToMB(bytes) {
  return (bytes / 1048576).toFixed(2)
}
