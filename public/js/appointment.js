function loadSlots(vetId, date) {
  if (!vetId || !date) {
    return;
  }

  getJSON('/api/schedule', { vet_id: vetId, date: date }).done(function (slots) {
    renderSlots(slots);
  });
}

function renderSlots(slots) {
  const slotsContainer = document.getElementById('slots-container');
  if (!slotsContainer) return;

  slotsContainer.innerHTML = '';

  if (!slots || slots.length === 0) {
    slotsContainer.innerHTML = '<p>Нет доступных слотов на эту дату</p>';
    return;
  }

  slots.forEach((slot) => {
    const slotDiv = document.createElement('div');
    slotDiv.className = 'slot-option';
    slotDiv.innerHTML = `
      <input type="radio" name="slot_id" value="${slot.id}" id="slot-${slot.id}">
      <label for="slot-${slot.id}">${slot.slot_time}</label>
    `;
    slotsContainer.appendChild(slotDiv);
  });
}

// Event listeners for appointment form
$(document).ready(function () {
  const vetSelect = $('#vet_id');
  const dateInput = $('#appointment_date');

  if (vetSelect.length && dateInput.length) {
    vetSelect.on('change', function () {
      const vetId = $(this).val();
      const date = dateInput.val();
      if (vetId && date) {
        loadSlots(vetId, date);
      }
    });

    dateInput.on('change', function () {
      const vetId = vetSelect.val();
      const date = $(this).val();
      if (vetId && date) {
        loadSlots(vetId, date);
      }
    });
  }
});
