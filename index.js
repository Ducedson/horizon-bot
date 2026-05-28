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
| STOP WORDS
|--------------------------------------------------------------------------
*/

function removeStopWords(text) {

  const stopWords = [
    "a",
    "o",
    "os",
    "as",
    "de",
    "da",
    "do",
    "das",
    "dos",
    "e",
    "ou",
    "para",
    "por",
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
| VALIDAR NOME
|--------------------------------------------------------------------------
*/

function looksLikeName(text) {

  const value = normalize(text);

  if (value.length < 2) {
    return false;
  }

  const invalidNames = [
    "ola",
    "oi",
    "bom dia",
    "boa tarde",
    "boa noite",
    "tudo bem",
    "sim",
    "nao",
    "quero investir",
    "investir",
    "como investir",
    "como fazer"
  ];

  if (invalidNames.includes(value)) {
    return false;
  }

  const words = value.split(" ");

  if (words.length > 3) {
    return false;
  }

  return true;
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
      "vocês sao banco",
      "banco comercial"
    ],
    answer:
      "Não.\n\nA Horizon Capital Dealer não é um banco comercial. Somos uma sociedade financeira especializada em investimentos financeiros em mercado de capitais, intermediação financeira e assessoria estratégica."
  },

  {
    intent: "investir",
    keywords: [
      "investir",
      "quero investir",
      "como investir",
      "investimento",
      "aplicar dinheiro",
      "comecar investir"
    ],
    answer:
      "Investir significa aplicar recursos financeiros com o objetivo de obter retorno futuro.\n\nA Horizon Capital Dealer pode ajudá-lo(a) a identificar soluções adequadas ao seu perfil financeiro e objetivos."
  },

  {
    intent: "porque_investir",
    keywords: [
      "porque investir",
      "vantagem investir",
      "vale a pena investir"
    ],
    answer:
      "Investir pode ajudar a proteger capital, aumentar património, gerar rendimento e melhorar a gestão financeira."
  },

  {
    intent: "risco",
    keywords: [
      "risco",
      "perder dinheiro",
      "investimento seguro"
    ],
    answer:
      "Todos os investimentos possuem algum nível de risco. O importante é investir de acordo com o perfil financeiro, objetivos e tolerância ao risco."
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
      "O processo normalmente inclui:\n\n1. Contacto inicial\n2. Entrega de documentos\n3. Processo KYC\n4. Avaliação do perfil de investidor\n5. Abertura da conta."
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
      "contactar",
      "falar convosco",
      "localizacao",
      "onde ficam",
      "morada"
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

      score += matchedWords * 3;

      /*
      |--------------------------------------------------------------------------
      | MATCH INTELIGENTE
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

        await delay(1000);

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
            lastIntent: null
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

          /*
          |--------------------------------------------------------------------------
          | EVITAR SAUDAÇÕES COMO NOME
          |--------------------------------------------------------------------------
          */

          if (!looksLikeName(text)) {

            /*
            |--------------------------------------------------------------------------
            | SAUDAÇÃO
            |--------------------------------------------------------------------------
            */

            if (isGreeting(input)) {

              await sock.sendMessage(from, {
                text:
                  `${getGreetingByTime()}.\n\n` +
                  "Será um prazer atendê-lo(a).\n\n" +
                  "Antes de continuarmos, poderia por gentileza informar o seu nome?"
              });

              return;
            }

            /*
            |--------------------------------------------------------------------------
            | FAQ ANTES DO NOME
            |--------------------------------------------------------------------------
            */

            const matchedBeforeName =
              findAnswer(input);

            if (matchedBeforeName) {

              await sock.sendMessage(from, {
                text:
                  `${matchedBeforeName.answer}\n\n` +
                  "Para continuarmos o atendimento de forma personalizada, poderia por gentileza informar o seu nome?"
              });

              return;
            }

            await sock.sendMessage(from, {
              text:
                "Peço por gentileza que informe o seu nome para continuarmos o atendimento."
            });

            return;
          }

          /*
          |--------------------------------------------------------------------------
          | GUARDAR NOME
          |--------------------------------------------------------------------------
          */

          user.name = text.trim();

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
              "Permanecemos disponíveis para qualquer esclarecimento adicional."
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

          user.lastIntent =
            matched.intent;

          userMemory.set(from, user);

          await sock.sendMessage(from, {
            text:
              `${getGreetingByTime()}, ${user.name}.\n\n` +
              matched.answer
          });

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | CONTEXTO INTELIGENTE
        |--------------------------------------------------------------------------
        */

        if (
          user.lastIntent === "investir" &&
          (
            input.includes("como") ||
            input.includes("fazer") ||
            input.includes("comecar")
          )
        ) {

          await sock.sendMessage(from, {
            text:
              `${getGreetingByTime()}, ${user.name}.\n\n` +
              "O primeiro passo para investir é compreender os seus objetivos financeiros, perfil de risco e horizonte de investimento.\n\n" +
              "A Horizon Capital Dealer pode apoiar em todo o processo de forma estruturada e personalizada."
          });

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | CONTACTO RÁPIDO
        |--------------------------------------------------------------------------
        */

        if (
          input.includes("contactar") ||
          input.includes("telefone") ||
          input.includes("email") ||
          input.includes("localizacao") ||
          input.includes("morada")
        ) {

          await sock.sendMessage(from, {
            text:
              `${getGreetingByTime()}, ${user.name}.\n\n` +
              "Pode contactar-nos através:\n\n" +
              "Telefone: +258 87 667 4944\n" +
              "E-mail: info@horizoncapital.co.mz"
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