const STORAGE_KEY = "pets_crm_contacts_v2";

const form = document.getElementById("contactForm");
const tableBody = document.getElementById("contactsTableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
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

let contacts = loadContacts();
let selectedHistoryContactId = "";

function loadContacts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return parsed.map((item) => ({
      ...item,
      interactions: Array.isArray(item.interactions) ? item.interactions : [],
    }));
  } catch {
    return [];
  }
}

function saveContacts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
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

function renderTable() {
  const rows = getFilteredContacts();
  if (!rows.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="11">No hay contactos con los filtros actuales.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = rows
    .map(
      (item) => `
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
            <button class="mini" data-action="history" data-id="${item.id}">
              Historial
            </button>
            <button class="mini" data-action="edit" data-id="${item.id}">
              Editar
            </button>
            <button class="mini" data-action="delete" data-id="${item.id}">
              Borrar
            </button>
          </div>
        </td>
      </tr>
    `,
    )
    .join("");
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
  if (action === "edit") editRecord(id);
  if (action === "delete") deleteRecord(id);
  if (action === "delete-interaction") {
    const interactionId = target.dataset.interactionId;
    if (!interactionId) return;
    deleteInteraction(id, interactionId);
  }
});

clearForm();
clearInteractionForm();
renderTable();
renderHistoryPanel();
