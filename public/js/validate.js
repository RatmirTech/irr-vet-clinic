function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return true;

  const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
  let isValid = true;

  inputs.forEach((input) => {
    const value = input.value.trim();
    if (!value) {
      showError(input, 'Это поле обязательно');
      isValid = false;
    } else {
      clearError(input);
    }

    if (input.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        showError(input, 'Введите корректный email');
        isValid = false;
      } else {
        clearError(input);
      }
    }

    if (input.type === 'password' && value) {
      if (value.length < 6) {
        showError(input, 'Пароль должен быть не менее 6 символов');
        isValid = false;
      } else {
        clearError(input);
      }
    }

    if (input.name === 'phone' && value) {
      const phoneRegex = /^\+?[0-9\s\-()]+$/;
      if (!phoneRegex.test(value)) {
        showError(input, 'Введите корректный номер телефона');
        isValid = false;
      } else {
        clearError(input);
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

// Form submission validation
$(document).ready(function () {
  $('form').on('submit', function (e) {
    if (!validateForm(this.id)) {
      e.preventDefault();
    }
  });
});
