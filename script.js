const enquiryForm = document.getElementById('enquiryForm');
const formAlert = document.getElementById('formAlert');
const submitButton = document.getElementById('submitButton');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');

function setMinDate() {
  const today = new Date().toISOString().split('T')[0];
  startDateInput.min = today;
  endDateInput.min = today;
}

function showAlert(message, type = 'danger') {
  formAlert.innerHTML = `<div class="alert alert-${type} py-2" role="alert">${message}</div>`;
}

function validatePhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return /^\d{10}$/.test(cleaned);
}

const apiBase = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

enquiryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(enquiryForm);
  const payload = {
    name: formData.get('name').trim(),
    phone: formData.get('phone').trim(),
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    destination: formData.get('destination').trim(),
    message: formData.get('message').trim(),
  };

  if (!payload.name || !payload.phone || !payload.startDate || !payload.endDate || !payload.destination) {
    showAlert('Please fill all required fields.', 'warning');
    return;
  }
  if (!validatePhone(payload.phone)) {
    showAlert('Please enter a valid 10-digit mobile number.', 'warning');
    return;
  }
  if (payload.startDate > payload.endDate) {
    showAlert('Travel end date must be same or after the start date.', 'warning');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Sending...';

  try {
    const response = await fetch(`${apiBase}/api/enquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Unable to submit enquiry right now.');
    }

    enquiryForm.reset();
    setMinDate();
    showAlert('Thank you! Your enquiry has been sent. We will contact you soon.', 'success');
  } catch (error) {
    showAlert(error.message, 'danger');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Send Enquiry';
  }
});

window.addEventListener('DOMContentLoaded', setMinDate);
