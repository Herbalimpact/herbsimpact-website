/* ===========================================================
   Herbal Impact — Shared Scripts
   =========================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* Mobile menu toggle */
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  /* Generic "coming soon" form handler (contact + newsletter) */
  document.querySelectorAll('form[data-static-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const msg = form.querySelector('.form-message');
      if (msg) {
        msg.textContent = form.dataset.successMessage || 'Thank you! We will be in touch soon.';
        msg.style.display = 'block';
      }
      form.reset();
    });
  });

  /* ---------------- BMI Calculator ---------------- */
  const bmiForm = document.getElementById('bmi-form');
  if (bmiForm) {
    bmiForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const unit = bmiForm.querySelector('input[name="bmi-unit"]:checked').value;
      const result = document.getElementById('bmi-result');
      let heightVal = parseFloat(document.getElementById('bmi-height').value);
      let weightVal = parseFloat(document.getElementById('bmi-weight').value);

      if (!heightVal || !weightVal || heightVal <= 0 || weightVal <= 0) {
        result.textContent = 'Please enter valid height and weight.';
        return;
      }

      let bmi;
      if (unit === 'metric') {
        const heightM = heightVal / 100;
        bmi = weightVal / (heightM * heightM);
      } else {
        bmi = (703 * weightVal) / (heightVal * heightVal);
      }

      let category = '';
      if (bmi < 18.5) category = 'Underweight';
      else if (bmi < 25) category = 'Healthy weight';
      else if (bmi < 30) category = 'Overweight';
      else category = 'Obese';

      result.textContent = 'Your BMI is ' + bmi.toFixed(1) + ' (' + category + ')';
    });
  }

  /* ---------------- 0% Payment Plan Calculator ---------------- */
  const planForm = document.getElementById('plan-form');
  if (planForm) {
    planForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const currency = document.getElementById('plan-currency').value;
      const amount = parseFloat(document.getElementById('plan-amount').value);
      const term = parseInt(document.getElementById('plan-term').value, 10);
      const wrap = document.getElementById('plan-result-wrap');

      if (!amount || amount <= 0 || !term || term <= 0) {
        wrap.innerHTML = '<p>Please enter a valid amount and term.</p>';
        return;
      }

      const installment = amount / term;
      let rows = '';
      let remaining = amount;
      for (let i = 1; i <= term; i++) {
        remaining -= installment;
        rows += '<tr><td>' + i + '</td><td>' + currency + ' ' + installment.toFixed(2) + '</td><td>' + currency + ' ' + Math.max(remaining, 0).toFixed(2) + '</td></tr>';
      }

      wrap.innerHTML = '<div class="result">Equal instalments: ' + currency + ' ' + installment.toFixed(2) + ' per month for ' + term + ' months.</div>' +
        '<div class="table-wrap"><table class="schedule"><thead><tr><th>Month</th><th>Payment</th><th>Balance</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    });
  }

  /* ---------------- Loan Amortisation Calculator ---------------- */
  const loanForm = document.getElementById('loan-form');
  if (loanForm) {
    loanForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const currency = document.getElementById('loan-currency').value;
      const amount = parseFloat(document.getElementById('loan-amount').value);
      const term = parseInt(document.getElementById('loan-term').value, 10);
      const rate = parseFloat(document.getElementById('loan-rate').value);
      const wrap = document.getElementById('loan-result-wrap');

      if (!amount || amount <= 0 || !term || term <= 0 || isNaN(rate) || rate < 0) {
        wrap.innerHTML = '<p>Please enter valid loan details.</p>';
        return;
      }

      const monthlyRate = (rate / 100) / 12;
      let payment;
      if (monthlyRate === 0) {
        payment = amount / term;
      } else {
        payment = amount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
      }

      let balance = amount;
      let totalInterest = 0;
      let rows = '';
      for (let i = 1; i <= term; i++) {
        const interest = balance * monthlyRate;
        const principal = payment - interest;
        balance -= principal;
        totalInterest += interest;
        rows += '<tr><td>' + i + '</td><td>' + currency + ' ' + payment.toFixed(2) + '</td><td>' + currency + ' ' + interest.toFixed(2) + '</td><td>' + currency + ' ' + principal.toFixed(2) + '</td><td>' + currency + ' ' + Math.max(balance, 0).toFixed(2) + '</td></tr>';
      }

      wrap.innerHTML = '<div class="result">Monthly payment: ' + currency + ' ' + payment.toFixed(2) + ' &nbsp;|&nbsp; Total interest: ' + currency + ' ' + totalInterest.toFixed(2) + '</div>' +
        '<div class="table-wrap"><table class="schedule"><thead><tr><th>Month</th><th>Payment</th><th>Interest</th><th>Principal</th><th>Balance</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    });
  }

});
