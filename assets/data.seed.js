export const SEED = {
  version: 1,

  grupos: [
    "ECOMP Guararema",
    "ECOMP Taubaté",
    "Instalação",
    "Escritório",
    "Gestor"
  ],

  // Regras iniciais (edite conforme sua política)
  regras: [
    { grupo: "ECOMP Guararema", maxPorDia: 1, contaRascunho: false, mostrarNomes: false },
    { grupo: "ECOMP Taubaté",   maxPorDia: 1, contaRascunho: false, mostrarNomes: false },
    { grupo: "Instalação",      maxPorDia: 1, contaRascunho: false, mostrarNomes: false },
    { grupo: "Escritório",      maxPorDia: 1, contaRascunho: false, mostrarNomes: false },
    { grupo: "Gestor",          maxPorDia: 1, contaRascunho: false, mostrarNomes: true  }
  ],

  // Bloqueios (blackout) - exemplo (deixe vazio se não quiser)
  bloqueios: [
    // { inicio: "2026-12-01", fim: "2026-12-07", grupo: "Todos", motivo: "Período crítico" }
  ],

  // Usuários - TROQUE por nomes e e-mails reais
  // perfil: "Funcionario" | "Gestor" | "Admin"
  usuarios: [
    // ECOMP Guararema (4)
    { nome: "Pessoa 01", email: "francismar.matos@ntsbrasil.com", grupo: "ECOMP Guararema", perfil: "Técnico(a) de Gasodutos III", ativo: true },
    { nome: "Pessoa 02", email: "michel.santos@ntsbrasil.com", grupo: "ECOMP Guararema", perfil: "Técnico(a) de Gasodutos II", ativo: true },
    { nome: "Pessoa 03", email: "rildo.santiago@ntsbrasil.com", grupo: "ECOMP Guararema", perfil: "Técnico(a) de Gasodutos III", ativo: true },
    { nome: "Pessoa 04", email: "rafael.vinicius@ntsbrasil.com", grupo: "ECOMP Guararema", perfil: "Técnico(a) de Gasodutos I", ativo: true },

    // ECOMP Taubaté (4)
    { nome: "Pessoa 05", email: "elton.lobo@ntsbrasil.com", grupo: "ECOMP Taubaté", perfil: "Técnico(a) de Gasodutos III", ativo: true },
    { nome: "Pessoa 06", email: "joao.franca@ntsbrasil.com", grupo: "ECOMP Taubaté", perfil: "Técnico(a) de Gasodutos II", ativo: true },
    { nome: "Pessoa 07", email: "naldson.rodrigues@ntsbrasil.com", grupo: "ECOMP Taubaté", perfil: "Técnico(a) de Gasodutos I", ativo: true },
    { nome: "Pessoa 08", email: "odenilson.arruda@ntsbrasil.com", grupo: "ECOMP Taubaté", perfil: "Técnico(a) de Gasodutos II", ativo: true },

    // Instalação (4)
    { nome: "Pessoa 09", email: "henrique.silva@ntsbrasil.com", grupo: "Instalação", perfil: "Técnico(a) de Gasodutos II", ativo: true },
    { nome: "Pessoa 10", email: "marcio.godinho@ntsbrasil.com", grupo: "Instalação", perfil: "Técnico(a) de Gasodutos II", ativo: true },
    { nome: "Pessoa 11", email: "rafael.bondia@ntsbrasil.com", grupo: "Instalação", perfil: "Técnico(a) de Gasodutos II", ativo: true },
    { nome: "Pessoa 12", email: "sabrina.lopes@ntsbrasil.com", grupo: "Instalação", perfil: "Técnico(a) de Gasodutos I", ativo: true },

    // Escritório (2)
    { nome: "Pessoa 13", email: "ali.mohammadi@ntsbrasil.com", grupo: "Escritório", perfil: "Assistente de Gasodutos", ativo: true },
    { nome: "Pessoa 14", email: "alexandra.figueira@ntsbrasil.com", grupo: "Escritório", perfil: "Técnico(a) de PCM I", ativo: true },

    // Gestor (1)
    { nome: "Gestor", email: "fernando.gomes@ntsbrasil.com", grupo: "Gestor", perfil: "Gestor", ativo: true }
  ]
};
