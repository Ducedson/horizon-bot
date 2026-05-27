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
| SAUDACAO AUTOMATICA - FUSO HORARIO DE MOCAMBIQUE
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

  if (hour >= 5 && hour < 12) {
    return "Bom dia";
  }

  if (hour >= 12 && hour < 18) {
    return "Boa tarde";
  }

  return "Boa noite";
}

/*
|--------------------------------------------------------------------------
| FAQS
|--------------------------------------------------------------------------
*/

const faqs = [
  {
    q: "O que e a Horizon Capital Dealer?",
    a: "A Horizon Capital Dealer e uma sociedade financeira de corretagem especializada em investimentos, mercado de capitais, solucoes de tesouraria e assessoria financeira estrategica.\n\nApoiamos particulares, empresas e investidores institucionais no acesso estruturado, seguro e eficiente ao mercado financeiro.",
    k: ["horizon", "horizon capital", "quem sao", "o que e horizon"]
  },
  {
    q: "A Horizon e um banco?",
    a: "Nao. A Horizon Capital Dealer nao e um banco comercial. Somos uma sociedade financeira especializada em investimentos, mercado de capitais, intermediacao financeira e assessoria estrategica.",
    k: ["banco", "horizon e banco"]
  },
  {
    q: "Qual e a diferenca entre um banco e uma corretora?",
    a: "Os bancos focam-se principalmente em contas bancarias, credito, pagamentos e servicos financeiros tradicionais.\n\nAs corretoras especializam-se em investimentos financeiros, estruturacao de produtos de mercado de capitais, gestao de liquidez e assessoria financeira.",
    k: ["diferenca", "banco corretora", "corretora"]
  }
];

/*
|--------------------------------------------------------------------------
| NORMALIZACAO
|--------------------------------------------------------------------------
*/

function normalizeText(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .replace(
      /^(a pergunta e|minha pergunta e|quero saber|gostaria de saber|por favor)\s+/,
      ""
    )
    .trim();
}

/*
|--------------------------------------------------------------------------
| VALIDACOES
|--------------------------------------------------------------------------
*/

function isGreeting(command) {
  return [
    "bom dia",
    "boa tarde",
    "boa noite",
    "ola",
    "oi",
    "hello",
    "hi",
    "saudacoes"
  ].includes(command);
}

function isThanks(command) {
  return [
    "obrigado",
    "obrigada",
    "muito obrigado",
    "muito obrigada",
    "thanks",
    "valeu"
  ].includes(command);
}

/*
|--------------------------------------------------------------------------
| PESQUISA FAQ
|--------------------------------------------------------------------------
*/

function findFaq(command) {
  let best = null;
  let bestScore = 0;

  faqs.forEach((faq) => {
    const question = normalizeText(faq.q);

    let score =
      question.includes(command) || command.includes(question)
        ? 2
        : 0;

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
| FORMATAR RESPOSTA
|--------------------------------------------------------------------------
*/

function formatAnswer(faq) {
  const greeting = getGreetingByTime();

  return (
    `${greeting}.\n\n` +
    `${faq.a}\n\n` +
    "Caso necessite de esclarecimentos adicionais, por favor contacte-nos pelo telefone +258 87 667 4944."
  );
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
      console.log("Escaneia o QR Code acima");
    }

    if (connection === "open") {
      console.log("BOT CONECTADO EM PRODUCAO");
    }

    if (connection === "close") {
      const reason =
        lastDisconnect?.error?.output?.statusCode;

      console.log("Conexao fechada. reason:", reason);

      const wasLoggedOut =
        reason === DisconnectReason.loggedOut;

      const wasReplaced =
        reason ===
          DisconnectReason.connectionReplaced ||
        reason === 440;

      if (wasLoggedOut) {
        console.log(
          "Logout detectado. Apague a pasta session e leia o QR novamente."
        );
        return;
      }

      if (wasReplaced) {
        console.log(
          "Sessao substituida por outra instancia. Pare os bots duplicados e reinicie apenas um."
        );
        return;
      }

      console.log("Reconectando em 5 segundos...");

      delay(5000).then(startBot);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message) return;
    if (msg.key.fromMe) return;

    const from = msg.key.remoteJid;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text;

    if (!text) return;

    const command = normalizeText(text);

    console.log("Mensagem recebida:", text);

    /*
    |--------------------------------------------------------------------------
    | AJUDA / INICIO
    |--------------------------------------------------------------------------
    */

    if (["ajuda", "inicio", "iniciar"].includes(command)) {
      const greeting = getGreetingByTime();

      await sock.sendMessage(from, {
        text:
          `${greeting}.\n\n` +
          "Seja bem-vindo(a) a Horizon Capital Dealer.\n\n" +
          "Estamos disponiveis para prestar informacoes sobre investimentos, mercado de capitais, abertura de conta e solucoes financeiras.\n\n" +
          "Por favor, escreva diretamente a sua questao."
      });

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | SAUDACOES
    |--------------------------------------------------------------------------
    */

    if (isGreeting(command)) {
      const greeting = getGreetingByTime();

      await sock.sendMessage(from, {
        text:
          `${greeting}.\n\n` +
          "Seja bem-vindo(a) a Horizon Capital Dealer.\n\n" +
          "Estamos disponiveis para prestar esclarecimentos sobre investimentos, mercado de capitais, abertura de conta e solucoes financeiras.\n\n" +
          "Por favor, envie a sua questao."
      });

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | AGRADECIMENTO
    |--------------------------------------------------------------------------
    */

    if (isThanks(command)) {
      const greeting = getGreetingByTime();

      await sock.sendMessage(from, {
        text:
          `${greeting}.\n\n` +
          "Agradecemos o seu contacto.\n\n" +
          "Permanecemos inteiramente disponiveis para qualquer esclarecimento adicional."
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
      await sock.sendMessage(from, {
        text: formatAnswer(matched)
      });

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | FALLBACK
    |--------------------------------------------------------------------------
    */

    const greeting = getGreetingByTime();

    await sock.sendMessage(from, {
      text:
        `${greeting}.\n\n` +
        "Nao foi possivel identificar a informacao pretendida com precisao.\n\n" +
        "Para um esclarecimento mais adequado e personalizado, por favor contacte-nos directamente pelo telefone +258 87 667 4944."
    });
  });
}

startBot();