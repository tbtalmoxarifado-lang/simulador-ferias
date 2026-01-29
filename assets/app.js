import { SEED } from "./data.seed.js";
import { Storage, dateDiffDays, rangesOverlap, eachDay, escapeHTML, parseISO, iso } from "./utils.js";

// ----------------------
// CHAVES LOCALSTORAGE
// ----------------------
const K = {
  boot: "sim.boot",
  usuarios: "sim.usuarios",
  regras: "sim.regras",
  bloqueios: "sim.bloqueios",
  cenarios: "sim.cenarios",
  periodos: "sim.periodos",
  session: "sim.session",
};

// ----------------------
// BOOT / SEED
// ----------------------
function bootstrapIfNeeded(){
  const boot = Storage.get(K.boot, null);
  if(!boot || boot.version !== SEED.version){
    Storage.set(K.usuarios, SEED.usuarios);
    Storage.set(K.regras, SEED.regras);
    Storage.set(K.bloqueios, SEED.bloqueios);
    Storage.set(K.cenarios, []);
    Storage.set(K.periodos, []);
    Storage.set(K.boot, { version: SEED.version, at: Date.now() });
  }
}

// ----------------------
// STATE
// ----------------------
let session = Storage.get(K.session, null); // { email, privacyOverride }
let route = "myscenarios"; // myscenarios | editor | calendar | admin
let editingScenarioId = null;

// ----------------------
// SELECTORS
// ----------------------
const $ = (q)=> document.querySelector(q);

const viewLogin = $("#view-login");
const viewApp = $("#view-app");
const userbox = $("#userbox");
const whoami = $("#whoami");

const routeMyScenarios = $("#route-myscenarios");
const routeEditor = $("#route-editor");
const routeCalendar = $("#route-calendar");
const routeAdmin = $("#route-admin");

// Buttons
const btnLogin = $("#btnLogin");
const btnResetAll = $("#btnResetAll");
const btnLogout = $("#btnLogout");
const btnNewScenario = $("#btnNewScenario");
const btnGoMyScenarios = $("#btnGoMyScenarios");
const btnGoCalendar = $("#btnGoCalendar");

// Login inputs
const emailInput = $("#email");
const privacyMode = $("#privacyMode");

// ----------------------
// HELPERS: DB
// ----------------------
const db = {
  usuarios(){ return Storage.get(K.usuarios, []); },
  regras(){ return Storage.get(K.regras, []); },
  bloqueios(){ return Storage.get(K.bloqueios, []); },
  cenarios(){ return Storage.get(K.cenarios, []); },
  periodos(){ return Storage.get(K.periodos, []); },

  setUsuarios(v){ Storage.set(K.usuarios, v); },
  setRegras(v){ Storage.set(K.regras, v); },
  setBloqueios(v){ Storage.set(K.bloqueios, v); },
  setCenarios(v){ Storage.set(K.cenarios, v); },
  setPeriodos(v){ Storage.set(K.periodos, v); },
};

function getUserByEmail(email){
  return db.usuarios().find(u => u.ativo && u.email.toLowerCase() === email.toLowerCase());
}

function getRegra(grupo){
  return db.regras().find(r => r.grupo === grupo) || { maxPorDia: 1, contaRascunho: false, mostrarNomes: false };
}

// ----------------------
// VALIDATION
// ----------------------
function isBlocked(grupo, inicio, fim){
  const blocks = db.bloqueios().filter(b => b.ativo !== false);
  const hit = blocks.find(b =>
    (b.grupo === "Todos" || b.grupo === grupo) &&
    rangesOverlap(inicio, fim, b.inicio, b.fim)
  );
  return hit ? { blocked:true, motivo: hit.motivo || "Bloqueio" } : { blocked:false };
}

function scenariosThatCount(regra){
  // Se conta rascunho, contam cenários Rascunho e Fechado, senão somente Fechado
  return regra.contaRascunho ? ["Rascunho","Fechado"] : ["Fechado"];
}

function countGroupOnDay(grupo, dayISO, statuses){
  const cenarios = db.cenarios();
  const periodos = db.periodos();
  let count = 0;
  for(const p of periodos){
    const sc = cenarios.find(c => c.id === p.cenarioId);
    if(!sc) continue;
    if(sc.grupo !== grupo) continue;
    if(!statuses.includes(sc.status)) continue;
    if(p.inicio <= dayISO && p.fim >= dayISO) count++;
  }
  return count;
}

function validateRange(grupo, inicio, fim){
  const regra = getRegra(grupo);
  const statuses = scenariosThatCount(regra);

  // Bloqueio
  const blk = isBlocked(grupo, inicio, fim);
  if(blk.blocked){
    return { resultado:"Bloqueado", detalhe:`Bloqueado: ${blk.motivo}`, regra };
  }

  // Conflito por dia (preciso)
  const days = eachDay(inicio, fim);
  const over = [];
  for(const d of days){
    const qtd = countGroupOnDay(grupo, d, statuses);
    if(qtd >= regra.maxPorDia){
      over.push({ dia:d, qtd });
    }
  }

  if(over.length){
    return { resultado:"Conflito", detalhe:`Conflito: excede limite do grupo (${regra.maxPorDia}/dia)`, regra, over };
  }

  return { resultado:"OK", detalhe:"Sem conflitos.", regra };
}

// ----------------------
// CRUD
// ----------------------
function uid(){
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function createScenario(user, nome){
  const cenarios = db.cenarios();
  const id = uid();
  cenarios.push({
    id,
    nome: nome || `Cenário ${new Date().toLocaleString("pt-BR")}`,
    criadoPor: user.email,
    grupo: user.grupo,
    status: "Rascunho",
    obs: "",
    createdAt: Date.now()
  });
  db.setCenarios(cenarios);
  return id;
}

function updateScenario(id, patch){
  const cenarios = db.cenarios();
  const idx = cenarios.findIndex(c => c.id === id);
  if(idx >= 0){
    cenarios[idx] = { ...cenarios[idx], ...patch };
    db.setCenarios(cenarios);
  }
}

function deleteScenario(id){
  db.setCenarios(db.cenarios().filter(c => c.id !== id));
  db.setPeriodos(db.periodos().filter(p => p.cenarioId !== id));
}

function addPeriod(cenarioId, inicio, fim, resultado, detalhe){
  const periodos = db.periodos();
  periodos.push({
    id: uid(),
    cenarioId,
    inicio, fim,
    dias: dateDiffDays(inicio, fim),
    resultado,
    detalhe,
    createdAt: Date.now()
  });
  db.setPeriodos(periodos);
}

function deletePeriod(periodId){
  db.setPeriodos(db.periodos().filter(p => p.id !== periodId));
}

// ----------------------
// AUTH / SESSION
// ----------------------
function setSession(s){
  session = s;
  Storage.set(K.session, s);
}
function clearSession(){
  session = null;
  Storage.del(K.session);
}

// ----------------------
// ROUTING
// ----------------------
function showRoute(name){
  route = name;
  routeMyScenarios.classList.toggle("hidden", name !== "myscenarios");
  routeEditor.classList.toggle("hidden", name !== "editor");
  routeCalendar.classList.toggle("hidden", name !== "calendar");
  routeAdmin.classList.toggle("hidden", name !== "admin");
  render();
}

// ----------------------
// RENDER
// ----------------------
function renderHeader(user){
  if(!user){
    userbox.innerHTML = `<span class="pill pill-muted">Offline</span>`;
    return;
  }
  const badge = user.perfil === "Gestor" || user.perfil === "Admin"
    ? `<span class="pill">Perfil: ${escapeHTML(user.perfil)}</span>`
    : `<span class="pill pill-muted">Perfil: ${escapeHTML(user.perfil)}</span>`;

  userbox.innerHTML = `
    <span class="pill">${escapeHTML(user.nome)}</span>
    <span class="pill pill-muted">${escapeHTML(user.grupo)}</span>
    ${badge}
  `;
}

function render(){
  bootstrapIfNeeded();

  const user = session ? getUserByEmail(session.email) : null;
  const logged = !!user;

  viewLogin.classList.toggle("hidden", logged);
  viewApp.classList.toggle("hidden", !logged);

  renderHeader(user);

  if(!logged) return;

  whoami.textContent = `Logado como ${user.nome} (${user.email}) — Grupo: ${user.grupo} — Privacidade: ${
    session.privacyOverride === "names" ? "Nomes (no grupo)" : "Somente contagem"
  }`;

  // Render routes
  if(route === "myscenarios") renderMyScenarios(user);
  if(route === "editor") renderEditor(user);
  if(route === "calendar") renderCalendar(user);
  if(route === "admin") renderAdmin(user);

  // Show admin route button conditionally
  // (Acesso: Gestor/Admin)
  const canAdmin = user.perfil === "Gestor" || user.perfil === "Admin";
  if(canAdmin){
    // add admin button if not exists
    if(!$("#btnGoAdmin")){
      const btn = document.createElement("button");
      btn.className = "btn btn-ghost";
      btn.id = "btnGoAdmin";
      btn.textContent = "Configurações (Gestor)";
      btn.onclick = ()=> showRoute("admin");
      document.querySelector(".toolbar-actions").prepend(btn);
    }
  } else {
    const b = $("#btnGoAdmin");
    if(b) b.remove();
  }
}

function renderMyScenarios(user){
  const cenarios = db.cenarios()
    .filter(c => c.criadoPor.toLowerCase() === user.email.toLowerCase())
    .sort((a,b)=> b.createdAt - a.createdAt);

  const periodos = db.periodos();

  const rows = cenarios.map(c => {
    const ps = periodos.filter(p => p.cenarioId === c.id);
    const ok = ps.filter(p => p.resultado === "OK").length;
    const cf = ps.filter(p => p.resultado === "Conflito").length;
    const bl = ps.filter(p => p.resultado === "Bloqueado").length;

    const badge = c.status === "Fechado"
      ? `<span class="badge badge-ok">Fechado</span>`
      : `<span class="badge badge-muted">Rascunho</span>`;

    return `
      <tr>
        <td>
          <b>${escapeHTML(c.nome)}</b><br>
          <span class="muted">${new Date(c.createdAt).toLocaleString("pt-BR")}</span>
        </td>
        <td>${badge}</td>
        <td>
          <span class="badge badge-ok">OK: ${ok}</span>
          <span class="badge badge-warn">Conflito: ${cf}</span>
          <span class="badge badge-block">Bloqueado: ${bl}</span>
        </td>
        <td>
          editAbrir</button>
          toggle
            ${c.status === "Fechado" ? "Reabrir" : "Fechar"}
          </button>
          delExcluir</button>
        </td>
      </tr>
    `;
  }).join("");

  routeMyScenarios.innerHTML = `
    <h3>Meus Cenários</h3>
    <p class="muted">Crie cenários diferentes para testar opções de férias sem interferir no “real”.</p>
    <div class="card" style="margin-top:12px">
      <table>
        <thead>
          <tr>
            <th>Cenário</th>
            <th>Status</th>
            <th>Resumo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="4" class="muted">Nenhum cenário ainda. Clique em <b>+ Novo cenário</b>.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;

  routeMyScenarios.querySelectorAll("button[data-action]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute("data-id");
      const act = btn.getAttribute("data-action");
      if(act === "edit"){
        editingScenarioId = id;
        showRoute("editor");
      }
      if(act === "toggle"){
        const sc = db.cenarios().find(c => c.id === id);
        updateScenario(id, { status: sc.status === "Fechado" ? "Rascunho" : "Fechado" });
        render();
      }
      if(act === "del"){
        if(confirm("Excluir cenário e seus períodos?")){
          deleteScenario(id);
          render();
        }
      }
    };
  });
}

function renderEditor(user){
  const sc = db.cenarios().find(c => c.id === editingScenarioId);
  if(!sc){
    routeEditor.innerHTML = `<p class="muted">Cenário não encontrado.</p>`;
    return;
  }
  // Segurança: somente dono (no modo local isso é mais simbólico)
  if(sc.criadoPor.toLowerCase() !== user.email.toLowerCase()){
    routeEditor.innerHTML = `<p class="muted">Sem permissão.</p>`;
    return;
  }

  const ps = db.periodos().filter(p => p.cenarioId === sc.id).sort((a,b)=> b.createdAt - a.createdAt);

  const list = ps.map(p => {
    const badge =
      p.resultado === "OK" ? `<span class="badge badge-ok">OK</span>` :
      p.resultado === "Conflito" ? `<span class="badge badge-warn">Conflito</span>` :
      `<span class="badge badge-block">Bloqueado</span>`;

    return `
      <tr>
        <td>${badge}</td>
        <td><b>${escapeHTML(p.inicio)}</b> → <b>${escapeHTML(p.fim)}</b><br><span class="muted">${p.dias} dia(s)</span></td>
        <td class="muted">${escapeHTML(p.detalhe || "")}</td>
        <td><button class="btn btn-danger" data-del="${p.id}">Remover</button></td>
      </tr>
    `;
  }).join("");

  routeEditor.innerHTML = `
    <div class="toolbar">
      <div>
        <h3>Editor de Cenário</h3>
        <p class="muted"><b>${escapeHTML(sc.nome)}</b> — Status: <kbd>${escapeHTML(sc.status)}</kbd></p>
      </div>
      <div class="toolbar-actions">
        <button class="btn btn-ghost" id="btnBack">← Voltar</button>
        <button class="btn btn-ghost" id="btnRename">Renomear</button>
        <button class="btn btn-ghost" id="btnToggle">${sc.status === "Fechado" ? "Reabrir" : "Fechar"}</button>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h4>Novo Período</h4>
        <div class="field">
          <label>Data início</label>
          <input type="date" id="dtInicio" />
        </div>
        <div class="field">
          <label>Data fim</label>
          <input type="date" id="dtFim" />
        </div>
        <div class="actions">
          <button class="btn btn-primary" id="btnValidarSalvar">Validar e salvar</button>
          <button class="btn btn-ghost" id="btnValidar">Somente validar</button>
        </div>
        <div id="validacaoBox" class="notice muted" style="display:none"></div>
      </div>

      <div class="card">
        <h4>Observações</h4>
        <div class="field">
          <label>Notas do cenário</label>
          <textarea id="obs" placeholder="Ex.: opção A para julho..."></textarea>
        </div>
        <div class="actions">
          <button class="btn btn-ghost" id="btnSalvarObs">Salvar observações</button>
        </div>
        <hr>
        <p class="muted">
          Regra do grupo: <kbd>${escapeHTML(sc.grupo)}</kbd> — Máx por dia: <kbd>${getRegra(sc.grupo).maxPorDia}</kbd>
        </p>
      </div>
    </div>

    <div class="card" style="margin-top:12px">
      <h4>Períodos deste cenário</h4>
      <table>
        <thead>
          <tr>
            <th>Resultado</th>
            <th>Período</th>
            <th>Detalhe</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${list || `<tr><td colspan="4" class="muted">Nenhum período adicionado ainda.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;

  // bind
  $("#btnBack").onclick = ()=> showRoute("myscenarios");
  $("#btnToggle").onclick = ()=> {
    updateScenario(sc.id, { status: sc.status === "Fechado" ? "Rascunho" : "Fechado" });
    render();
  };
  $("#btnRename").onclick = ()=> {
    const novo = prompt("Novo nome do cenário:", sc.nome);
    if(novo && novo.trim()){
      updateScenario(sc.id, { nome: novo.trim() });
      render();
    }
  };

  $("#obs").value = sc.obs || "";
  $("#btnSalvarObs").onclick = ()=> {
    updateScenario(sc.id, { obs: $("#obs").value });
    alert("Observações salvas.");
  };

  const box = $("#validacaoBox");
  function showValidation(v){
    box.style.display = "block";
    const badge =
      v.resultado === "OK" ? `<span class="badge badge-ok">OK</span>` :
      v.resultado === "Conflito" ? `<span class="badge badge-warn">Conflito</span>` :
      `<span class="badge badge-block">Bloqueado</span>`;

    let extra = "";
    if(v.over && v.over.length){
      const sample = v.over.slice(0,6).map(x => `${x.dia} (ocupado: ${x.qtd})`).join(", ");
      extra = `<br><span class="muted">Dias críticos: ${escapeHTML(sample)}${v.over.length>6?"…":""}</span>`;
    }
    box.innerHTML = `${badge} <b>${escapeHTML(v.resultado)}</b> — ${escapeHTML(v.detalhe)}${extra}`;
  }

  $("#btnValidar").onclick = ()=>{
    const ini = $("#dtInicio").value;
    const fim = $("#dtFim").value;
    if(!ini || !fim) return alert("Informe data início e fim.");
    if(ini > fim) return alert("Data início não pode ser maior que a data fim.");
    const v = validateRange(sc.grupo, ini, fim);
    showValidation(v);
  };

  $("#btnValidarSalvar").onclick = ()=>{
    const ini = $("#dtInicio").value;
    const fim = $("#dtFim").value;
    if(!ini || !fim) return alert("Informe data início e fim.");
    if(ini > fim) return alert("Data início não pode ser maior que a data fim.");
    const v = validateRange(sc.grupo, ini, fim);
    showValidation(v);
    addPeriod(sc.id, ini, fim, v.resultado, v.detalhe);
    render();
  };

  routeEditor.querySelectorAll("button[data-del]").forEach(btn=>{
    btn.onclick = ()=>{
      const pid = btn.getAttribute("data-del");
      deletePeriod(pid);
      render();
    };
  });
}

function renderCalendar(user){
  const regra = getRegra(user.grupo);
  const statuses = scenariosThatCount(regra);

  // Month picker (simple)
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;

  routeCalendar.innerHTML = `
    <div class="toolbar">
      <div>
        <h3>Calendário do Grupo</h3>
        <p class="muted">Grupo: <kbd>${escapeHTML(user.grupo)}</kbd> — Máx por dia: <kbd>${regra.maxPorDia}</kbd></p>
      </div>
      <div class="toolbar-actions">
        <button class="btn btn-ghost" id="btnBack2">← Voltar</button>
        <div class="field" style="margin:0">
          <label class="muted">Mês</label>
          <input type="month" id="monthPick" value="${currentMonth}" />
        </div>
      </div>
    </div>

    <div class="notice">
      <b>Privacidade:</b> ${session.privacyOverride === "names" ? "mostrando nomes (apenas dentro do grupo)" : "somente contagem"}.
      <span class="muted">Bloqueios são exibidos em vermelho.</span>
    </div>

    <div class="calendar" id="calGrid"></div>
    <div class="card hidden" id="dayDetail" style="margin-top:12px"></div>
  `;

  $("#btnBack2").onclick = ()=> showRoute("myscenarios");

  function build(monthValue){
    const [Y,M] = monthValue.split("-").map(Number);
    const first = new Date(Y, M-1, 1);
    const last = new Date(Y, M, 0); // last day
    const totalDays = last.getDate();

    const grid = $("#calGrid");
    grid.innerHTML = "";

    // Fill placeholders to align weekday (Mon-Sun style? We'll do Sun=0 to Sat=6)
    // In Brazil, many use Sunday first; keep simple.
    const offset = first.getDay(); // 0..6
    for(let i=0;i<offset;i++){
      const ph = document.createElement("div");
      ph.className = "day";
      ph.style.opacity = "0.25";
      ph.innerHTML = `<div class="n">—</div>`;
      grid.appendChild(ph);
    }

    for(let d=1; d<=totalDays; d++){
      const date = new Date(Y, M-1, d);
      const dayISO = iso(date);

      // blocked?
      const blk = isBlocked(user.grupo, dayISO, dayISO);
      const qtd = countGroupOnDay(user.grupo, dayISO, statuses);

      let cls = "day";
      if(blk.blocked) cls += " block";
      else if(qtd >= regra.maxPorDia) cls += " warn";
      else if(qtd > 0) cls += " ok";

      const cell = document.createElement("div");
      cell.className = cls;
      cell.innerHTML = `
        <div class="n">${d}</div>
        <div class="q">${blk.blocked ? "⛔" : qtd}</div>
      `;
      cell.onclick = ()=> showDayDetail(user, dayISO, statuses, blk, qtd);
      grid.appendChild(cell);
    }
  }

  $("#monthPick").onchange = (e)=> build(e.target.value);
  build(currentMonth);
}

function showDayDetail(user, dayISO, statuses, blk, qtd){
  const detail = $("#dayDetail");
  detail.classList.remove("hidden");

  // List who occupies day
  const cenarios = db.cenarios();
  const periodos = db.periodos();
  const usuarios = db.usuarios();

  const items = [];
  for(const p of periodos){
    const sc = cenarios.find(c => c.id === p.cenarioId);
    if(!sc) continue;
    if(sc.grupo !== user.grupo) continue;
    if(!statuses.includes(sc.status)) continue;
    if(p.inicio <= dayISO && p.fim >= dayISO){
      const u = usuarios.find(x => x.email.toLowerCase() === sc.criadoPor.toLowerCase());
      items.push({ user: u?.nome || sc.criadoPor, email: sc.criadoPor, scenario: sc.nome, status: sc.status });
    }
  }

  const canSeeNames =
    session.privacyOverride === "names" ||
    user.perfil === "Gestor" ||
    user.perfil === "Admin";

  const listHtml = items.map(it => `
    <li>
      <b>${canSeeNames ? escapeHTML(it.user) : "Pessoa do grupo"}</b>
      <span class="muted">— ${escapeHTML(it.scenario)} (${escapeHTML(it.status)})</span>
    </li>
  `).join("");

  detail.innerHTML = `
    <h4>Detalhe do dia <kbd>${escapeHTML(dayISO)}</kbd></h4>
    <p class="muted">
      ${blk.blocked ? `⛔ <b>Bloqueado</b>: ${escapeHTML(blk.motivo)}` : `Ocupação: <b>${qtd}</b>`}
    </p>
    <hr>
    <div>
      <b>Simulações que ocupam o dia</b>
      <ul class="muted">
        ${items.length ? listHtml : "<li>Nenhuma simulação ocupando este dia.</li>"}
      </ul>
    </div>
  `;
}

function renderAdmin(user){
  if(!(user.perfil === "Gestor" || user.perfil === "Admin")){
    routeAdmin.innerHTML = `<p class="muted">Sem permissão.</p>`;
    return;
  }

  const regras = db.regras();
  const bloqueios = db.bloqueios();

  routeAdmin.innerHTML = `
    <div class="toolbar">
      <div>
        <h3>Configurações (Gestor)</h3>
        <p class="muted">Ajuste capacidade por grupo e períodos bloqueados (blackout).</p>
      </div>
      <div class="toolbar-actions">
        <button class="btn btn-ghost" id="btnBack3">← Voltar</button>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h4>Regras por grupo</h4>
        <p class="muted">MaxPorDia e se rascunhos contam na capacidade.</p>
        <div id="rulesBox"></div>
        <div class="actions">
          <button class="btn btn-primary" id="btnSaveRules">Salvar regras</button>
        </div>
      </div>

      <div class="card">
        <h4>Adicionar bloqueio</h4>
        <div class="field">
          <label>Grupo</label>
          <select id="blkGrupo">
            <option value="Todos">Todos</option>
            ${SEED.grupos.map(g=> `<option value="${escapeHTML(g)}">${escapeHTML(g)}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label>Início</label>
          <input type="date" id="blkIni">
        </div>
        <div class="field">
          <label>Fim</label>
          <input type="date" id="blkFim">
        </div>
        <div class="field">
          <label>Motivo</label>
          <input type="text" id="blkMotivo" placeholder="Ex.: Auditoria, Parada..." />
        </div>
        <div class="actions">
          <button class="btn btn-primary" id="btnAddBlk">Adicionar</button>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:12px">
      <h4>Bloqueios atuais</h4>
      <table>
        <thead>
          <tr><th>Grupo</th><th>Período</th><th>Motivo</th><th></th></tr>
        </thead>
        <tbody>
          ${bloqueios.map((b,i)=> `
            <tr>
              <td><kbd>${escapeHTML(b.grupo)}</kbd></td>
              <td><b>${escapeHTML(b.inicio)}</b> → <b>${escapeHTML(b.fim)}</b></td>
              <td class="muted">${escapeHTML(b.motivo || "")}</td>
              <td><button class="btn btn-danger" data-rmblk="${i}">Remover</button></td>
            </tr>
          `).join("") || `<tr><td colspan="4" class="muted">Nenhum bloqueio cadastrado.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;

  $("#btnBack3").onclick = ()=> showRoute("myscenarios");

  // Render rules editors
  const rulesBox = $("#rulesBox");
  rulesBox.innerHTML = regras.map((r, idx)=> `
    <div class="card" style="margin:10px 0;background:rgba(0,0,0,.10)">
      <b>${escapeHTML(r.grupo)}</b>
      <div class="grid-2">
        <div class="field">
          <label>Máximo de pessoas por dia</label>
          <input type="number" min="1" step="1" id="r_max_${idx}" value="${Number(r.maxPorDia || 1)}">
        </div>
        <div class="field">
          <label>Rascunhos contam na capacidade?</label>
          <select id="r_cnt_${idx}">
            <option value="no" ${r.contaRascunho ? "" : "selected"}>Não</option>
            <option value="yes" ${r.contaRascunho ? "selected" : ""}>Sim</option>
          </select>
        </div>
      </div>
    </div>
  `).join("");

  $("#btnSaveRules").onclick = ()=>{
    const next = regras.map((r, idx)=> ({
      ...r,
      maxPorDia: Math.max(1, Number($("#r_max_"+idx).value || 1)),
      contaRascunho: $("#r_cnt_"+idx).value === "yes"
    }));
    db.setRegras(next);
    alert("Regras salvas.");
    render();
  };

  $("#btnAddBlk").onclick = ()=>{
    const grupo = $("#blkGrupo").value;
    const ini = $("#blkIni").value;
    const fim = $("#blkFim").value;
    const motivo = $("#blkMotivo").value || "Bloqueio";
    if(!ini || !fim) return alert("Informe início e fim.");
    if(ini > fim) return alert("Início não pode ser maior que fim.");
    const next = db.bloqueios();
    next.push({ grupo, inicio: ini, fim, motivo, ativo: true });
    db.setBloqueios(next);
    render();
  };

  routeAdmin.querySelectorAll("button[data-rmblk]").forEach(btn=>{
    btn.onclick = ()=>{
      const idx = Number(btn.getAttribute("data-rmblk"));
      const next = db.bloqueios().filter((_,i)=> i !== idx);
      db.setBloqueios(next);
      render();
    };
  });
}

// ----------------------
// EVENTS
// ----------------------
btnLogin.onclick = ()=>{
  bootstrapIfNeeded();
  const email = (emailInput.value || "").trim().toLowerCase();
  if(!email) return alert("Informe seu e-mail.");
  const user = getUserByEmail(email);
  if(!user) return alert("Usuário não cadastrado ou inativo. Edite assets/data.seed.js e recarregue.");

  setSession({ email, privacyOverride: privacyMode.value });
  editingScenarioId = null;
  showRoute("myscenarios");
};

btnResetAll.onclick = ()=>{
  if(confirm("Isso apagará TODOS os dados locais deste navegador (simulações, cenários, etc.). Continuar?")){
    Object.values(K).forEach(k => Storage.del(k));
    location.reload();
  }
};

btnLogout.onclick = ()=>{
  clearSession();
  editingScenarioId = null;
  showRoute("myscenarios");
};

btnNewScenario.onclick = ()=>{
  const user = getUserByEmail(session.email);
  const nome = prompt("Nome do cenário:", `Opção ${new Date().toLocaleDateString("pt-BR")}`);
  const id = createScenario(user, nome);
  editingScenarioId = id;
  showRoute("editor");
};

btnGoMyScenarios.onclick = ()=> showRoute("myscenarios");
btnGoCalendar.onclick = ()=> showRoute("calendar");

// INIT
bootstrapIfNeeded();
render();
