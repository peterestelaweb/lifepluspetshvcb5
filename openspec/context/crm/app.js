const STORAGE_KEY = "pets_crm_contacts_v2";

const form = document.getElementById("contactForm");
const tableBody = document.getElementById("contactsTableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const clearFormBtn = document.getElementById("clearFormBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");

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

function loadContacts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
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
        <td colspan="9">No hay contactos con los filtros actuales.</td>
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
        <td>
          <div class="action-group">
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

form.addEventListener("submit", (event) => {
  event.preventDefault();
  upsertRecord();
});

clearFormBtn.addEventListener("click", clearForm);
exportCsvBtn.addEventListener("click", exportCsv);
searchInput.addEventListener("input", renderTable);
statusFilter.addEventListener("change", renderTable);

tableBody.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const action = target.dataset.action;
  const id = target.dataset.id;
  if (!action || !id) return;

  if (action === "edit") editRecord(id);
  if (action === "delete") deleteRecord(id);
});

clearForm();
renderTable();
