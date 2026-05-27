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
| MEMÓRIA DE UTILIZADOR
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

  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";

  return "Boa noite";
}

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
| BASE DE CONHECIMENTO
|--------------------------------------------------------------------------
*/

const faq = [
  {
    intent: "empresa",
    keywords: [
      "o que e horizon",
      "quem sao voces",
      "o que fazem",
      "horizon capital",
      "empresa",
      "sociedade financeira",
      "quem e a horizon",
      "qual e a empresa"
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
    intent: "autorizacao",
    keywords: [
      "autorizada",
      "licenca",
      "legal",
      "regulada",
      "segura",
      "autorizada a operar"
    ],
    answer:
      "A Horizon Capital Dealer opera em conformidade com a legislação aplicável e os requisitos regulatórios definidos pelas autoridades competentes."
  },

  {
    intent: "clientes",
    keywords: [
      "quem pode ser cliente",
      "clientes",
      "particulares",
      "empresas",
      "investidores institucionais"
    ],
    answer:
      "Prestamos serviços a particulares, empresas, investidores institucionais, fundos, seguradoras e clientes com elevada liquidez."
  },

  {
    intent: "investir",
    keywords: [
      "o que e investir",
      "significa investir",
      "como investir",
      "investimento"
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
      "por que investir"
    ],
    answer:
      "Investir pode ajudar a proteger capital, aumentar património, gerar rendimento e melhorar a gestão financeira, reduzindo o impacto da inflação ao longo do tempo."
  },

  {
    intent: "risco",
    keywords: [
      "risco",
      "todo investimento tem risco",
      "posso perder dinheiro"
    ],
    answer:
      "Sim.\n\nTodos os investimentos possuem algum nível de risco. O importante é investir de acordo com o perfil financeiro, objetivos, tolerância ao risco e conhecimento sobre o produto."
  },

  {
    intent: "perfil_investidor",
    keywords: [
      "perfil investidor",
      "o que e perfil",
      "perfil financeiro"
    ],
    answer:
      "O perfil de investidor é uma avaliação utilizada para compreender experiência, capacidade financeira, objetivos e tolerância ao risco.\n\nCom base nisso, identificamos investimentos mais adequados para cada cliente."
  },

  {
    intent: "sem_experiencia",
    keywords: [
      "sem experiencia",
      "nunca investi",
      "sou iniciante",
      "posso investir sem experiencia"
    ],
    answer:
      "Sim.\n\nA Horizon também foi criada para apoiar investidores com pouca experiência no mercado financeiro.\n\nA nossa equipa presta apoio educativo e orientação ao longo do processo."
  },

  {
    intent: "acoes",
    keywords: [
      "acoes",
      "o que sao acoes",
      "mercado de acoes"
    ],
    answer:
      "Acções são títulos de propriedade de uma empresa que representam uma fração do capital social da mesma, podendo ser negociadas no mercado de capitais."
  },

  {
    intent: "papel_comercial",
    keywords: [
      "papel comercial",
      "o que e papel comercial"
    ],
    answer:
      "O papel comercial é um título de dívida de curto prazo emitido por empresas para cobertura de necessidades imediatas de financiamento."
  },

  {
    intent: "abrir_conta",
    keywords: [
      "abrir conta",
      "como abrir conta",
      "abertura de conta",
      "criar conta"
    ],
    answer:
      "O processo normalmente inclui:\n\n1. Contacto inicial\n2. Entrega de documentos\n3. Processo KYC\n4. Avaliação do perfil de investidor\n5. Abertura da conta"
  },

  {
    intent: "kyc",
    keywords: [
      "kyc",
      "know your customer",
      "conheca o seu cliente"
    ],
    answer:
      "KYC significa 'Know Your Customer' ('Conheça o Seu Cliente').\n\nÉ um procedimento obrigatório utilizado para confirmar identidade, prevenir fraude, combater branqueamento de capitais e proteger clientes e o mercado financeiro."
  },

  {
    intent: "documentos",
    keywords: [
      "porque entregar documentos",
      "documentos",
      "origem dos fundos"
    ],
    answer:
      "A legislação exige que as instituições financeiras validem identidade, origem dos fundos e perfil do cliente."
  },

  {
    intent: "tempo_conta",
    keywords: [
      "quanto tempo demora",
      "demora abertura",
      "tempo abertura conta"
    ],
    answer:
      "O tempo de abertura depende da entrega correta dos documentos e da validação do processo de compliance."
  },

  {
    intent: "dados",
    keywords: [
      "dados protegidos",
      "seguranca",
      "privacidade",
      "meus dados"
    ],
    answer:
      "Sim.\n\nA Horizon trata toda informação dos clientes com confidencialidade e elevados padrões de segurança."
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
      "ajuda empresas",
      "credito empresarial"
    ],
    answer:
      "Sim.\n\nApoiamos empresas na identificação das soluções financeiras mais adequadas disponíveis no sistema financeiro nacional."
  },

  {
    intent: "bancos",
    keywords: [
      "trabalham com bancos",
      "relacao com bancos",
      "parceria bancos"
    ],
    answer:
      "A Horizon pode interagir institucionalmente com diferentes entidades financeiras no âmbito dos serviços prestados aos clientes."
  },

  {
    intent: "negociacao_bancaria",
    keywords: [
      "negociar melhores condicoes",
      "condicoes bancarias",
      "negociacao bancaria"
    ],
    answer:
      "Dependendo do perfil e necessidades do cliente, a Horizon pode apoiar na análise e negociação institucional de soluções disponíveis no mercado."
  },

  {
    intent: "mercado_capitais",
    keywords: [
      "mercado capitais",
      "o que e mercado capitais"
    ],
    answer:
      "O mercado de capitais é o mercado onde são transacionados instrumentos financeiros como acções, obrigações, títulos públicos e outros activos financeiros."
  },

  {
    intent: "garantia_retorno",
    keywords: [
      "garante retorno",
      "garantia lucro",
      "lucro garantido"
    ],
    answer:
      "Não.\n\nNenhuma instituição séria pode garantir retorno absoluto em qualquer cenário de mercado."
  },

  {
    intent: "reduzir_risco",
    keywords: [
      "reduzir riscos",
      "como reduzir risco",
      "gestao risco"
    ],
    answer:
      "A Horizon ajuda a reduzir riscos através de análise de mercado, avaliação de perfil, disciplina de risco, adequação de investimentos e acompanhamento estratégico."
  },

  {
    intent: "comecar_investir",
    keywords: [
      "por onde comecar",
      "como comecar",
      "primeiro passo investir"
    ],
    answer:
      "O primeiro passo é compreender os seus objetivos, perfil e horizonte financeiro.\n\nA Horizon pode ajudar nesse processo."
  },

  {
    intent: "educacao_financeira",
    keywords: [
      "educacao financeira",
      "aprendem investimentos",
      "literacia financeira"
    ],
    answer:
      "Sim.\n\nA educação financeira faz parte da visão institucional da Horizon Capital Dealer."
  },

  {
    intent: "importancia_literacia",
    keywords: [
      "porque literacia financeira",
      "importancia educacao financeira"
    ],
    answer:
      "Investidores mais informados tomam melhores decisões, reduzem erros financeiros e conseguem proteger melhor o seu património."
  },

  {
    intent: "contacto",
    keywords: [
      "telefone",
      "email",
      "contacto",
      "como falar",
      "falar com horizon"
    ],
    answer:
      "Pode contactar-nos através:\n\nTelefone: +258 87 667 4944\nE-mail: info@horizoncapital.co.mz"
  }
];

/*
|--------------------------------------------------------------------------
| DETEÇÃO DE INTENÇÃO
|--------------------------------------------------------------------------
*/

function findAnswer(input) {
  let bestMatch = null;
  let bestScore = 0;

  for (const item of faq) {
    let score = 0;

    for (const keyword of item.keywords) {
      const normalizedKeyword = normalize(keyword);

      if (input.includes(normalizedKeyword)) {
        score += 2;
      }

      const words = normalizedKeyword.split(" ");

      for (const word of words) {
        if (word.length > 3 && input.includes(word)) {
          score += 1;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  return bestScore >= 2 ? bestMatch : null;
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
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log("Escaneie o QR Code.");
    }

    if (connection === "open") {
      console.log("Bot conectado.");
    }

    if (connection === "close") {
      const reason =
        lastDisconnect?.error?.output?.statusCode;

      if (reason === DisconnectReason.loggedOut) {
        console.log("Sessão encerrada.");
        return;
      }

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

    const input = normalize(text);

    await sock.sendPresenceUpdate("composing", from);

    await delay(1200);

    let user = userMemory.get(from);

    /*
    |--------------------------------------------------------------------------
    | PRIMEIRO CONTACTO
    |--------------------------------------------------------------------------
    */

    if (!user) {
      userMemory.set(from, {
        name: null
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

      await sock.sendMessage(from, {
        text:
          `Muito obrigado, ${user.name}.\n\n` +
          "Como posso ajudar hoje?"
      });

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | FAQ
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
    | FALLBACK
    |--------------------------------------------------------------------------
    */

    await sock.sendMessage(from, {
      text:
        `${getGreetingByTime()}, ${user.name}.\n\n` +
        "Não consegui identificar claramente a sua solicitação.\n\n" +
        "Para um atendimento mais adequado, recomendamos contacto directo através do telefone +258 87 667 4944."
    });
  });
}

startBot();