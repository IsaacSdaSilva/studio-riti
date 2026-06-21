const API_BASE = 'https://studio-riti-backend-production.up.railway.app';
const ADMIN_TOKEN = 'adm123'; // change via env on server for production

const services = [
  'Iluminada Premium',
  'Loira Perfeita',
  'Loira de Tinta',
  'Tonalização',
  'Coloração de Raiz',
  'Coloração Global',
  'Corte',
  'Escova',
  'Babyliss',
  'Penteado',
  'Make Social',
  'Give Back',
  'Scargot',
  'Celebration',
  'Cuidado contínuo',
  'Cor em Dia',
  'Noiva',
  'Make Noiva',
  'Serviços Complementares para Noivas',
  'Debutante',
  'Formação Profissional',
  'Curso de Penteados'
];

const urlParams = new URLSearchParams(window.location.search);
const selectedService = urlParams.get('service') || '';
const isAdminPage = urlParams.get('admin') === '1';
const BUSINESS_PHONE = '5551995345142';

const form = document.getElementById('appointment-form');
const messageBox = document.getElementById('message');
const appointmentList = document.getElementById('appointment-list');
const listCard = document.getElementById('list-card');
const pageTitle = document.querySelector('header h1');
const pageSubtitle = document.querySelector('header p');
const serviceSelect = document.getElementById('serviceType');
const appointmentTime = document.getElementById('appointmentTime');

function setPageMode() {
  if (isAdminPage) {
    pageTitle.textContent = 'Painel Administrativo de Agendamentos';
    pageSubtitle.textContent = 'Aqui você pode confirmar, recusar e editar horários pendentes.';
    listCard.style.display = 'block';
  } else {
    pageTitle.textContent = 'Agende seu serviço';
    pageSubtitle.textContent = 'Escolha um serviço, dia e horário. O agendamento será enviado para confirmação.';
    listCard.style.display = 'none';
  }
}

function populateServiceOptions() {
  serviceSelect.innerHTML = '<option value="">Selecione</option>';
  services.forEach(service => {
    const option = document.createElement('option');
    option.value = service;
    option.textContent = service;
    serviceSelect.appendChild(option);
  });

  if (selectedService) {
    const decoded = decodeURIComponent(selectedService);
    if (services.includes(decoded)) {
      serviceSelect.value = decoded;
    } else {
      const option = document.createElement('option');
      option.value = decoded;
      option.textContent = decoded;
      option.selected = true;
      serviceSelect.appendChild(option);
    }
  }
}

function showMessage(text, ok = true) {
  messageBox.textContent = text;
  messageBox.style.display = 'block';
  messageBox.style.background = ok ? 'rgba(223,240,216,1)' : '#f8d7da';
  setTimeout(() => { messageBox.style.display = 'none'; }, 3000);
}

function enforceBusinessHours() {
  if (!appointmentTime) return;
  appointmentTime.min = '09:00';
  appointmentTime.max = '19:30';
  appointmentTime.step = 1800; // steps of 30 minutes
}

function buildWhatsAppMessage(payload) {
  const horario = payload.horario || '';
  const obs = payload.obs ? `\nObservações: ${payload.obs}` : '';
  return `Olá! Meu nome é ${payload.nome} e gostaria de agendar o serviço *${payload.servico}* para ${horario}.\nMeu contato é ${payload.telefone}.${obs}\nObrigado!`;
}

function openWhatsAppBooking(payload) {
  const url = `https://wa.me/${BUSINESS_PHONE.replace(/\D/g, '')}?text=${encodeURIComponent(buildWhatsAppMessage(payload))}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

async function fetchAppointments() {
  try {
    const res = await fetch(`${API_BASE}/agenda`, { headers: { 'x-admin-token': ADMIN_TOKEN } });
    if (!res.ok) throw new Error('Não autorizado ou erro ao buscar');
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(horario) {
  if (!horario) return '-';
  const parts = horario.split(' ');
  return parts[1] || horario;
}

async function updateAppointment(id, data) {
  const res = await fetch(`${API_BASE}/agenda/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': ADMIN_TOKEN
    },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Erro');
  return result;
}

async function deleteAppointment(id) {
  const res = await fetch(`${API_BASE}/agenda/${id}`, {
    method: 'DELETE',
    headers: { 'x-admin-token': ADMIN_TOKEN }
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Erro');
  return result;
}

async function renderAppointments() {
  if (!isAdminPage) return;

  const appointments = await fetchAppointments();
  if (!appointments || !appointments.length) {
    appointmentList.innerHTML = '<div class="empty-state">Nenhum agendamento cadastrado ainda.</div>';
    return;
  }

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Cliente</th>
        <th>Contato</th>
        <th>Serviço</th>
        <th>Data</th>
        <th>Horário</th>
        <th>Status</th>
        <th>Obs.</th>
        <th>Ações</th>
      </tr>
    </thead>
  `;

  const body = document.createElement('tbody');
  appointments.forEach((appointment) => {
    const id = appointment.id || '';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${appointment.nome || appointment.clientName || '-'}</td>
      <td>${appointment.telefone || appointment.contact || '-'}</td>
      <td>${appointment.servico || appointment.serviceType || appointment['serviço'] || '-'}</td>
      <td>${formatDate(appointment.horario)}</td>
      <td>${formatTime(appointment.horario)}</td>
      <td>${appointment.status || 'Pendente'}</td>
      <td>${appointment.obs || appointment.notes || '-'}</td>
      <td>
        <button class="action-button confirm-button" data-id="${id}">Confirmar</button>
        <button class="action-button reject-button" data-id="${id}" style="margin-left:8px;background:#c1393f">Recusar</button>
        <button class="action-button edit-button" data-id="${id}" style="margin-left:8px;background:#5c5c8a">Editar</button>
      </td>
    `;
    body.appendChild(row);
  });

  table.appendChild(body);
  appointmentList.innerHTML = '';
  appointmentList.appendChild(table);

  appointmentList.querySelectorAll('.confirm-button').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      try {
        await updateAppointment(id, { status: 'Confirmado' });
        showMessage('Agendamento confirmado.');
        renderAppointments();
      } catch (err) {
        console.error(err);
        showMessage('Erro ao confirmar: ' + err.message, false);
      }
    });
  });

  appointmentList.querySelectorAll('.reject-button').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (!confirm('Deseja recusar este agendamento?')) return;
      try {
        await updateAppointment(id, { status: 'Recusado' });
        showMessage('Agendamento recusado.');
        renderAppointments();
      } catch (err) {
        console.error(err);
        showMessage('Erro ao recusar: ' + err.message, false);
      }
    });
  });

  appointmentList.querySelectorAll('.edit-button').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const appointments = await fetchAppointments();
      const appointment = appointments.find(item => item.id === id);
      if (!appointment) return showMessage('Agendamento não encontrado', false);

      const nome = prompt('Nome da cliente:', appointment.nome || appointment.clientName || '');
      if (nome === null) return;
      const telefone = prompt('Telefone:', appointment.telefone || appointment.contact || '');
      if (telefone === null) return;
      const servico = prompt('Serviço:', appointment.servico || appointment.serviceType || appointment['serviço'] || '');
      if (servico === null) return;
      const horario = prompt('Data e horário (YYYY-MM-DD HH:MM):', appointment.horario || '');
      if (horario === null) return;
      const obs = prompt('Observações:', appointment.obs || appointment.notes || '');
      if (obs === null) return;

      try {
        await updateAppointment(id, { nome, telefone, servico, horario, obs });
        showMessage('Agendamento atualizado com sucesso!');
        renderAppointments();
      } catch (err) {
        console.error(err);
        showMessage('Erro ao atualizar: ' + err.message, false);
      }
    });
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    nome: document.getElementById('clientName').value.trim(),
    telefone: document.getElementById('contact').value.trim(),
    servico: document.getElementById('serviceType').value,
    horario: document.getElementById('appointmentDate').value + ' ' + document.getElementById('appointmentTime').value,
    obs: document.getElementById('notes').value.trim(),
  };

  if (!payload.nome || !payload.telefone || !payload.servico || !payload.horario) {
    showMessage('Por favor, preencha todos os campos obrigatórios.', false);
    return;
  }

  if (appointmentTime.value < '09:00' || appointmentTime.value > '19:30') {
    showMessage('Horário disponível apenas entre 09:00 e 19:30.', false);
    return;
  }

  const whatsappUrl = `https://wa.me/${BUSINESS_PHONE}?text=${encodeURIComponent(buildWhatsAppMessage(payload))}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

  try {
    const res = await fetch(`${API_BASE}/agenda`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro ao salvar');
    form.reset();
    showMessage('Pedido de agendamento enviado. Aguarde confirmação.');
    if (isAdminPage) setTimeout(renderAppointments, 600);
  } catch (err) {
    console.error(err);
    showMessage('Erro ao salvar agendamento: ' + err.message, false);
  }
});

enforceBusinessHours();
populateServiceOptions();
setPageMode();
renderAppointments();
