const enquiryForm = document.getElementById('enquiryForm');
const formAlert = document.getElementById('formAlert');
const submitButton = document.getElementById('submitButton');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');

// Enquiries are delivered by FormSubmit.co (no backend server required).
// NOTE: the very first submission triggers a one-time activation email to the
// address below — open it and click the link once to start receiving enquiries.
const FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/prime4travels@gmail.com';

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

enquiryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(enquiryForm);

  // Honeypot: if this hidden field is filled, treat as a bot and silently stop.
  if (formData.get('_honey')) {
    return;
  }

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
    const response = await fetch(FORMSUBMIT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        Name: payload.name,
        Phone: payload.phone,
        'Travel Start Date': payload.startDate,
        'Travel End Date': payload.endDate,
        Destination: payload.destination,
        Message: payload.message || 'N/A',
        _subject: 'New Traveller Booking Enquiry – Prime4Travels',
        _template: 'table',
        _captcha: 'false',
      }),
    });
    const result = await response.json();

    if (!response.ok || result.success === 'false') {
      throw new Error(result.message || 'Unable to submit enquiry right now.');
    }

    enquiryForm.reset();
    setMinDate();
    showAlert('Thank you! Your enquiry has been sent. We will contact you soon.', 'success');
  } catch (error) {
    showAlert(error.message || 'Something went wrong. Please try again or contact us on WhatsApp.', 'danger');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Send Enquiry';
  }
});

window.addEventListener('DOMContentLoaded', setMinDate);
