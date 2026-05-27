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
| MEMÓRIA SIMPLES DE USUÁRIO
|--------------------------------------------------------------------------
*/

const userMemory = new Map();

/*
|--------------------------------------------------------------------------
| SAUDAÇÃO FORMAL
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
| BASE DE CONHECIMENTO (FAQ OFICIAL)
|--------------------------------------------------------------------------
*/

const faq = [
  {
    intent: "o_que_e_horizon",
    keywords: ["o que e", "quem e", "horizon capital", "o que significa horizon"],
    answer:
      "A Horizon Capital Dealer é uma sociedade financeira de corretagem especializada em investimentos, mercado de capitais, soluções de tesouraria e assessoria financeira estratégica.\n\nAjudamos particulares, empresas e investidores institucionais a acederem ao mercado financeiro de forma estruturada, segura e eficiente."
  },
  {
    intent: "horizon_e_banco",
    keywords: ["banco", "horizon e banco", "é um banco"],
    answer:
      "Não.\n\nA Horizon Capital Dealer não é um banco comercial. Somos uma sociedade financeira especializada em investimentos financeiros em mercado de capitais, intermediação financeira e assessoria estratégica."
  },
  {
    intent: "diferenca_banco_corretora",
    keywords: ["diferenca", "banco e corretora", "corretora"],
    answer:
      "Os bancos focam-se principalmente em contas bancárias, crédito, pagamentos e serviços tradicionais.\n\nAs corretoras especializam-se em investimentos financeiros, estruturação de produtos em mercado de capitais, gestão de liquidez e assessoria financeira."
  },
  {
    intent: "o_que_e_investir",
    keywords: ["investir", "o que e investir", "significa investir"],
    answer:
      "Investir significa aplicar recursos financeiros com o objetivo de obter retorno futuro."
  },
  {
    intent: "porque_investir",
    keywords: ["porque investir", "vantagens investir", "por que investir"],
    answer:
      "Investir ajuda a proteger capital, aumentar património, gerar rendimento e melhorar a gestão financeira, reduzindo o impacto da inflação ao longo do tempo."
  },
  {
    intent: "risco_investimento",
    keywords: ["risco", "todo investimento tem risco"],
    answer:
      "Sim. Todos os investimentos possuem algum nível de risco. O importante é investir de acordo com o perfil financeiro, objetivos, tolerância ao risco e conhecimento do produto."
  },
  {
    intent: "perfil_investidor",
    keywords: ["perfil de investidor", "o que e perfil", "investidor"],
    answer:
      "É uma avaliação utilizada para compreender a experiência, capacidade financeira, objetivos e tolerância ao risco do cliente. Com base nisso, são identificados investimentos mais adequados."
  },
  {
    intent: "abrir_conta",
    keywords: ["abrir conta", "como abrir conta", "abertura de conta"],
    answer:
      "O processo normalmente inclui contacto inicial, entrega de documentos, processo KYC, avaliação do perfil de investidor e abertura da conta."
  },
  {
    intent: "kyc",
    keywords: ["kyc", "conheca o cliente"],
    answer:
      "KYC significa Know Your Customer (Conheça o Seu Cliente). É um procedimento obrigatório para confirmar identidade, prevenir fraude e combater branqueamento de capitais."
  },
  {
    intent: "contacto",
    keywords: ["contacto", "como falar", "telefone", "email"],
    answer:
      "Pode contactar-nos através do telefone +258 87 667 4944 ou do e-mail info@horizoncapital.co.mz."
  }
];

/*
|--------------------------------------------------------------------------
| NORMALIZAÇÃO
|--------------------------------------------------------------------------
*/

function normalize(text) {
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
| DETECÇÃO DE INTENÇÃO (MELHORADA)
|--------------------------------------------------------------------------
*/

function findAnswer(input) {
  let best = null;
  let bestScore = 0;

  for (const item of faq) {
    let score = 0;

    for (const k of item.keywords) {
      if (input.includes(normalize(k))) {
        score += 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

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
    browser: ["Horizon IA", "Chrome", "1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const reason =
        lastDisconnect?.error?.output?.statusCode;

      if (reason === DisconnectReason.loggedOut) return;

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

    const input = normalize(text);

    await sock.sendPresenceUpdate("composing", from);
    await delay(900);

    /*
    |--------------------------------------------------------------------------
    | MEMÓRIA DE NOME
    |--------------------------------------------------------------------------
    */

    let user = userMemory.get(from);

    /*
    |--------------------------------------------------------------------------
    | PRIMEIRO CONTACTO (PEDIR NOME)
    |--------------------------------------------------------------------------
    */

    if (!user) {
      userMemory.set(from, { name: null });

      await sock.sendMessage(from, {
        text:
          `${getGreetingByTime()},\n\n` +
          "Eu sou o Horizon IA, Assistente Inteligente da Horizon Capital Dealer.\n\n" +
          "Por gentileza, poderia partilhar o seu nome para que eu possa atendê-lo(a) de forma mais próxima e personalizada?"
      });

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | CAPTURA DE NOME
    |--------------------------------------------------------------------------
    */

    if (!user.name) {
      user.name = text;
      userMemory.set(from, user);

      await sock.sendMessage(from, {
        text:
          `Muito obrigado, ${user.name}.\n\n` +
          "Como posso ajudar hoje?"
      });

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | FAQ MATCHING
    |--------------------------------------------------------------------------
    */

    const matched = findAnswer(input);

    if (matched) {
      await sock.sendMessage(from, {
        text:
          `${getGreetingByTime()}, ${user.name}.\n\n` +
          matched.answer
      });

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | FALLBACK PROFISSIONAL
    |--------------------------------------------------------------------------
    */

    await sock.sendMessage(from, {
      text:
        `${getGreetingByTime()}, ${user.name}.\n\n` +
        "Não consegui identificar claramente a sua solicitação.\n\n" +
        "Para um atendimento mais preciso, pode contactar-nos através do telefone +258 87 667 4944 ou reformular a sua pergunta."
    });
  });
}

startBot();