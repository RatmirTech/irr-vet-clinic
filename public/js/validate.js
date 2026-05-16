function validateForm(formId) {
  const form = typeof formId === 'string' ? document.getElementById(formId) : formId;
  if (!form) return true;

  clearAllErrors(form);
  const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
  let isValid = true;

  inputs.forEach((input) => {
    const value = input.value.trim();

    if (!value) {
      showError(input, 'Это поле обязательно');
      isValid = false;
      return;
    }

    if (input.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        showError(input, 'Введите корректный email');
        isValid = false;
      }
    }

    if (input.type === 'password' && value) {
      if (value.length < 6) {
        showError(input, 'Пароль должен быть не менее 6 символов');
        isValid = false;
      }
    }

    if (input.name === 'phone' && value) {
      const phoneRegex = /^\+?[0-9\s\-()]+$/;
      if (!phoneRegex.test(value)) {
        showError(input, 'Введите корректный номер телефона');
        isValid = false;
      }
    }

    if (input.type === 'date' && input.name === 'appointmentDate' && value) {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        showError(input, 'Дата должна быть сегодня или позже');
        isValid = false;
      }
    }
  });

  return isValid;
}

function showError(field, message) {
  field.classList.add('error');
  let errorDiv = field.nextElementSibling;
  if (!errorDiv || !errorDiv.classList.contains('error-message')) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    field.parentNode.insertBefore(errorDiv, field.nextSibling);
  }
  errorDiv.textContent = message;
}

function clearError(field) {
  field.classList.remove('error');
  const errorDiv = field.nextElementSibling;
  if (errorDiv && errorDiv.classList.contains('error-message')) {
    errorDiv.remove();
  }
}

function clearAllErrors(form) {
  const errorMessages = form.querySelectorAll('.error-message');
  errorMessages.forEach(msg => msg.remove());
  const errorFields = form.querySelectorAll('.error');
  errorFields.forEach(field => field.classList.remove('error'));
}

document.addEventListener('DOMContentLoaded', function () {
  const forms = document.querySelectorAll('form[data-validate="true"]');
  forms.forEach(form => {
    form.addEventListener('submit', function (e) {
      if (!validateForm(this)) {
        e.preventDefault();
      }
    });
  });
});
