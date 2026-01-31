import axios from "axios"

class TempMail {
  constructor() {
    this.cookie = null
    this.baseUrl = "https://tempmail.so"
  }

  async updateCookie(res) {
    if (res.headers["set-cookie"]) {
      this.cookie = res.headers["set-cookie"].join("; ")
    }
  }

  async makeRequest(url) {
    const res = await axios.get(url, {
      headers: {
        accept: "application/json",
        cookie: this.cookie || "",
        referer: this.baseUrl + "/",
        "x-inbox-lifespan": "600",
        "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
        "sec-ch-ua-mobile": "?1",
      },
    })
    await this.updateCookie(res)
    return res
  }

  async initialize() {
    const res = await axios.get(this.baseUrl, {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9",
        "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
      },
    })
    await this.updateCookie(res)
    return this
  }

  async getInbox() {
    const url = `${this.baseUrl}/us/api/inbox?requestTime=${Date.now()}&lang=us`
    const res = await this.makeRequest(url)
    return res.data
  }

  async getMessage(id) {
    const url = `${this.baseUrl}/us/api/inbox/messagehtmlbody/${id}?requestTime=${Date.now()}&lang=us`
    const res = await this.makeRequest(url)
    return res.data
  }
}

const sessions = new Map()

const handler = async (m, { command, conn }) => {
  const chatId = m.chat

  if (command === "stopmail") {
    if (sessions.has(chatId)) {
      clearInterval(sessions.get(chatId))
      sessions.delete(chatId)
      return m.reply("🛑 Sesi temp mail dihentikan.")
    } else return m.reply("❌ Tidak ada sesi temp mail aktif.")
  }

  if (sessions.has(chatId)) {
    return m.reply("⚠️ Sesi temp mail sudah aktif!\nGunakan *.stopmail* terlebih dahulu atau tunggu email masuk.")
  }

  try {
    const mail = new TempMail()
    await mail.initialize()
    const inbox = await mail.getInbox()

    if (!inbox.data || !inbox.data.name) {
      return m.reply("❌ Gagal mendapatkan email sementara.")
    }

    const email = inbox.data.name
    const jumlah = inbox.data.inbox?.length || 0

    await m.reply(`📨 *TEMP MAIL AKTIF!*\n\n▢ Email: *${email}*\n▢ Inbox: *${jumlah} pesan*\n⏳ Menunggu pesan baru selama 10 menit...\n\nGunakan *.stopmail* untuk menghentikan lebih awal.`)

    let lastId = null
    let timeout = 10 * 60 * 1000 // 10 menit

    const polling = setInterval(async () => {
      try {
        const check = await mail.getInbox()
        const masuk = check.data.inbox?.[0]

        if (masuk && masuk.id !== lastId) {
          lastId = masuk.id
          const raw = await mail.getMessage(masuk.id)

          let content = ""
          if (typeof raw === "object" && raw.data?.html) {
            content = raw.data.html.replace(/<[^>]+>/g, "").trim()
          } else content = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2)

          await m.reply(`📬 *Email Baru Masuk!*\n\n▢ *Dari:* ${masuk.from}\n▢ *Subjek:* ${masuk.subject}\n\n📝 *Isi Pesan:*\n${content}`)

          clearInterval(polling)
          sessions.delete(chatId)
        }
      } catch (err) {
        console.error("Error polling:", err.message)
      }
    }, 5000)

    // Set timeout 10 menit
    const timeoutTimer = setTimeout(() => {
      clearInterval(polling)
      sessions.delete(chatId)
      m.reply("⌛ Waktu sesi temp mail telah habis (10 menit).")
    }, timeout)

    sessions.set(chatId, polling)
  } catch (e) {
    console.error(e)
    m.reply("🚨 Terjadi error saat membuat temp mail!")
  }
}

handler.command = ["tempmail", "stopmail"]
handler.tags = ["tools"]
handler.help = ["tempmail", "stopmail"]
handler.limit = true
handler.register = true

export default handler