const STORAGE_KEY = "pets_crm_contacts_v2";
const SMS_TEMPLATE_KEY = "pets_crm_sms_template_v2";
const API_URL = "./api.php";
const DEFAULT_SMS_TEMPLATE = "Hola {nombre_corto}, somos Peter y Maika de LifePlus. Hemos visto tu ficha, creemos que nuestra nueva linea Pets te puede interesar. Te paso info?";

const form = document.getElementById("contactForm");
const tableBody = document.getElementById("contactsTableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const smsTemplateInput = document.getElementById("smsTemplateInput");
const clearFormBtn = document.getElementById("clearFormBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const exportInteractionsBtn = document.getElementById("exportInteractionsBtn");
const importMonicaBtn = document.getElementById("importMonicaBtn");
const importBelenBtn = document.getElementById("importBelenBtn");
const interactionForm = document.getElementById("interactionForm");
const clearInteractionFormBtn = document.getElementById(
  "clearInteractionFormBtn",
);
const historyContactMeta = document.getElementById("historyContactMeta");
const interactionsTableBody = document.getElementById("interactionsTableBody");

const interactionAtInput = document.getElementById("interactionAt");
const interactionChannelInput = document.getElementById("interactionChannel");
const interactionTypeInput = document.getElementById("interactionType");
const interactionRespondedInput = document.getElementById("interactionResponded");
const interactionSummaryInput = document.getElementById("interactionSummary");
const interactionSaidInput = document.getElementById("interactionSaid");
const interactionResultInput = document.getElementById("interactionResult");
const interactionNextStepInput = document.getElementById("interactionNextStep");
const interactionNextDueInput = document.getElementById("interactionNextDue");
const interactionOwnerInput = document.getElementById("interactionOwner");

const recordIdInput = document.getElementById("recordId");
const contactTypeInput = document.getElementById("contactType");
const organizationNameInput = document.getElementById("organizationName");
const contactNameInput = document.getElementById("contactName");
const addressInput = document.getElementById("address");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
const preferredContactMethodInput = document.getElementById(
  "preferredContactMethod",
);
const pipelineStageInput = document.getElementById("pipelineStage");
const lastContactDateInput = document.getElementById("lastContactDate");
const responseStatusInput = document.getElementById("responseStatus");
const responseNotesInput = document.getElementById("responseNotes");
const nextStepInput = document.getElementById("nextStep");
const nextStepDueInput = document.getElementById("nextStepDue");
const ownerInput = document.getElementById("owner");
const legalBasisInput = document.getElementById("legalBasis");
const consentStatusInput = document.getElementById("consentStatus");
const priorityInput = document.getElementById("priority");
const retentionReviewAtInput = document.getElementById("retentionReviewAt");
const sourceInput = document.getElementById("source");

let contacts = loadContactsLocal();
let selectedHistoryContactId = "";
let pendingSmsContactId = null;

function normalizeContacts(items) {
  const list = Array.isArray(items) ? items : [];
  return list.map((item) => ({
    ...item,
    interactions: Array.isArray(item.interactions) ? item.interactions : [],
  }));
}

function loadContactsLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return normalizeContacts(parsed);
  } catch {
    return [];
  }
}

function saveContacts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  void saveContactsRemote();
}

async function loadContactsRemote() {
  const response = await fetch(API_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!data?.ok || !Array.isArray(data.contacts)) {
    throw new Error("Respuesta invalida del servidor");
  }
  return normalizeContacts(data.contacts);
}

async function saveContactsRemote() {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contacts }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data?.ok) throw new Error(data?.error || "Error guardando en servidor");
  } catch (error) {
    // Keep local storage as fallback; avoid blocking UX.
    console.warn("No se pudo guardar en servidor:", error);
  }
}

function mergeContacts(serverList, localList) {
  const merged = new Map();
  for (const c of serverList) merged.set(c.id, c);
  for (const c of localList) {
    const server = merged.get(c.id);
    if (!server) {
      merged.set(c.id, c);
    } else {
      const serverTime = new Date(server.updated_at || 0).getTime();
      const localTime = new Date(c.updated_at || 0).getTime();
      if (localTime > serverTime) merged.set(c.id, c);
    }
  }
  return normalizeContacts([...merged.values()]);
}

async function hydrateFromServer() {
  try {
    const remoteContacts = await loadContactsRemote();
    const localContacts = loadContactsLocal();
    contacts = mergeContacts(remoteContacts, localContacts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    void saveContactsRemote();
    checkAndAutoAdvancePipeline();
    renderTable();
    renderHistoryPanel();
  } catch (error) {
    console.warn("No se pudo cargar del servidor, uso localStorage:", error);
  }
}

const AUTO_ADVANCE_DAYS = 2;
const AUTO_ADVANCE_STAGES = {
  nuevo: "intento_1_enviado",
  intento_1_enviado: "intento_2_enviado",
  intento_2_enviado: "en_nurture",
};

function checkAndAutoAdvancePipeline() {
  const todayMs = new Date(today()).getTime();
  let changed = false;

  for (const contact of contacts) {
    if (!AUTO_ADVANCE_STAGES[contact.pipeline_stage]) continue;

    const interactions = Array.isArray(contact.interactions) ? contact.interactions : [];

    const lastOutbound = interactions
      .filter((i) => i.type === "outbound")
      .sort((a, b) => String(b.at).localeCompare(String(a.at)))[0];

    if (!lastOutbound) continue;

    const outboundMs = new Date(lastOutbound.at.slice(0, 10)).getTime();
    const daysSince = Math.floor((todayMs - outboundMs) / 86400000);

    if (daysSince < AUTO_ADVANCE_DAYS) continue;

    const hasInboundAfter = interactions.some(
      (i) => i.type === "inbound" && String(i.at) > String(lastOutbound.at)
    );

    if (hasInboundAfter) continue;

    contact.pipeline_stage = AUTO_ADVANCE_STAGES[contact.pipeline_stage];
    contact.response_status = "sin_respuesta";
    contact.updated_at = today();
    contact.interactions.push({
      id: `auto_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      at: nowLocalDatetime(),
      channel: "sms",
      type: "note",
      responded: "no",
      summary: `Sin respuesta tras ${daysSince} dias — avance automatico de pipeline`,
      said: "",
      result: "sin_respuesta",
      next_step: contact.next_step || "",
      next_due: contact.next_step_due || "",
      owner: contact.owner || "",
    });
    changed = true;
  }

  if (changed) saveContacts();
}

function sanitize(value) {
  return (value || "").trim();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowLocalDatetime() {
  const now = new Date();
  const shifted = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 16);
}

function createPayload() {
  const existingId = sanitize(recordIdInput.value);
  return {
    id: existingId || String(Date.now()),
    contact_type: contactTypeInput.value,
    organization_name: sanitize(organizationNameInput.value),
    contact_name: sanitize(contactNameInput.value),
    address: sanitize(addressInput.value),
    phone: sanitize(phoneInput.value),
    email: sanitize(emailInput.value),
    preferred_contact_method: preferredContactMethodInput.value,
    pipeline_stage: pipelineStageInput.value,
    last_contact_date: lastContactDateInput.value || "",
    response_status: responseStatusInput.value,
    response_notes: sanitize(responseNotesInput.value),
    next_step: sanitize(nextStepInput.value),
    next_step_due: nextStepDueInput.value || "",
    owner: sanitize(ownerInput.value),
    legal_basis: legalBasisInput.value,
    consent_status: consentStatusInput.value,
    priority: priorityInput.value,
    retention_review_at: retentionReviewAtInput.value || "",
    source: sanitize(sourceInput.value),
    created_at: today(),
    updated_at: today(),
    interactions: [],
  };
}

function validatePayload(payload) {
  if (!payload.organization_name) {
    alert("Nombre de organizacion obligatorio.");
    return false;
  }

  if (!payload.phone && !payload.email) {
    alert("Incluye al menos telefono o email.");
    return false;
  }

  if (!payload.next_step || !payload.next_step_due) {
    alert("Define proximo paso y fecha.");
    return false;
  }

  return true;
}

function upsertRecord() {
  const payload = createPayload();
  if (!validatePayload(payload)) return;

  const existingId = sanitize(recordIdInput.value);
  if (existingId) {
    const index = contacts.findIndex((item) => item.id === existingId);
    if (index >= 0) {
      payload.created_at = contacts[index].created_at || today();
      payload.interactions = Array.isArray(contacts[index].interactions)
        ? contacts[index].interactions
        : [];
      contacts[index] = payload;
    }
  } else {
    contacts.push(payload);
  }

  saveContacts();
  clearForm();
  renderTable();
}

function clearForm() {
  recordIdInput.value = "";
  form.reset();
  responseStatusInput.value = "sin_respuesta";
  priorityInput.value = "medium";
  pipelineStageInput.value = "nuevo";
  legalBasisInput.value = "interes_legitimo";
  consentStatusInput.value = "no_aplica";
}

function editRecord(id) {
  const item = contacts.find((contact) => contact.id === id);
  if (!item) return;

  recordIdInput.value = item.id || "";
  contactTypeInput.value = item.contact_type || "";
  organizationNameInput.value = item.organization_name || "";
  contactNameInput.value = item.contact_name || "";
  addressInput.value = item.address || "";
  phoneInput.value = item.phone || "";
  emailInput.value = item.email || "";
  preferredContactMethodInput.value = item.preferred_contact_method || "";
  pipelineStageInput.value = item.pipeline_stage || "nuevo";
  lastContactDateInput.value = item.last_contact_date || "";
  responseStatusInput.value = item.response_status || "sin_respuesta";
  responseNotesInput.value = item.response_notes || "";
  nextStepInput.value = item.next_step || "";
  nextStepDueInput.value = item.next_step_due || "";
  ownerInput.value = item.owner || "";
  legalBasisInput.value = item.legal_basis || "interes_legitimo";
  consentStatusInput.value = item.consent_status || "no_aplica";
  priorityInput.value = item.priority || "medium";
  retentionReviewAtInput.value = item.retention_review_at || "";
  sourceInput.value = item.source || "";
  openHistory(id);
}

function deleteRecord(id) {
  contacts = contacts.filter((item) => item.id !== id);
  saveContacts();
  renderTable();
}

function textMatch(item, query) {
  if (!query) return true;
  const text = [
    item.organization_name,
    item.contact_name,
    item.phone,
    item.email,
    item.address,
    item.next_step,
  ]
    .join(" ")
    .toLowerCase();

  return text.includes(query.toLowerCase());
}

function getFilteredContacts() {
  const query = sanitize(searchInput.value);
  const stage = statusFilter.value;

  return contacts
    .filter((item) => textMatch(item, query))
    .filter((item) => (stage ? item.pipeline_stage === stage : true))
    .sort((a, b) => {
      const aDue = a.next_step_due || "9999-12-31";
      const bDue = b.next_step_due || "9999-12-31";
      return aDue.localeCompare(bDue);
    });
}

function stageLabel(stage) {
  const labels = {
    nuevo: "Nuevo",
    intento_1_enviado: "Intento 1",
    intento_2_enviado: "Intento 2",
    conversacion_abierta: "Conversacion",
    interesado: "Interesado",
    propuesta_enviada: "Propuesta",
    en_negociacion: "Negociacion",
    ganado: "Ganado",
    perdido: "Perdido",
    en_nurture: "Nurture",
  };
  return labels[stage] || stage || "-";
}

function responseLabel(value) {
  const labels = {
    sin_respuesta: "Sin respuesta",
    interesado: "Interesado",
    no_interesado: "No interesado",
    recontactar: "Recontactar",
    referido: "Referido",
  };
  return labels[value] || value || "-";
}

function statusClass(stage) {
  return `status-${String(stage || "nuevo")}`;
}

function typeLabel(type) {
  const labels = {
    veterinary_clinic: "Veterinario",
    dog_community: "Comunidad canina",
    trainer: "Adiestrador",
    breeder: "Criador",
    pet_store: "Tienda",
    other: "Otro",
  };
  return labels[type] || type || "-";
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getSmsAttempts(contact) {
  return (contact.interactions || []).filter(
    (i) => i.type === "outbound" && i.channel === "sms"
  ).length;
}

function countSmsSentToday() {
  const t = today();
  return contacts.reduce((acc, c) => {
    const sent = (c.interactions || []).filter(
      (i) => i.type === "outbound" && i.channel === "sms" && i.at.slice(0, 10) === t
    ).length;
    return acc + sent;
  }, 0);
}

function renderStats() {
  const statsEl = document.getElementById("smsStatsBar");
  if (!statsEl) return;
  const total = countSmsSentToday();
  statsEl.textContent = total > 0 ? `SMS enviados hoy: ${total}` : "";
  statsEl.style.display = total > 0 ? "block" : "none";
}

function renderTable() {
  const scrollY = window.scrollY;
  const rows = getFilteredContacts();

  renderStats();

  if (!rows.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="11">No hay contactos con los filtros actuales.</td>
      </tr>
    `;
    window.scrollTo(0, scrollY);
    return;
  }

  tableBody.innerHTML = rows
    .map(
      (item) => {
        const attempts = getSmsAttempts(item);
        const sentToday = (item.interactions || []).some(
          (i) => i.type === "outbound" && i.channel === "sms" && i.at.slice(0, 10) === today()
        );
        const dots = "●".repeat(Math.min(attempts, 3));
        const attemptClass = attempts === 0 ? "" : attempts === 1 ? "sms-1" : attempts === 2 ? "sms-2" : "sms-3";
        const todayMark = sentToday ? " ✓" : "";
        const smsLabel = attempts > 0 ? `SMS ${dots}${todayMark}` : "SMS";
        const smsBtn = `<button class="mini sms-btn ${attemptClass}" data-action="sms" data-id="${item.id}">${smsLabel}</button>`;
        return `
        <tr>
          <td>
            <strong>${escapeHtml(item.organization_name)}</strong><br />
            <small>${escapeHtml(item.contact_name || "-")}</small>
          </td>
          <td>${typeLabel(item.contact_type)}</td>
          <td>${escapeHtml(item.phone || "-")}</td>
          <td>${escapeHtml(item.preferred_contact_method || "-")}</td>
          <td>${escapeHtml(item.owner || "-")}</td>
          <td>
            <span class="status-pill ${statusClass(item.pipeline_stage)}">
              ${stageLabel(item.pipeline_stage)}
            </span>
          </td>
          <td>
            ${responseLabel(item.response_status)}<br />
            <small>${escapeHtml(item.response_notes || "")}</small>
          </td>
          <td>${escapeHtml(item.next_step || "-")}</td>
          <td>${escapeHtml(item.next_step_due || "-")}</td>
          <td>${Array.isArray(item.interactions) ? item.interactions.length : 0}</td>
          <td>
            <div class="action-group">
              ${smsBtn}
              <button class="mini" data-action="history" data-id="${item.id}">Historial</button>
              <button class="mini" data-action="edit" data-id="${item.id}">Editar</button>
              <button class="mini" data-action="delete" data-id="${item.id}">Borrar</button>
            </div>
          </td>
        </tr>
      `;
      }
    )
    .join("");

  window.scrollTo(0, scrollY);
}

function getSmsTemplate() {
  return sanitize(smsTemplateInput?.value) || DEFAULT_SMS_TEMPLATE;
}

function formatShortName(raw) {
  const value = sanitize(raw);
  if (!value) return "";

  // Handle "Apellido Apellido, Nombre" -> "Nombre Apellido"
  if (value.includes(",")) {
    const [lastNamesRaw, firstNamesRaw] = value.split(",", 2);
    const firstName = sanitize(firstNamesRaw).split(/\s+/).filter(Boolean)[0] || "";
    const firstLastName = sanitize(lastNamesRaw).split(/\s+/).filter(Boolean)[0] || "";
    return sanitize(`${firstName} ${firstLastName}`);
  }

  // Handle "Nombre Apellido Apellido" -> "Nombre Apellido"
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
  return parts[0] || "";
}

function buildSmsMessage(contact) {
  const template = getSmsTemplate();
  const rawName = sanitize(contact.contact_name) || sanitize(contact.organization_name);
  const shortName = formatShortName(rawName) || "hola";
  const org = sanitize(contact.organization_name) || "";
  const owner = sanitize(contact.owner) || "";
  return template
    .replaceAll("{nombre}", shortName)
    .replaceAll("{nombre_corto}", shortName)
    .replaceAll("{organizacion}", org)
    .replaceAll("{upline}", owner);
}

function appendInteraction(contact, interaction) {
  if (!Array.isArray(contact.interactions)) contact.interactions = [];
  contact.interactions.push(interaction);
  contact.last_contact_date = interaction.at.slice(0, 10);
  contact.response_status = interaction.result || "sin_respuesta";
  if (interaction.next_step) contact.next_step = interaction.next_step;
  if (interaction.next_due) contact.next_step_due = interaction.next_due;
  contact.updated_at = today();
}

function sendSmsForContact(id) {
  const contact = findContactById(id);
  if (!contact) return;

  const normalizedPhone = normalizePhone(contact.phone);
  if (!normalizedPhone) {
    alert("Este contacto no tiene telefono valido para SMS.");
    return;
  }

  const message = buildSmsMessage(contact);
  const smsUrl = `sms:${normalizedPhone}?body=${encodeURIComponent(message)}`;
  const smsLink = document.createElement("a");
  smsLink.href = smsUrl;
  smsLink.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none;";
  document.body.appendChild(smsLink);
  smsLink.click();
  smsLink.remove();

  const interaction = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at: nowLocalDatetime(),
    channel: "sms",
    type: "outbound",
    responded: "pendiente",
    summary: "SMS abierto desde CRM (Mac Mensajes)",
    said: message,
    result: "sin_respuesta",
    next_step: "Esperar respuesta por SMS",
    next_due: today(),
    owner: sanitize(contact.owner),
  };

  appendInteraction(contact, interaction);
  saveContacts();
  renderTable();
  if (selectedHistoryContactId === id) renderHistoryPanel();

  pendingSmsContactId = id;
}

function toCsv(records) {
  const columns = [
    "id",
    "contact_type",
    "organization_name",
    "contact_name",
    "address",
    "phone",
    "email",
    "preferred_contact_method",
    "pipeline_stage",
    "last_contact_date",
    "response_status",
    "response_notes",
    "next_step",
    "next_step_due",
    "owner",
    "legal_basis",
    "consent_status",
    "priority",
    "retention_review_at",
    "source",
    "created_at",
    "updated_at",
  ];

  const lines = [columns.join(",")];
  for (const record of records) {
    lines.push(
      columns
        .map((column) => {
          const value = String(record[column] || "");
          const escaped = value.replaceAll('"', '""');
          return `"${escaped}"`;
        })
        .join(","),
    );
  }

  return lines.join("\n");
}

function exportCsv() {
  const csv = toCsv(contacts);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pets-crm-${today()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function clearInteractionForm() {
  interactionForm.reset();
  interactionAtInput.value = nowLocalDatetime();
  interactionRespondedInput.value = "no";
  interactionResultInput.value = "sin_respuesta";
}

function findContactById(id) {
  return contacts.find((item) => item.id === id);
}

function openHistory(id) {
  selectedHistoryContactId = id;
  renderHistoryPanel();
}

function renderHistoryPanel() {
  const contact = findContactById(selectedHistoryContactId);
  if (!contact) {
    historyContactMeta.textContent =
      'Selecciona "Historial" en un contacto para registrar SMS, WhatsApp, llamadas y respuestas.';
    interactionsTableBody.innerHTML = `
      <tr><td colspan="10">Sin contacto seleccionado.</td></tr>
    `;
    return;
  }

  historyContactMeta.textContent = `${contact.organization_name} · ${contact.contact_name || "Sin persona de contacto"} · ${contact.phone || "-"}`;
  interactionOwnerInput.value = contact.owner || "";

  const interactions = Array.isArray(contact.interactions)
    ? [...contact.interactions].sort((a, b) =>
        String(b.at || "").localeCompare(String(a.at || "")),
      )
    : [];

  if (!interactions.length) {
    interactionsTableBody.innerHTML = `
      <tr><td colspan="10">Sin interacciones registradas para este contacto.</td></tr>
    `;
    return;
  }

  interactionsTableBody.innerHTML = interactions
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.at || "-")}</td>
        <td>${escapeHtml(item.channel || "-")}</td>
        <td>${escapeHtml(item.type || "-")}</td>
        <td>${escapeHtml(item.responded || "-")}</td>
        <td>${escapeHtml(item.summary || "-")}</td>
        <td>${escapeHtml(item.said || "-")}</td>
        <td>${responseLabel(item.result || "sin_respuesta")}</td>
        <td>${escapeHtml(item.next_step || "-")}<br /><small>${escapeHtml(item.next_due || "")}</small></td>
        <td>${escapeHtml(item.owner || "-")}</td>
        <td>
          <button class="mini" data-action="delete-interaction" data-id="${contact.id}" data-interaction-id="${item.id}">
            Borrar
          </button>
        </td>
      </tr>
    `,
    )
    .join("");
}

function addInteraction() {
  const contact = findContactById(selectedHistoryContactId);
  if (!contact) {
    alert("Primero selecciona un contacto en el boton Historial.");
    return;
  }

  const summary = sanitize(interactionSummaryInput.value);
  if (!summary) {
    alert("Describe la accion realizada.");
    return;
  }

  const at = interactionAtInput.value || nowLocalDatetime();
  const said = sanitize(interactionSaidInput.value);
  const nextStep = sanitize(interactionNextStepInput.value);
  const nextDue = interactionNextDueInput.value || "";
  const owner = sanitize(interactionOwnerInput.value);
  const result = interactionResultInput.value || "sin_respuesta";

  const interaction = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at,
    channel: interactionChannelInput.value,
    type: interactionTypeInput.value,
    responded: interactionRespondedInput.value,
    summary,
    said,
    result,
    next_step: nextStep,
    next_due: nextDue,
    owner,
  };

  if (!Array.isArray(contact.interactions)) contact.interactions = [];
  contact.interactions.push(interaction);

  // Keep current contact status synchronized with the latest activity.
  contact.last_contact_date = at.slice(0, 10);
  contact.response_status = result;
  if (said) contact.response_notes = said;
  if (nextStep) contact.next_step = nextStep;
  if (nextDue) contact.next_step_due = nextDue;
  if (owner) contact.owner = owner;
  contact.updated_at = today();

  saveContacts();
  clearInteractionForm();
  renderTable();
  renderHistoryPanel();
}

function deleteInteraction(contactId, interactionId) {
  const contact = findContactById(contactId);
  if (!contact || !Array.isArray(contact.interactions)) return;
  contact.interactions = contact.interactions.filter(
    (item) => item.id !== interactionId,
  );
  contact.updated_at = today();
  saveContacts();
  renderTable();
  renderHistoryPanel();
}

function toCsvInteractions(records) {
  const columns = [
    "contact_id",
    "organization_name",
    "contact_name",
    "phone",
    "owner",
    "interaction_id",
    "at",
    "channel",
    "type",
    "responded",
    "summary",
    "said",
    "result",
    "next_step",
    "next_due",
    "interaction_owner",
  ];

  const lines = [columns.join(",")];
  for (const record of records) {
    const interactions = Array.isArray(record.interactions)
      ? record.interactions
      : [];
    for (const interaction of interactions) {
      const row = {
        contact_id: record.id || "",
        organization_name: record.organization_name || "",
        contact_name: record.contact_name || "",
        phone: record.phone || "",
        owner: record.owner || "",
        interaction_id: interaction.id || "",
        at: interaction.at || "",
        channel: interaction.channel || "",
        type: interaction.type || "",
        responded: interaction.responded || "",
        summary: interaction.summary || "",
        said: interaction.said || "",
        result: interaction.result || "",
        next_step: interaction.next_step || "",
        next_due: interaction.next_due || "",
        interaction_owner: interaction.owner || "",
      };
      lines.push(
        columns
          .map((column) => {
            const value = String(row[column] || "");
            const escaped = value.replaceAll('"', '""');
            return `"${escaped}"`;
          })
          .join(","),
      );
    }
  }
  return lines.join("\n");
}

function exportInteractionsCsv() {
  const csv = toCsvInteractions(contacts);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pets-crm-interacciones-${today()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function parseCsvLine(line) {
  const out = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      out.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  out.push(current);
  return out;
}

function parseCsvText(text) {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] || "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("34") && digits.length >= 9) return `+${digits}`;
  return digits;
}

function findExistingContact(normalizedPhone, name) {
  return contacts.find((item) => {
    const phoneMatch =
      normalizedPhone &&
      normalizePhone(item.phone || "") &&
      normalizePhone(item.phone || "") === normalizedPhone;
    const nameMatch =
      sanitize(item.organization_name).toLowerCase() ===
      sanitize(name).toLowerCase();
    return phoneMatch || nameMatch;
  });
}

function mapImportedRow(row, upline) {
  const name = sanitize(row.name);
  const pin = sanitize(row.pin);
  const address = sanitize(row.address);
  const month = sanitize(row.last_month);
  const source = sanitize(row.source);
  const phone = normalizePhone(row.tel);

  return {
    id: String(Date.now() + Math.floor(Math.random() * 100000)),
    contact_type: "other",
    organization_name: name || `Shopper ${pin || ""}`.trim(),
    contact_name: "",
    address,
    phone,
    email: "",
    preferred_contact_method: "whatsapp",
    pipeline_stage: "nuevo",
    last_contact_date: "",
    response_status: "sin_respuesta",
    response_notes: "",
    next_step: "Primer contacto",
    next_step_due: today(),
    owner: upline,
    legal_basis: "interes_legitimo",
    consent_status: "pendiente",
    priority: "medium",
    retention_review_at: "",
    source: `${source || "import"}${pin ? ` · PIN:${pin}` : ""}${month ? ` · Ult mes:${month}` : ""}`,
    created_at: today(),
    updated_at: today(),
    interactions: [],
  };
}

async function importNormalizedFile(url, upline) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
    const text = await response.text();
    const rows = parseCsvText(text);
    if (!rows.length) {
      alert("El archivo no contiene filas importables.");
      return;
    }

    let created = 0;
    let skipped = 0;
    for (const row of rows) {
      const payload = mapImportedRow(row, upline);
      const existing = findExistingContact(payload.phone, payload.organization_name);
      if (existing) {
        // Keep existing record, but ensure owner/upline is set.
        if (!existing.owner) existing.owner = upline;
        existing.updated_at = today();
        skipped += 1;
        continue;
      }
      contacts.push(payload);
      created += 1;
    }

    saveContacts();
    renderTable();
    renderHistoryPanel();
    alert(
      `Importacion completada (${upline}). Nuevos: ${created}. Ya existentes: ${skipped}.`,
    );
  } catch (error) {
    alert(`Error en importacion: ${error.message}`);
  }
}

function showSmsBanner(contactId) {
  const contact = findContactById(contactId);
  if (!contact) return;

  document.getElementById("sms-response-banner")?.remove();

  const name = escapeHtml(contact.organization_name || "este contacto");
  const banner = document.createElement("div");
  banner.id = "sms-response-banner";
  banner.className = "sms-banner";
  banner.innerHTML = `
    <span class="sms-banner-text">¿Respondio <strong>${name}</strong>?</span>
    <div class="sms-banner-actions">
      <button class="btn btn-primary" data-banner-action="si">Si respondio</button>
      <button class="btn btn-secondary" data-banner-action="no">No respondio</button>
      <button class="btn btn-secondary" data-banner-action="later">Mas tarde</button>
    </div>
  `;

  banner.addEventListener("click", (e) => {
    const action = e.target.closest("[data-banner-action]")?.dataset?.bannerAction;
    if (!action) return;

    if (action === "si") {
      const interaction = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        at: nowLocalDatetime(),
        channel: "sms",
        type: "inbound",
        responded: "si",
        summary: "Respondio al SMS (registrado desde banner rapido)",
        said: "",
        result: "interesado",
        next_step: "Responder y avanzar conversacion",
        next_due: today(),
        owner: contact.owner || "",
      };
      appendInteraction(contact, interaction);
      if (["nuevo", "intento_1_enviado", "intento_2_enviado"].includes(contact.pipeline_stage)) {
        contact.pipeline_stage = "conversacion_abierta";
      }
      contact.updated_at = today();
      saveContacts();
      renderTable();
      openHistory(contactId);
      renderHistoryPanel();
    }

    banner.remove();
  });

  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 30000);
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && pendingSmsContactId) {
    showSmsBanner(pendingSmsContactId);
    pendingSmsContactId = null;
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  upsertRecord();
});

clearFormBtn.addEventListener("click", clearForm);
exportCsvBtn.addEventListener("click", exportCsv);
exportInteractionsBtn.addEventListener("click", exportInteractionsCsv);
importMonicaBtn.addEventListener("click", () =>
  importNormalizedFile("./import/monica-normalized.csv", "Monica"),
);
importBelenBtn.addEventListener("click", () =>
  importNormalizedFile("./import/belen-normalized.csv", "Belen"),
);
searchInput.addEventListener("input", renderTable);
statusFilter.addEventListener("change", renderTable);
interactionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addInteraction();
});
clearInteractionFormBtn.addEventListener("click", clearInteractionForm);

tableBody.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const action = target.dataset.action;
  const id = target.dataset.id;
  if (!action || !id) return;

  if (action === "history") openHistory(id);
  if (action === "sms") sendSmsForContact(id);
  if (action === "edit") editRecord(id);
  if (action === "delete") deleteRecord(id);
});

interactionsTableBody.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const action = target.dataset.action;
  if (action !== "delete-interaction") return;
  const id = target.dataset.id;
  const interactionId = target.dataset.interactionId;
  if (!id || !interactionId) return;
  deleteInteraction(id, interactionId);
});

smsTemplateInput.value = localStorage.getItem(SMS_TEMPLATE_KEY) || DEFAULT_SMS_TEMPLATE;
smsTemplateInput.addEventListener("input", () => {
  localStorage.setItem(SMS_TEMPLATE_KEY, smsTemplateInput.value);
});

clearForm();
clearInteractionForm();
renderTable();
renderHistoryPanel();
void hydrateFromServer();
