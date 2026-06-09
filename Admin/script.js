const API_BASE = 'https://studio-riti-backend-production.up.railway.app';
const ADMIN_TOKEN = 'adm123'; // change via env on server for production
const isAdminPage = true;

const messageBox = document.getElementById('message');
const appointmentList = document.getElementById('appointment-list');
const listCard = document.getElementById('list-card');
const pageTitle = document.querySelector('header h1');
const pageSubtitle = document.querySelector('header p');

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


function showMessage(text, ok = true) {
  messageBox.textContent = text;
  messageBox.style.display = 'block';
  messageBox.style.background = ok ? 'rgba(223,240,216,1)' : '#f8d7da';
  setTimeout(() => { messageBox.style.display = 'none'; }, 3000);
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

function renderNotificationLinks(appointment) {
  const adminLink = appointment.adminNotification?.url || appointment.adminNotification?.clientNotification?.url || appointment.adminNotification?.url;
  const clientLink = appointment.clientNotification?.url;
  const lines = [];
  if (appointment.adminNotification?.url) {
    lines.push(`<a href="${appointment.adminNotification.url}" target="_blank" rel="noopener">Admin</a>`);
  }
  if (clientLink) {
    lines.push(`<a href="${clientLink}" target="_blank" rel="noopener">Cliente (${appointment.clientNotification.status || 'Status'})</a>`);
  }
  if (!lines.length) {
    return '-';
  }
  return lines.join('<br>');
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
        <th>Notificação</th>
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
      <td>${renderNotificationLinks(appointment)}</td>
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

  appointmentList.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button || !appointmentList.contains(button)) return;
    const id = button.dataset.id;
    if (!id) return showMessage('Agendamento sem ID não pode ser alterado.', false);

    if (button.classList.contains('confirm-button')) {
      button.disabled = true;
      try {
        await updateAppointment(id, { status: 'Confirmado' });
        showMessage('Agendamento confirmado.');
        renderAppointments();
      } catch (err) {
        console.error(err);
        showMessage('Erro ao confirmar: ' + err.message, false);
      } finally {
        button.disabled = false;
      }
      return;
    }

    if (button.classList.contains('reject-button')) {
      if (!confirm('Deseja recusar este agendamento?')) return;
      button.disabled = true;
      try {
        await updateAppointment(id, { status: 'Recusado' });
        showMessage('Agendamento recusado.');
        renderAppointments();
      } catch (err) {
        console.error(err);
        showMessage('Erro ao recusar: ' + err.message, false);
      } finally {
        button.disabled = false;
      }
      return;
    }

    if (button.classList.contains('edit-button')) {
      button.disabled = true;
      try {
        const appointments = await fetchAppointments();
        const appointment = appointments.find(item => item.id === id);
        if (!appointment) {
          showMessage('Agendamento não encontrado', false);
          return;
        }

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

        await updateAppointment(id, { nome, telefone, servico, horario, obs });
        showMessage('Agendamento atualizado com sucesso!');
        renderAppointments();
      } catch (err) {
        console.error(err);
        showMessage('Erro ao atualizar: ' + err.message, false);
      } finally {
        button.disabled = false;
      }
      return;
    }
  });
}

setPageMode();
renderAppointments();
