/* ===========================================================
   Herbal Impact ÃÂ¢ÃÂÃÂ Shared Scripts
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

  /* Form helpers */
  function showMsg(form, text, ok) {
    let msg = form.querySelector('.form-message');
    if (!msg) { msg = document.createElement('p'); msg.className = 'form-message small'; form.appendChild(msg); }
    if (msg.dataset.okColor === undefined) msg.dataset.okColor = msg.style.color || '';
    msg.textContent = text;
    msg.style.display = 'block';
    msg.style.color = ok ? msg.dataset.okColor : (form.closest('footer') ? '#ffb3a7' : '#c0392b');
  }
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* Newsletter forms -> Brevo list "Herbal Impact - Newsletter" */
  const BREVO_URL = 'https://3333f3b8.sibforms.com/serve/MUIFAFoKnJLz-YB5MKEbMUc4M6rzSATL1OJMxBYypOCzICZZQKIYg6HdqOuT3R44o8Rape7N-Zwq9hM3w2phLTK6L8eeIiZPd3-YG7mMNFWb2RLM0shqgtui_Ezo-ePBP0mVMPajlYci_KeGngxEo8FAtvLTbJ7A2TVuklbB-5IIqfJ1nA6K8uUzAwSbjBNBHvT3Do9eU88pZuMijA==';
  document.querySelectorAll('form[data-brevo-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = (form.querySelector('input[name="EMAIL"]').value || '').trim();
      if (!EMAIL_RE.test(email)) { showMsg(form, 'Please enter a valid email address.', false); return; }
      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      const data = new FormData(form);
      data.append('locale', 'en');
      data.append('html_type', 'simple');
      fetch(BREVO_URL, { method: 'POST', mode: 'no-cors', body: data })
        .then(function () {
          showMsg(form, form.dataset.successMessage || 'Thanks for subscribing!', true);
          form.reset();
        })
        .catch(function () { showMsg(form, 'Sorry, something went wrong. Please try again.', false); })
        .finally(function () { if (btn) btn.disabled = false; });
    });
  });

  /* Contact form -> opens WhatsApp chat with Herbal Impact, message pre-filled */
  const WA_NUMBER = '255754281131';
  document.querySelectorAll('form[data-wa-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      if (d.botcheck) return;
      const text = 'Hello Herbal Impact,\n\n' + (d.message || '').trim() +
        '\n\nName: ' + (d.name || '').trim() +
        (d.email ? '\nEmail: ' + d.email.trim() : '') +
        (d.subject ? '\nSubject: ' + d.subject.trim() : '') +
        '\n(Sent from herbsimpact.com)';
      const url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
      const w = window.open(url, '_blank');
      if (!w) window.location.href = url;
      showMsg(form, form.dataset.successMessage, true);
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

/* ---------------- WhatsApp floating button ---------------- */
(function () {
var wa = document.createElement('a');
wa.href = 'https://wa.me/255754281131';
wa.target = '_blank';
wa.rel = 'noopener';
wa.className = 'whatsapp-float';
wa.setAttribute('aria-label', 'Chat with us on WhatsApp');
wa.innerHTML = '<svg viewBox="0 0 32 32" fill="#fff"><path d="M16 3C9 3 3 9 3 16c0 2.4.7 4.7 1.9 6.7L3 29l6.5-1.7c1.9 1 4 1.6 6.5 1.6 7 0 13-6 13-13S23 3 16 3zm0 23.8c-2.2 0-4.3-.6-6.1-1.7l-.4-.3-4.3 1.1 1.1-4.2-.3-.4A10.7 10.7 0 0 1 5.2 16c0-6 4.9-10.8 10.8-10.8S26.8 10 26.8 16 22 26.8 16 26.8zm5.9-8.1c-.3-.2-1.9-1-2.2-1.1-.3-.1-.5-.2-.7.2-.2.3-.8 1.1-1 1.3-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.6-1-.9-1.6-1.9-1.8-2.3-.2-.3 0-.5.1-.7.1-.1.3-.4.5-.5.2-.2.2-.3.3-.5.1-.2.1-.4 0-.6-.1-.2-.7-1.7-1-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.1.1-1.3z"/></svg>';
document.body.appendChild(wa);
})();

/* ---------------- Footer social icons + visitor counter ---------------- */
document.querySelectorAll('.footer-bottom').forEach(function (el) {
var social = document.createElement('div');
social.className = 'footer-social';
social.style.justifyContent = 'center';
social.style.marginBottom = '14px';
social.innerHTML =
'<a href="https://www.facebook.com/sihakwanza" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M13.5 21v-8h2.7l.4-3.2h-3V7.7c0-.9.3-1.6 1.6-1.6h1.7V3.2C16.6 3.1 15.6 3 14.5 3c-2.5 0-4.2 1.5-4.2 4.3v2.5H7.7V13h2.6v8h3.2z"/></svg></a>' +
'<a href="https://www.instagram.com/herbal_impact/" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M12 2.2c2.7 0 3 0 4 .1 1 .1 1.7.2 2.3.5.6.2 1.1.5 1.6 1 .5.5.8 1 1 1.6.3.6.4 1.3.5 2.3.1 1 .1 1.3.1 4s0 3-.1 4c-.1 1-.2 1.7-.5 2.3-.2.6-.5 1.1-1 1.6-.5.5-1 .8-1.6 1-.6.3-1.3.4-2.3.5-1 .1-1.3.1-4 .1s-3 0-4-.1c-1-.1-1.7-.2-2.3-.5-.6-.2-1.1-.5-1.6-1-.5-.5-.8-1-1-1.6-.3-.6-.4-1.3-.5-2.3-.1-1-.1-1.3-.1-4s0-3 .1-4c.1-1 .2-1.7.5-2.3.2-.6.5-1.1 1-1.6.5-.5 1-.8 1.6-1 .6-.3 1.3-.4 2.3-.5 1-.1 1.3-.1 4-.1zM12 0C9.3 0 8.9 0 7.9.1c-1.1.1-1.9.3-2.6.6-.7.3-1.4.7-2 1.3-.6.6-1 1.2-1.3 2C1.4 4.7 1.2 5.5 1.1 6.6 1 7.6 1 8 1 10.7v2.6c0 2.7 0 3.1.1 4.1.1 1.1.3 1.9.6 2.6.3.7.7 1.4 1.3 2 .6.6 1.2 1 2 1.3.7.3 1.5.5 2.6.6 1 .1 1.4.1 4.1.1s3.1 0 4.1-.1c1.1-.1 1.9-.3 2.6-.6.7-.3 1.4-.7 2-1.3.6-.6 1-1.2 1.3-2 .3-.7.5-1.5.6-2.6.1-1 .1-1.4.1-4.1s0-3.1-.1-4.1c-.1-1.1-.3-1.9-.6-2.6-.3-.7-.7-1.4-1.3-2-.6-.6-1.2-1-2-1.3-.7-.3-1.5-.5-2.6-.6C15.1 0 14.7 0 12 0z"/><path d="M12 5.8A6.2 6.2 0 1 0 12 18.2 6.2 6.2 0 0 0 12 5.8zm0 10.2A4 4 0 1 1 12 8a4 4 0 0 1 0 8z"/><circle cx="18.4" cy="5.6" r="1.4"/></svg></a>' +
'<a href="https://x.com/juma_killaghai" target="_blank" rel="noopener" aria-label="X (Twitter)"><svg viewBox="0 0 24 24"><path d="M18.9 3H22l-7.2 8.2L23 21h-6.8l-5.3-6.5L5 21H1.9l7.7-8.8L1 3h7l4.8 6z"/></svg></a>' +
'<a href="https://www.tiktok.com/@herbal_impact" target="_blank" rel="noopener" aria-label="TikTok"><svg viewBox="0 0 24 24"><path d="M16.6 3c.4 2 1.7 3.7 3.6 4.5v2.7c-1.3 0-2.6-.4-3.6-1.1v6.1c0 3.2-2.6 5.8-5.8 5.8S5 18.4 5 15.2c0-3.1 2.4-5.6 5.5-5.8v2.8c-1.5.2-2.7 1.5-2.7 3 0 1.7 1.4 3 3 3s3-1.3 3-3V3h2.8z"/></svg></a>' +
'<a href="https://whatsapp.com/channel/0029VbEPsuJ6xCSX2li3Un3C" target="_blank" rel="noopener" aria-label="WhatsApp Channel" title="Follow our WhatsApp Channel / Fuata channel yetu"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.7 11.7 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3z"/></svg></a>';
el.parentElement.insertBefore(social, el);
var waCh = document.createElement('p');
waCh.style.cssText = 'text-align:center;margin:0 0 14px;font-size:0.9rem;';
waCh.innerHTML = '<a href="https://whatsapp.com/channel/0029VbEPsuJ6xCSX2li3Un3C" target="_blank" rel="noopener" style="color:#fff;text-decoration:underline;">Follow our WhatsApp Channel / Fuata channel yetu</a>';
el.parentElement.insertBefore(waCh, el);

var counter = document.createElement('div');
counter.className = 'visitor-counter';
counter.textContent = 'Visitors: …';
el.parentElement.insertBefore(counter, el);
// Total unique visitors from GoatCounter (pageviews are recorded by the
// count.js tag at the bottom of each template).
fetch('https://herbsimpact.goatcounter.com/counter/TOTAL.json')
  .then(function (r) { return r.json(); })
  .then(function (d) { counter.textContent = 'Visitors: ' + (d.count || 0); })
  .catch(function () { counter.style.display = 'none'; });
});


/* Our own ads (products & services) from /assets/data/products.json - see /ads.js */
(function () {
  var s = document.createElement('script');
  s.src = '/ads.js';
  s.defer = true;
  document.head.appendChild(s);
})();
