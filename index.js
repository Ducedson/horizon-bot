const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/*
|--------------------------------------------------------------------------
| UTIL
|--------------------------------------------------------------------------
*/

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/*
|--------------------------------------------------------------------------
| SAUDAÇÃO POR HORÁRIO (MOÇAMBIQUE)
|--------------------------------------------------------------------------
*/

function getGreetingByTime() {
  const now = new Date();

  const hour = Number(
    new Intl.DateTimeFormat("pt-PT", {
      timeZone: "Africa/Maputo",
      hour: "numeric",
      hour12: false
    }).format(now)
  );

  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

/*
|--------------------------------------------------------------------------
| RESPOSTAS HUMANAS
|--------------------------------------------------------------------------
*/

const greetingsResponses = [
  (g) => `${g} 👋\n\nComo posso ajudar-te hoje?`,
  (g) => `${g} 😊\n\nEstou aqui para te ajudar. O que precisas?`,
  (g) => `${g} 👋\n\nBem-vindo(a)! Diz-me como posso ajudar.`
];

const howAreYouResponses = [
  "Estou bem 😊 obrigado por perguntares! E contigo?",
  "Tudo ótimo por aqui 👍 e contigo, como estás?",
  "Estou a funcionar perfeitamente 😄 diz-me como posso ajudar-te."
];

const fallbackResponses = [
  "Não consegui perceber bem 😅 podes explicar de outra forma?",
  "Hmm 🤔 não entendi totalmente, podes reformular?",
  "Preciso de mais detalhes para te ajudar melhor 😊"
];

/*
|--------------------------------------------------------------------------
| FAQS
|--------------------------------------------------------------------------
*/

const faqs = [
  {
    q: "O que e a Horizon Capital Dealer?",
    a: "A Horizon Capital Dealer e uma sociedade financeira de corretagem especializada em investimentos, mercado de capitais, solucoes de tesouraria e assessoria financeira estrategica.",
    k: ["horizon", "capital dealer", "o que e"]
  },
  {
    q: "A Horizon e um banco?",
    a: "Nao. A Horizon Capital Dealer nao e um banco comercial, mas sim uma sociedade financeira especializada em investimentos e mercado de capitais.",
    k: ["banco", "horizon banco"]
  }
];

/*
|--------------------------------------------------------------------------
| NORMALIZAÇÃO
|--------------------------------------------------------------------------
*/

function normalizeText(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/*
|--------------------------------------------------------------------------
| DETECÇÕES
|--------------------------------------------------------------------------
*/

function isGreeting(text) {
  return [
    "bom dia",
    "boa tarde",
    "boa noite",
    "ola",
    "oi",
    "hello",
    "hi"
  ].includes(text);
}

function isHowAreYou(text) {
  return [
    "como estas",
    "como esta",
    "tudo bem",
    "como vai",
    "how are you"
  ].includes(text);
}

/*
|--------------------------------------------------------------------------
| FAQ SEARCH
|--------------------------------------------------------------------------
*/

function findFaq(command) {
  let best = null;
  let bestScore = 0;

  faqs.forEach((faq) => {
    const question = normalizeText(faq.q);

    let score =
      question.includes(command) || command.includes(question) ? 2 : 0;

    faq.k.forEach((keyword) => {
      if (command.includes(normalizeText(keyword))) {
        score += 1;
      }
    });

    if (score > bestScore) {
      bestScore = score;
      best = faq;
    }
  });

  return bestScore > 0 ? best : null;
}

/*
|--------------------------------------------------------------------------
| BOT
|--------------------------------------------------------------------------
*/

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("session");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "120.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log("Escaneia o QR Code");
    }

    if (connection === "open") {
      console.log("BOT CONECTADO");
    }

    if (connection === "close") {
      const reason =
        lastDisconnect?.error?.output?.statusCode;

      if (reason === DisconnectReason.loggedOut) return;

      console.log("Reconectando...");
      delay(5000).then(startBot);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text;

    if (!text) return;

    const command = normalizeText(text);

    console.log("Mensagem:", text);

    /*
    |--------------------------------------------------------------------------
    | DIGITAÇÃO (HUMANO)
    |--------------------------------------------------------------------------
    */
    await sock.sendPresenceUpdate("composing", from);
    await delay(800);

    /*
    |--------------------------------------------------------------------------
    | SAUDAÇÃO
    |--------------------------------------------------------------------------
    */
    if (isGreeting(command)) {
      const g = getGreetingByTime();

      await sock.sendMessage(from, {
        text: random(greetingsResponses)(g)
      });

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | COMO ESTAS
    |--------------------------------------------------------------------------
    */
    if (isHowAreYou(command)) {
      await sock.sendMessage(from, {
        text: random(howAreYouResponses)
      });

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | FAQ
    |--------------------------------------------------------------------------
    */
    const matched = findFaq(command);

    if (matched) {
      const g = getGreetingByTime();

      await sock.sendMessage(from, {
        text:
          `${g}.\n\n` +
          `${matched.a}\n\n` +
          "Se precisares de mais ajuda, estou por aqui 😊"
      });

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | FALLBACK
    |--------------------------------------------------------------------------
    */
    await sock.sendMessage(from, {
      text: random(fallbackResponses)
    });
  });
}

startBot();