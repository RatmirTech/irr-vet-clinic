require('dotenv').config();

const openHour = parseInt(process.env.CLINIC_OPEN_HOUR, 10);
const closeHour = parseInt(process.env.CLINIC_CLOSE_HOUR, 10);
const slotMinutes = parseInt(process.env.CLINIC_SLOT_MINUTES, 10);

const OPEN_HOUR = Number.isFinite(openHour) ? openHour : 9;
const CLOSE_HOUR = Number.isFinite(closeHour) ? closeHour : 19;
const SLOT_MINUTES = Number.isFinite(slotMinutes) && slotMinutes > 0 ? slotMinutes : 15;

function buildSlotTimes() {
  const times = [];
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      times.push(String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'));
    }
  }
  return times;
}

const pad = (n) => String(n).padStart(2, '0');

module.exports = {
  OPEN_HOUR,
  CLOSE_HOUR,
  SLOT_MINUTES,
  OPEN_TIME: `${pad(OPEN_HOUR)}:00`,
  CLOSE_TIME: `${pad(CLOSE_HOUR)}:00`,
  STEP_SECONDS: SLOT_MINUTES * 60,
  buildSlotTimes,
};
