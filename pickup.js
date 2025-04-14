document.addEventListener('DOMContentLoaded', () => {
  const pickupForm = document.getElementById('pickupForm');
  const mobileInput = document.getElementById('mobile');
  const quantityInput = document.getElementById('quantity');
  const dateInput = document.getElementById('date');
  const otpSection = document.querySelector('.otp-section');
  const otpContainer = document.querySelector('.otp-container');
  const resendTimer = document.querySelector('.resend-timer');
  const resendBtn = document.querySelector('.resend-btn');
  let otpSent = false;
  let timerInterval;

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);

  // Add clear buttons to number inputs
  addClearButton(mobileInput);
  addClearButton(quantityInput);

  // Mobile number formatting
  mobileInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);
    e.target.value = value;
    updateClearButtonVisibility(e.target);
  });

  // Handle mobile number input
  mobileInput.addEventListener('blur', async () => {
    if (mobileInput.value.length === 10 && !otpSent) {
      try {
        await sendOTP(mobileInput.value);
        otpSent = true;
        showOTPSection();
        startResendTimer();
      } catch (error) {
        showMessage('Failed to send OTP. Please try again.', 'error');
      }
    }
  });

  // Form submission
  pickupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = pickupForm.querySelector('.submit-btn');
    
    try {
      // Show loading state
      setButtonState(submitBtn, 'loading');
      
      // Get form data
      const formData = new FormData(pickupForm);
      const data = Object.fromEntries(formData);
      
      // Add selected waste types as array
      data.wasteType = Array.from(formData.getAll('wasteType'));
      
      // Validate data
      if (!validatePickupData(data)) {
        setButtonState(submitBtn, 'error');
        return;
      }

      // Mock API call
      await submitPickupRequest(data);
      
      // Show success state
      setButtonState(submitBtn, 'success');
      
      // Show success message
      showMessage('Pickup scheduled successfully! We will confirm shortly.', 'success');
      
      // Reset form after delay
      setTimeout(() => {
        pickupForm.reset();
        setButtonState(submitBtn, 'normal');
        hideOTPSection();
        otpSent = false;
      }, 2000);
      
    } catch (error) {
      setButtonState(submitBtn, 'error');
      showMessage(error.message || 'Failed to schedule pickup. Please try again.', 'error');
      
      // Reset button state after delay
      setTimeout(() => {
        setButtonState(submitBtn, 'normal');
      }, 2000);
    }
  });

  // Resend OTP button click handler
  resendBtn.addEventListener('click', async () => {
    try {
      resendBtn.disabled = true;
      await sendOTP(mobileInput.value);
      startResendTimer();
    } catch (error) {
      showMessage('Failed to resend OTP. Please try again.', 'error');
      resendBtn.disabled = false;
    }
  });
});

function addClearButton(input) {
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'clear-input';
  clearBtn.innerHTML = '×';
  clearBtn.style.display = 'none';
  
  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.style.display = 'none';
    input.focus();
  });
  
  input.parentElement.appendChild(clearBtn);
  
  // Initial visibility check
  updateClearButtonVisibility(input);
  
  // Add input event listener
  input.addEventListener('input', () => updateClearButtonVisibility(input));
}

function updateClearButtonVisibility(input) {
  const clearBtn = input.parentElement.querySelector('.clear-input');
  if (clearBtn) {
    clearBtn.style.display = input.value.length > 0 ? 'flex' : 'none';
  }
}

function setButtonState(button, state) {
  // Remove all states first
  button.classList.remove('loading', 'success', 'error');
  button.disabled = false;
  
  // Set button text content
  const originalText = button.getAttribute('data-original-text') || button.textContent;
  
  if (!button.getAttribute('data-original-text')) {
    button.setAttribute('data-original-text', originalText);
  }
  
  switch (state) {
    case 'loading':
      button.classList.add('loading');
      button.disabled = true;
      break;
    case 'success':
      button.classList.add('success');
      button.disabled = true;
      break;
    case 'error':
      button.classList.add('error');
      button.disabled = true;
      break;
    case 'normal':
      button.textContent = originalText;
      break;
  }
}

function validatePickupData(data) {
  // Validate mobile number
  if (!/^[6-9]\d{9}$/.test(data.mobile)) {
    showMessage('Please enter a valid 10-digit mobile number', 'error');
    return false;
  }

  // Validate date
  const selectedDate = new Date(data.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    showMessage('Please select a future date', 'error');
    return false;
  }

  // Validate quantity
  if (data.quantity < 1) {
    showMessage('Quantity must be at least 1 kg', 'error');
    return false;
  }

  // Validate waste types
  if (data.wasteType.length === 0) {
    showMessage('Please select at least one type of waste', 'error');
    return false;
  }

  return true;
}

async function submitPickupRequest(data) {
  // Mock API call
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Pickup Request Data:', data);
      resolve();
    }, 1500);
  });
}

function showMessage(message, type) {
  // Remove existing messages
  const existingMessage = document.querySelector('.message');
  if (existingMessage) {
    existingMessage.remove();
  }

  // Create message element
  const messageElement = document.createElement('div');
  messageElement.className = `message ${type}-message`;
  messageElement.textContent = message;

  // Insert after form
  const form = document.getElementById('pickupForm');
  form.parentNode.insertBefore(messageElement, form.nextSibling);

  // Remove message after 5 seconds
  setTimeout(() => {
    messageElement.remove();
  }, 5000);
}

function showOTPSection() {
  const otpSection = document.querySelector('.otp-section');
  otpSection.style.display = 'block';
  setTimeout(() => otpSection.classList.add('show'), 10);
  createOTPInputs();
}

function hideOTPSection() {
  const otpSection = document.querySelector('.otp-section');
  otpSection.classList.remove('show');
  setTimeout(() => otpSection.style.display = 'none', 300);
}

function createOTPInputs() {
  const otpContainer = document.querySelector('.otp-container');
  otpContainer.innerHTML = '';
  
  for (let i = 0; i < 6; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 1;
    input.className = 'otp-digit';
    input.required = true;
    input.autocomplete = 'off';
    
    input.addEventListener('input', (e) => {
      if (e.target.value) {
        const next = e.target.nextElementSibling;
        if (next) next.focus();
      }
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value) {
        const prev = e.target.previousElementSibling;
        if (prev) prev.focus();
      }
    });
    
    otpContainer.appendChild(input);
  }
}

function getOTPValue() {
  const inputs = document.querySelectorAll('.otp-digit');
  return Array.from(inputs).map(input => input.value).join('');
}

function startResendTimer() {
  const resendTimer = document.querySelector('.resend-timer');
  const resendBtn = document.querySelector('.resend-btn');
  let timeLeft = 30;
  
  resendBtn.disabled = true;
  resendTimer.textContent = `Resend OTP in ${timeLeft}s`;
  
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    resendTimer.textContent = `Resend OTP in ${timeLeft}s`;
    
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      resendTimer.textContent = '';
      resendBtn.disabled = false;
    }
  }, 1000);
}

// Mock API functions
async function sendOTP(mobile) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`OTP sent to ${mobile}`);
      resolve();
    }, 1000);
  });
}

async function verifyOTP(otp, mobile) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`OTP ${otp} verified for ${mobile}`);
      resolve();
    }, 1000);
  });
} 