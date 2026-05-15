/* MONOLITH Museum — hlavní skript */
document.addEventListener('DOMContentLoaded', () => {
  renderExpositions();
  initCountdown();
  initFaq();
  initReservationForm();
  initReveal();
});

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

function renderExpositions() {
  const expositions = window.EXPOSITIONS || [];
  const grid = document.getElementById('expositions-grid');
  const filters = document.getElementById('exposition-filters');
  if (!grid || !filters || !expositions.length) return;

  const categories = ['Vše', ...new Set(expositions.map(item => item.category))];

  filters.innerHTML = categories.map((category, index) => `
    <button class="filter-btn ${index === 0 ? 'active' : ''}" type="button" data-category="${escapeHTML(category)}">
      ${escapeHTML(category)}
    </button>
  `).join('');

  const drawCards = (selectedCategory = 'Vše') => {
    const visible = selectedCategory === 'Vše'
      ? expositions
      : expositions.filter(item => item.category === selectedCategory);

    grid.innerHTML = visible.map(item => `
      <div class="col-sm-6 col-lg-3" role="listitem">
        <article class="exposition-card h-100">
          <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" class="exposition-img" loading="lazy">
          <div class="exposition-body">
            <span class="exposition-category">${escapeHTML(item.category)}</span>
            <h3>${escapeHTML(item.name)}</h3>
            <p>${escapeHTML(item.description)}</p>
            <div class="exposition-meta">
              <span><i class="bi bi-geo-alt"></i> ${escapeHTML(item.room)}</span>
              <span><i class="bi bi-calendar3"></i> ${escapeHTML(item.year)}</span>
            </div>
          </div>
        </article>
      </div>
    `).join('');
  };

  filters.addEventListener('click', (event) => {
    const button = event.target.closest('.filter-btn');
    if (!button) return;
    filters.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    drawCards(button.dataset.category);
  });

  drawCards();
}

function initCountdown() {
  const terms = [
    {
      title: 'The Void Speaks',
      date: '2026-09-01T10:00:00+02:00'
    },
    {
      title: 'Horizon of Stone',
      date: '2026-03-15T10:00:00+01:00'
    },
    {
      title: 'Iron Cathedral',
      date: '2026-05-01T10:00:00+02:00'
    }
  ];

  const nextTerm = terms
    .map(term => ({
      ...term,
      time: new Date(term.date).getTime()
    }))
    .filter(term => term.time > Date.now())
    .sort((a, b) => a.time - b.time)[0];

  const ids = {
    days: 'cd-days',
    hours: 'cd-hours',
    mins: 'cd-mins',
    secs: 'cd-secs'
  };

  const elements = Object.fromEntries(
    Object.entries(ids).map(([key, id]) => [key, document.getElementById(id)])
  );

  if (!elements.days) return;

  const subtitle = document.getElementById('countdown-subtitle');
  const title = document.querySelector('.countdown-title');

  if (!nextTerm) {
    Object.values(elements).forEach(el => {
      if (el) el.textContent = '00';
    });

    if (subtitle) subtitle.textContent = 'Momentálně není naplánovaný žádný nový termín.';
    return;
  }

  if (title) title.textContent = nextTerm.title;

  const tick = () => {
    const distance = nextTerm.time - Date.now();

    if (distance <= 0) {
      Object.values(elements).forEach(el => {
        if (el) el.textContent = '00';
      });

      if (subtitle) subtitle.textContent = 'Výstava je již otevřena.';
      return;
    }

    const days = Math.floor(distance / 86400000);
    const hours = Math.floor((distance % 86400000) / 3600000);
    const mins = Math.floor((distance % 3600000) / 60000);
    const secs = Math.floor((distance % 60000) / 1000);

    elements.days.textContent = String(days).padStart(2, '0');
    elements.hours.textContent = String(hours).padStart(2, '0');
    elements.mins.textContent = String(mins).padStart(2, '0');
    elements.secs.textContent = String(secs).padStart(2, '0');
  };

  tick();
  setInterval(tick, 1000);
}

function initFaq() {
  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
      const item = question.closest('.faq-item');
      item.classList.toggle('open');
    });
  });
}

function initReservationForm() {
  const form = document.getElementById('reservation-form');
  if (!form) return;
  const prices = { standard: 250, senior: 150, student: 180, family: 700, premium: 450 };
  const labels = { standard: 'Standardní', senior: 'Senior', student: 'Student', family: 'Rodinná', premium: 'Prémiová' };
  const type = document.getElementById('res-ticket-type');
  const count = document.getElementById('res-count');
  const total = document.getElementById('total-price');
  const summary = document.getElementById('summary-details');
  const success = document.getElementById('reservation-success');

  document.getElementById('count-minus')?.addEventListener('click', () => {
    count.value = Math.max(1, Number(count.value) - 1);
    updateSummary();
  });
  document.getElementById('count-plus')?.addEventListener('click', () => {
    count.value = Math.min(20, Number(count.value) + 1);
    updateSummary();
  });
  form.addEventListener('input', updateSummary);
  type?.addEventListener('change', updateSummary);

  function updateSummary() {
    const selected = type.value;
    const amount = Number(count.value) || 1;
    const price = prices[selected] || 0;
    total.textContent = `${price * amount} Kč`;
    if (!selected) {
      summary.innerHTML = '<p style="color:rgba(207,187,153,.4); font-size:0.875rem;">Vyplňte formulář pro zobrazení shrnutí.</p>';
      return;
    }
    summary.innerHTML = `
      <p><strong>Vstupenka:</strong> ${labels[selected]}</p>
      <p><strong>Počet:</strong> ${amount}</p>
      <p><strong>Cena za kus:</strong> ${price} Kč</p>
    `;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }
    const modalBody = document.getElementById('confirm-modal-body');
    const name = document.getElementById('res-name').value;
    const email = document.getElementById('res-email').value;
    const date = document.getElementById('res-date').value;
    const time = document.getElementById('res-time').value;
    modalBody.innerHTML = `
      <p><strong>Jméno:</strong> ${escapeHTML(name)}</p>
      <p><strong>E-mail:</strong> ${escapeHTML(email)}</p>
      <p><strong>Termín:</strong> ${escapeHTML(date)} v ${escapeHTML(time)}</p>
      <p><strong>Celkem:</strong> ${escapeHTML(total.textContent)}</p>
    `;
    const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
    modal.show();
    document.getElementById('confirm-reservation-btn').onclick = () => {
      modal.hide();
      form.style.display = 'none';
      success.style.display = 'block';
    };
  });

  updateSummary();
}

function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach(item => item.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach(item => observer.observe(item));
}


const fakeResponse = {
  success: true,
  message: 'Rezervace byla úspěšně přijata.',
  reservation_id: 'DEMO-' + Math.floor(Math.random() * 100000),
};

console.log('Simulace PHP odpovědi:', fakeResponse);
