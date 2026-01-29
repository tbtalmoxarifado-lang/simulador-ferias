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
    { nome: "Pessoa 01", email: "pessoa01@empresa.com", grupo: "ECOMP Guararema", perfil: "Funcionario", ativo: true },
    { nome: "Pessoa 02", email: "pessoa02@empresa.com", grupo: "ECOMP Guararema", perfil: "Funcionario", ativo: true },
    { nome: "Pessoa 03", email: "pessoa03@empresa.com", grupo: "ECOMP Guararema", perfil: "Funcionario", ativo: true },
    { nome: "Pessoa 04", email: "pessoa04@empresa.com", grupo: "ECOMP Guararema", perfil: "Funcionario", ativo: true },

    // ECOMP Taubaté (4)
    { nome: "Pessoa 05", email: "pessoa05@empresa.com", grupo: "ECOMP Taubaté", perfil: "Funcionario", ativo: true },
    { nome: "Pessoa 06", email: "pessoa06@empresa.com", grupo: "ECOMP Taubaté", perfil: "Funcionario", ativo: true },
    { nome: "Pessoa 07", email: "pessoa07@empresa.com", grupo: "ECOMP Taubaté", perfil: "Funcionario", ativo: true },
    { nome: "Pessoa 08", email: "pessoa08@empresa.com", grupo: "ECOMP Taubaté", perfil: "Funcionario", ativo: true },

    // Instalação (4)
    { nome: "Pessoa 09", email: "pessoa09@empresa.com", grupo: "Instalação", perfil: "Funcionario", ativo: true },
    { nome: "Pessoa 10", email: "pessoa10@empresa.com", grupo: "Instalação", perfil: "Funcionario", ativo: true },
    { nome: "Pessoa 11", email: "pessoa11@empresa.com", grupo: "Instalação", perfil: "Funcionario", ativo: true },
    { nome: "Pessoa 12", email: "pessoa12@empresa.com", grupo: "Instalação", perfil: "Funcionario", ativo: true },

    // Escritório (2)
    { nome: "Pessoa 13", email: "pessoa13@empresa.com", grupo: "Escritório", perfil: "Funcionario", ativo: true },
    { nome: "Pessoa 14", email: "pessoa14@empresa.com", grupo: "Escritório", perfil: "Funcionario", ativo: true },

    // Gestor (1)
    { nome: "Gestor", email: "gestor@empresa.com", grupo: "Gestor", perfil: "Gestor", ativo: true }
  ]
};