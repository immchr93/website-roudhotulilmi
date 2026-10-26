/**
 * Main JavaScript for Majelis Taklim Roudhotul Ilmi (www.roudhotulilmi.id)
 */

document.addEventListener('DOMContentLoaded', () => {
  initPopInAnimations();
  initMediaCarousel();
  initMobileMenu();
  initCalendarButtons();
  initCopyButtons();
  initModals();
  initTabs();
  initClassRegistrationForm();
});

function initMediaCarousel() {
  const carousel = document.querySelector('[data-media-carousel]');
  if (!carousel) return;

  const track = carousel.querySelector('.media-carousel__track');
  const slides = Array.from(carousel.querySelectorAll('.media-carousel__slide'));
  const dots = Array.from(carousel.querySelectorAll('[data-carousel-dot]'));
  const previousButton = carousel.querySelector('[data-carousel-previous]');
  const nextButton = carousel.querySelector('[data-carousel-next]');
  if (!track || !slides.length || !dots.length || !previousButton || !nextButton) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeIndex = 0;
  let timer = null;
  let isHovered = false;
  let isFocused = false;
  let isInView = true;
  let touchStartX = null;

  const showSlide = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${activeIndex * 100}%)`;
    slides.forEach((slide, slideIndex) => {
      slide.setAttribute('aria-hidden', String(slideIndex !== activeIndex));
    });
    dots.forEach((dot, dotIndex) => {
      if (dotIndex === activeIndex) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });
  };

  const stopAutoPlay = () => {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  const startAutoPlay = () => {
    stopAutoPlay();
    if (prefersReducedMotion || isHovered || isFocused || !isInView || document.hidden) return;
    timer = window.setInterval(() => showSlide(activeIndex + 1), 5000);
  };

  previousButton.addEventListener('click', () => {
    showSlide(activeIndex - 1);
    startAutoPlay();
  });
  nextButton.addEventListener('click', () => {
    showSlide(activeIndex + 1);
    startAutoPlay();
  });
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
      startAutoPlay();
    });
  });

  carousel.addEventListener('mouseenter', () => {
    isHovered = true;
    stopAutoPlay();
  });
  carousel.addEventListener('mouseleave', () => {
    isHovered = false;
    startAutoPlay();
  });
  carousel.addEventListener('focusin', () => {
    isFocused = true;
    stopAutoPlay();
  });
  carousel.addEventListener('focusout', (event) => {
    if (!carousel.contains(event.relatedTarget)) {
      isFocused = false;
      startAutoPlay();
    }
  });
  carousel.querySelector('.media-carousel__viewport').addEventListener('pointerdown', (event) => {
    touchStartX = event.pointerType === 'touch' ? event.clientX : null;
  });
  carousel.querySelector('.media-carousel__viewport').addEventListener('pointerup', (event) => {
    if (touchStartX === null) return;
    const swipeDistance = event.clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(swipeDistance) < 45) return;
    showSlide(activeIndex + (swipeDistance < 0 ? 1 : -1));
    startAutoPlay();
  });
  carousel.querySelector('.media-carousel__viewport').addEventListener('pointercancel', () => {
    touchStartX = null;
  });
  document.addEventListener('visibilitychange', startAutoPlay);

  if ('IntersectionObserver' in window) {
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isInView = entry.isIntersecting;
      startAutoPlay();
    });
    visibilityObserver.observe(carousel);
  }

  startAutoPlay();
}

function initPopInAnimations() {
  const elements = document.querySelectorAll('[data-pop-in]');
  if (!elements.length || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  document.documentElement.classList.add('pop-in-ready');

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  elements.forEach(element => observer.observe(element));
}

// Mobile menu toggle
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (toggleBtn && mobileMenu) {
    toggleBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }
}

// Copy to clipboard with toast notification
function copyToClipboard(text, label = 'Nomor Rekening') {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`${label} berhasil disalin ke clipboard!`);
  }).catch(() => {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast(`${label} berhasil disalin!`);
  });
}

function showToast(message) {
  let toast = document.getElementById('copy-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'copy-toast';
    toast.className = 'fixed bottom-6 right-6 z-50 bg-emerald-800 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-600 transition-all duration-300';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <svg class="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
    </svg>
    <span class="text-sm font-medium">${message}</span>
  `;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

function initCopyButtons() {
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const val = btn.getAttribute('data-copy');
      const label = btn.getAttribute('data-label') || 'Teks';
      copyToClipboard(val, label);
    });
  });
}

// Google Calendar integration
function addToGoogleCalendar(title, details, location, startIso, endIso) {
  // Format: YYYYMMDDTHHmmssZ
  const formatTime = (isoStr) => {
    const d = new Date(isoStr);
    return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  };

  const startFormatted = formatTime(startIso);
  const endFormatted = formatTime(endIso);

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}&dates=${startFormatted}/${endFormatted}`;
  window.open(url, '_blank');
}

function initCalendarButtons() {
  document.querySelectorAll('[data-cal-title]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const title = btn.getAttribute('data-cal-title');
      const details = btn.getAttribute('data-cal-details') || 'Kajian Majelis Taklim Roudhotul Ilmi';
      const location = btn.getAttribute('data-cal-location') || 'Masjid Roudhotul Ilmi';
      const start = btn.getAttribute('data-cal-start');
      const end = btn.getAttribute('data-cal-end');
      if (start && end) {
        addToGoogleCalendar(title, details, location, start, end);
      }
    });
  });
}

// Filter Tabs handler
function initTabs() {
  const tabContainers = document.querySelectorAll('[data-tab-container]');
  tabContainers.forEach(container => {
    const buttons = container.querySelectorAll('[data-filter]');
    const targetGroup = container.getAttribute('data-tab-container');
    const items = document.querySelectorAll(`[data-group="${targetGroup}"]`);

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => {
          b.classList.remove('bg-emerald-700', 'text-white', 'shadow-md');
          b.classList.add('bg-slate-100', 'text-slate-600', 'hover:bg-slate-200');
        });
        btn.classList.add('bg-emerald-700', 'text-white', 'shadow-md');
        btn.classList.remove('bg-slate-100', 'text-slate-600', 'hover:bg-slate-200');

        const filter = btn.getAttribute('data-filter');
        items.forEach(item => {
          const category = item.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            item.classList.remove('hidden');
          } else {
            item.classList.add('hidden');
          }
        });
      });
    });
  });
}

function initClassRegistrationForm() {
  const form = document.getElementById('class-registration-form');
  if (!form) return;

  const phoneInput = document.getElementById('registration-phone');
  const status = document.getElementById('registration-status');
  const fallbackLink = document.getElementById('registration-whatsapp-fallback');

  phoneInput.addEventListener('input', () => phoneInput.setCustomValidity(''));

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const normalizedPhone = phoneInput.value.trim().replace(/[\s().-]/g, '');
    const validPhone = /^(?:\+?62|0)8\d{8,11}$/.test(normalizedPhone);
    phoneInput.setCustomValidity(validPhone ? '' : 'Masukkan nomor WhatsApp Indonesia yang valid, misalnya 081234567890.');
    if (!form.reportValidity()) return;

    const name = form.elements.namedItem('name').value.trim();
    const session = form.elements.namedItem('session').value;
    const level = form.elements.namedItem('level').value;
    const message = [
      "Assalamu'alaikum Admin Majelis Taklim Roudhotul Ilmi,",
      '',
      'Saya ingin mendaftar kelas Tahsin / Tilawati.',
      `Nama: ${name}`,
      `Nomor WhatsApp: ${normalizedPhone}`,
      `Pilihan hari: ${session}`,
      `Kelas yang diminati: ${level}`,
      '',
      'Mohon informasi dan konfirmasi pendaftarannya. Terima kasih.'
    ].join('\n');
    const whatsappUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(message)}`;

    fallbackLink.href = whatsappUrl;
    fallbackLink.classList.remove('hidden');
    status.textContent = 'Pesan pendaftaran telah disiapkan. Jika WhatsApp tidak terbuka, gunakan tautan berikut.';
    status.hidden = false;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  });
}

// Modal Lightbox
function initModals() {
  const modal = document.getElementById('media-modal');
  if (!modal) return;

  const modalImg = modal.querySelector('#modal-img');
  const modalTitle = modal.querySelector('#modal-title');
  const modalDesc = modal.querySelector('#modal-desc');
  const closeBtn = modal.querySelector('#modal-close');

  document.querySelectorAll('[data-modal-target]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const src = trigger.getAttribute('data-modal-img');
      const title = trigger.getAttribute('data-modal-title');
      const desc = trigger.getAttribute('data-modal-desc');

      if (modalImg) modalImg.src = src;
      if (modalTitle) modalTitle.textContent = title;
      if (modalDesc) modalDesc.textContent = desc;

      modal.classList.remove('hidden');
      modal.classList.add('flex');
    });
  });

  const closeModal = () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}
