function getJSON(url, params = {}) {
  return $.ajax({
    url: url,
    type: 'GET',
    dataType: 'json',
    data: params,
    error: handleError,
  });
}

function postJSON(url, data = {}) {
  return $.ajax({
    url: url,
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify(data),
    error: handleError,
  });
}

function postForm(url, formData) {
  return $.ajax({
    url: url,
    type: 'POST',
    data: formData,
    processData: false,
    contentType: false,
    error: handleError,
  });
}

function handleError(xhr, status, error) {
  console.error('AJAX Error:', status, error);
  if (xhr.status === 403) {
    window.location.href = '/auth/login';
  } else if (xhr.status === 404) {
    alert('Ресурс не найден');
  } else {
    alert('Произошла ошибка при выполнении запроса');
  }
}
