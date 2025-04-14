// Form handling
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('verificationForm');
  const mobileInput = document.getElementById('mobileNumber');
  let otpSent = false;
  let timerInterval = null;

  // Add clear button to mobile input
  addClearButton(mobileInput);

  // Mobile number formatting and clear button visibility
  mobileInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);
    e.target.value = value;
    updateClearButtonVisibility(e.target);

    // Automatically send OTP when valid number is entered
    if (value.length === 10 && validateMobile(value) && !otpSent) {
      sendOTPAndShowSection(value);
    }
  });

  // Form submission handling
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mobile = mobileInput.value;
    const verifyBtn = e.target.querySelector('.verify-btn');
    const otp = getOTPValue();

    try {
      verifyBtn.disabled = true;
      verifyBtn.classList.add('loading');

      if (!validateMobile(mobile)) {
        verifyBtn.classList.remove('loading');
        verifyBtn.disabled = false;
        return;
      }

      if (!otp || otp.length !== 6) {
        verifyBtn.classList.remove('loading');
        verifyBtn.disabled = false;
        return;
      }

      await verifyOTP(otp, mobile);
      verifyBtn.classList.remove('loading');
      verifyBtn.classList.add('success');
      
      // Show success popup
      showSuccessPopup();
      
      // Reset form after success
      setTimeout(() => {
        resetForm();
      }, 2000);

    } catch (error) {
      verifyBtn.classList.remove('loading');
      verifyBtn.classList.add('error');
      
      setTimeout(() => {
        verifyBtn.classList.remove('error');
        verifyBtn.disabled = false;
      }, 2000);
    }
  });
});

async function sendOTPAndShowSection(mobile) {
  const verifyBtn = document.querySelector('.verify-btn');
  
  try {
    verifyBtn.disabled = true;
    verifyBtn.classList.add('loading');
    
    await sendOTP(mobile);
    otpSent = true;
    
    // Add OTP input section
    addOTPInput();
    startResendTimer();
    
    verifyBtn.textContent = 'Verify OTP';
    verifyBtn.classList.remove('loading');
    verifyBtn.disabled = false;
    
  } catch (error) {
    verifyBtn.classList.remove('loading');
    verifyBtn.disabled = false;
  }
}

function getOTPValue() {
  const inputs = document.querySelectorAll('.otp-digit');
  return Array.from(inputs).map(input => input.value).join('');
}

function addOTPInput() {
  const form = document.getElementById('verificationForm');
  const inputGroup = form.querySelector('.input-group');
  
  // Remove existing OTP container if any
  const existingContainer = form.querySelector('.otp-container');
  if (existingContainer) existingContainer.remove();
  
  const otpContainer = document.createElement('div');
  otpContainer.className = 'otp-container';
  
  // Create 6 input boxes for OTP
  for (let i = 0; i < 6; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 1;
    input.className = 'otp-digit';
    input.required = true;
    input.autocomplete = 'off';
    input.inputMode = 'numeric';
    input.pattern = '\\d*';
    
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
      if (e.target.value) {
        const next = e.target.nextElementSibling;
        if (next && next.classList.contains('otp-digit')) {
          next.focus();
        }
      }
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value) {
        const prev = e.target.previousElementSibling;
        if (prev && prev.classList.contains('otp-digit')) {
          prev.focus();
        }
      }
    });
    
    otpContainer.appendChild(input);
  }
  
  // Insert after input group
  inputGroup.insertAdjacentElement('afterend', otpContainer);
}

function startResendTimer() {
  const form = document.getElementById('verificationForm');
  const existingTimer = form.querySelector('.resend-timer');
  const existingBtn = form.querySelector('.resend-btn');
  
  if (existingTimer) existingTimer.remove();
  if (existingBtn) existingBtn.remove();
  
  const timerDisplay = document.createElement('div');
  timerDisplay.className = 'resend-timer';
  
  const resendButton = document.createElement('button');
  resendButton.type = 'button';
  resendButton.className = 'resend-btn';
  resendButton.textContent = 'Resend OTP';
  resendButton.disabled = true;
  
  form.appendChild(timerDisplay);
  form.appendChild(resendButton);
  
  let timeLeft = 30;
  timerDisplay.textContent = `Resend OTP in ${timeLeft}s`;
  
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerDisplay.style.display = 'none';
      resendButton.disabled = false;
    } else {
      timerDisplay.textContent = `Resend OTP in ${timeLeft}s`;
    }
  }, 1000);
  
  resendButton.addEventListener('click', async () => {
    const mobile = document.getElementById('mobileNumber').value;
    if (validateMobile(mobile)) {
      resendButton.disabled = true;
      await sendOTPAndShowSection(mobile);
    }
  });
}

function resetForm() {
  const form = document.getElementById('verificationForm');
  const otpContainer = form.querySelector('.otp-container');
  const timerDisplay = form.querySelector('.resend-timer');
  const resendButton = form.querySelector('.resend-btn');
  const verifyBtn = form.querySelector('.verify-btn');
  
  if (otpContainer) otpContainer.remove();
  if (timerDisplay) timerDisplay.remove();
  if (resendButton) resendButton.remove();
  
  form.reset();
  verifyBtn.textContent = 'Send OTP';
  verifyBtn.className = 'verify-btn';
  verifyBtn.disabled = false;
  otpSent = false;
  clearInterval(timerInterval);
}

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

// Validation functions
function validateMobile(mobile) {
  return /^[6-9]\d{9}$/.test(mobile);
}

// API mock functions
async function sendOTP(mobile) {
  return new Promise(resolve => setTimeout(resolve, 1000));
}

async function verifyOTP(otp, mobile) {
  return new Promise(resolve => setTimeout(resolve, 1000));
}

function showSuccessPopup() {
  // Remove any existing popup
  const existingPopup = document.querySelector('.success-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create new popup
  const popup = document.createElement('div');
  popup.className = 'success-popup';
  popup.innerHTML = `
    <i class="fas fa-check-circle"></i>
    <p>OTP verified successfully!</p>
  `;

  // Add to document
  document.body.appendChild(popup);

  // Remove after 3 seconds with animation
  setTimeout(() => {
    popup.style.animation = 'slideOut 0.3s ease-out forwards';
    setTimeout(() => popup.remove(), 300);
  }, 3000);
}
  