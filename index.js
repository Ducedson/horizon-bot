const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");

/*
|--------------------------------------------------------------------------
| DELAY
|--------------------------------------------------------------------------
*/

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/*
|--------------------------------------------------------------------------
| MEMÓRIA
|--------------------------------------------------------------------------
*/

const userMemory = new Map();

/*
|--------------------------------------------------------------------------
| SAUDAÇÃO
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
| NORMALIZAÇÃO
|--------------------------------------------------------------------------
*/

function normalize(text = "") {

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
| REMOVER PALAVRAS IRRELEVANTES
|--------------------------------------------------------------------------
*/

function removeStopWords(text) {

  const stopWords = [
    "a",
    "o",
    "as",
    "os",
    "de",
    "da",
    "do",
    "das",
    "dos",
    "e",
    "ou",
    "por",
    "para",
    "com",
    "sem",
    "um",
    "uma",
    "que",
    "como",
    "qual",
    "quais",
    "gostaria",
    "queria",
    "preciso",
    "saber",
    "entender",
    "sobre"
  ];

  return text
    .split(" ")
    .filter(word =>
      !stopWords.includes(word)
    );
}

/*
|--------------------------------------------------------------------------
| SAUDAÇÕES
|--------------------------------------------------------------------------
*/

function isGreeting(text) {

  const greetings = [
    "ola",
    "oi",
    "bom dia",
    "boa tarde",
    "boa noite",
    "saudacoes",
    "hello",
    "hi",
    "tudo bem"
  ];

  return greetings.some(item =>
    text.includes(item)
  );
}

/*
|--------------------------------------------------------------------------
| AGRADECIMENTOS
|--------------------------------------------------------------------------
*/

function isThanks(text) {

  const thanks = [
    "obrigado",
    "obrigada",
    "agradeco",
    "valeu",
    "thanks",
    "muito obrigado",
    "muito obrigada"
  ];

  return thanks.some(item =>
    text.includes(item)
  );
}

/*
|--------------------------------------------------------------------------
| FAQ
|--------------------------------------------------------------------------
*/

const faq = [

  {
    intent: "empresa",
    keywords: [
      "o que e horizon",
      "quem sao voces",
      "o que fazem",
      "empresa",
      "sociedade financeira",
      "horizon capital",
      "quem e a horizon"
    ],
    answer:
      "A Horizon Capital Dealer é uma sociedade financeira de corretagem especializada em investimentos, mercado de capitais, soluções de tesouraria e assessoria financeira estratégica.\n\nApoiamos particulares, empresas e investidores institucionais no acesso estruturado, seguro e eficiente ao mercado financeiro."
  },

  {
    intent: "banco",
    keywords: [
      "horizon e banco",
      "e banco",
      "vocês são banco",
      "banco comercial"
    ],
    answer:
      "Não.\n\nA Horizon Capital Dealer não é um banco comercial. Somos uma sociedade financeira especializada em investimentos financeiros em mercado de capitais, intermediação financeira e assessoria estratégica."
  },

  {
    intent: "diferenca_banco_corretora",
    keywords: [
      "diferenca banco corretora",
      "corretora",
      "qual a diferenca",
      "banco e corretora"
    ],
    answer:
      "Os bancos focam-se principalmente em contas bancárias, crédito, pagamentos e serviços financeiros tradicionais.\n\nAs corretoras especializam-se em investimentos financeiros, estruturação de produtos de mercado de capitais, gestão de liquidez e assessoria financeira."
  },

  {
    intent: "investir",
    keywords: [
      "investir",
      "o que e investir",
      "como investir",
      "investimento",
      "aplicar dinheiro"
    ],
    answer:
      "Investir significa aplicar recursos financeiros com o objetivo de obter retorno futuro."
  },

  {
    intent: "porque_investir",
    keywords: [
      "porque investir",
      "vantagem investir",
      "vale a pena investir",
      "crescer dinheiro"
    ],
    answer:
      "Investir pode ajudar a proteger capital, aumentar património, gerar rendimento e melhorar a gestão financeira."
  },

  {
    intent: "risco",
    keywords: [
      "risco",
      "perder dinheiro",
      "investimento seguro",
      "todo investimento tem risco"
    ],
    answer:
      "Todos os investimentos possuem algum nível de risco. O importante é investir de acordo com o perfil financeiro e os objetivos do cliente."
  },

  {
    intent: "perfil_investidor",
    keywords: [
      "perfil investidor",
      "perfil financeiro",
      "tolerancia risco"
    ],
    answer:
      "O perfil de investidor é uma avaliação utilizada para compreender experiência, capacidade financeira, objetivos e tolerância ao risco."
  },

  {
    intent: "abrir_conta",
    keywords: [
      "abrir conta",
      "como abrir conta",
      "abertura conta",
      "criar conta"
    ],
    answer:
      "O processo normalmente inclui contacto inicial, entrega de documentos, processo KYC, avaliação do perfil de investidor e abertura da conta."
  },

  {
    intent: "kyc",
    keywords: [
      "kyc",
      "know your customer",
      "conheca cliente"
    ],
    answer:
      "KYC significa 'Know Your Customer'.\n\nÉ um procedimento obrigatório utilizado para confirmar identidade, prevenir fraude e combater branqueamento de capitais."
  },

  {
    intent: "documentos",
    keywords: [
      "documentos",
      "bi",
      "passaporte",
      "origem fundos"
    ],
    answer:
      "A legislação exige validação de identidade, origem dos fundos e perfil do cliente."
  },

  {
    intent: "tempo_conta",
    keywords: [
      "quanto tempo demora",
      "tempo abertura",
      "demora conta"
    ],
    answer:
      "O tempo de abertura depende da entrega correta dos documentos e da validação do processo de compliance."
  },

  {
    intent: "dados",
    keywords: [
      "dados protegidos",
      "privacidade",
      "seguranca"
    ],
    answer:
      "A Horizon trata toda informação dos clientes com confidencialidade e elevados padrões de segurança."
  },

  {
    intent: "consultoria",
    keywords: [
      "consultoria",
      "assessoria",
      "servicos",
      "consultoria financeira"
    ],
    answer:
      "Prestamos serviços de consultoria financeira, assessoria de investimentos, corporate finance, soluções de tesouraria e assessoria bancária."
  },

  {
    intent: "financiamento",
    keywords: [
      "financiamento",
      "credito empresarial",
      "ajuda empresas"
    ],
    answer:
      "Apoiamos empresas na identificação das soluções financeiras mais adequadas disponíveis no sistema financeiro nacional."
  },

  {
    intent: "mercado_capitais",
    keywords: [
      "mercado capitais",
      "acoes",
      "obrigacoes",
      "titulos"
    ],
    answer:
      "O mercado de capitais é o mercado onde são transacionados instrumentos financeiros como acções, obrigações e títulos públicos."
  },

  {
    intent: "contacto",
    keywords: [
      "telefone",
      "email",
      "contacto",
      "falar convosco",
      "localizacao",
      "onde ficam"
    ],
    answer:
      "Pode contactar-nos através:\n\nTelefone: +258 87 667 4944\nE-mail: info@horizoncapital.co.mz"
  }

];

/*
|--------------------------------------------------------------------------
| MATCHING INTELIGENTE
|--------------------------------------------------------------------------
*/

function findAnswer(input) {

  let bestMatch = null;
  let bestScore = 0;

  const cleanWords =
    removeStopWords(input);

  for (const item of faq) {

    let score = 0;

    for (const keyword of item.keywords) {

      const normalizedKeyword =
        normalize(keyword);

      /*
      |--------------------------------------------------------------------------
      | MATCH EXATO
      |--------------------------------------------------------------------------
      */

      if (
        input.includes(normalizedKeyword)
      ) {
        score += 20;
      }

      /*
      |--------------------------------------------------------------------------
      | MATCH POR PALAVRAS
      |--------------------------------------------------------------------------
      */

      const keywordWords =
        removeStopWords(normalizedKeyword);

      let matchedWords = 0;

      for (const word of keywordWords) {

        if (
          cleanWords.includes(word)
        ) {
          matchedWords++;
        }
      }

      /*
      |--------------------------------------------------------------------------
      | SCORE INTELIGENTE
      |--------------------------------------------------------------------------
      */

      score += matchedWords * 3;

      /*
      |--------------------------------------------------------------------------
      | FRASES PARECIDAS
      |--------------------------------------------------------------------------
      */

      if (
        matchedWords >=
        Math.ceil(keywordWords.length / 2)
      ) {
        score += 8;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  if (bestScore >= 6) {
    return bestMatch;
  }

  return null;
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

  /*
  |--------------------------------------------------------------------------
  | CONEXÃO
  |--------------------------------------------------------------------------
  */

  sock.ev.on("connection.update", (update) => {

    const {
      connection,
      qr,
      lastDisconnect
    } = update;

    if (qr) {

      qrcode.generate(qr, {
        small: true
      });

      console.log("Escaneie o QR Code.");
    }

    if (connection === "open") {
      console.log("Bot conectado.");
    }

    if (connection === "close") {

      const reason =
        lastDisconnect?.error?.output?.statusCode;

      if (
        reason === DisconnectReason.loggedOut
      ) {
        console.log("Sessão encerrada.");
        return;
      }

      console.log("Reconectando...");

      setTimeout(() => {
        startBot();
      }, 5000);
    }
  });

  /*
  |--------------------------------------------------------------------------
  | MENSAGENS
  |--------------------------------------------------------------------------
  */

  sock.ev.on(
    "messages.upsert",
    async ({ messages }) => {

      try {

        const msg = messages[0];

        if (!msg) return;

        if (!msg.message) return;

        if (msg.key.fromMe) return;

        const from =
          msg.key.remoteJid;

        const text =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          msg.message?.videoMessage?.caption;

        if (!text) return;

        console.log("=================================");
        console.log("NOVA MENSAGEM");
        console.log("FROM:", from);
        console.log("TEXT:", text);
        console.log("=================================");

        const input =
          normalize(text);

        await sock.sendPresenceUpdate(
          "composing",
          from
        );

        await delay(1200);

        let user =
          userMemory.get(from);

        /*
        |--------------------------------------------------------------------------
        | PRIMEIRO CONTACTO
        |--------------------------------------------------------------------------
        */

        if (!user) {

          userMemory.set(from, {
            name: null,
            pendingQuestion: text
          });

          await sock.sendMessage(from, {
            text:
              `${getGreetingByTime()}.\n\n` +
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

          user.name = text.trim();

          userMemory.set(from, user);

          const originalQuestion =
            user.pendingQuestion || "";

          if (originalQuestion) {

            const matched =
              findAnswer(
                normalize(originalQuestion)
              );

            if (matched) {

              await sock.sendMessage(from, {
                text:
                  `Muito obrigado, ${user.name}.\n\n` +
                  matched.answer
              });

              user.pendingQuestion = null;

              userMemory.set(from, user);

              return;
            }
          }

          await sock.sendMessage(from, {
            text:
              `Muito obrigado, ${user.name}.\n\n` +
              "Como posso ajudar hoje?"
          });

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | SAUDAÇÕES
        |--------------------------------------------------------------------------
        */

        if (isGreeting(input)) {

          await sock.sendMessage(from, {
            text:
              `${getGreetingByTime()}, ${user.name}.\n\n` +
              "Espero que esteja bem.\n\n" +
              "Como posso ajudar hoje relativamente à Horizon Capital Dealer?"
          });

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | AGRADECIMENTOS
        |--------------------------------------------------------------------------
        */

        if (isThanks(input)) {

          await sock.sendMessage(from, {
            text:
              `${getGreetingByTime()}, ${user.name}.\n\n` +
              "Agradecemos o seu contacto.\n\n" +
              "Permanecemos inteiramente disponíveis para qualquer esclarecimento adicional."
          });

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | FAQ
        |--------------------------------------------------------------------------
        */

        const matched =
          findAnswer(input);

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
        | FALLBACK
        |--------------------------------------------------------------------------
        */

        await sock.sendMessage(from, {
          text:
            `${getGreetingByTime()}, ${user.name}.\n\n` +
            "Não consegui identificar claramente a sua solicitação.\n\n" +
            "Para um atendimento mais adequado, recomendamos contacto directo através do telefone +258 87 667 4944."
        });

      } catch (err) {

        console.log("ERRO:");
        console.log(err);

      }
    }
  );
}

startBot();