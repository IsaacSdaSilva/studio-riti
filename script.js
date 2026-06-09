document.addEventListener('DOMContentLoaded', () => {
  const menuLogo = document.querySelector('.logo');
  const menu = document.querySelector('.menu');
  const body = document.body;
  const menuSections = document.querySelector('.menu-sections');
  const bookingPageBase = window.BOOKING_PAGE_BASE || (window.location.protocol === 'file:' ? '../Agenda-adm/index.html' : '/Agenda-adm/index.html');

  function buildAccordionMenu() {
    const sections = Array.from(document.querySelectorAll('main section[id]'));
    const slugCounts = {};

    const articles = Array.from(document.querySelectorAll('main article.card'));
    articles.forEach(article => {
      const titleEl = article.querySelector('h3');
      if (!titleEl) return;
      const title = titleEl.textContent.trim();
      let slug = title.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      if (!slug) slug = 'item-' + Math.random().toString(36).slice(2, 8);
      slugCounts[slug] = (slugCounts[slug] || 0) + 1;
      if (slugCounts[slug] > 1) slug += '-' + slugCounts[slug];
      article.id = slug;
    });

    sections.forEach(section => {
      const title = section.querySelector('h2')?.textContent.trim() || section.id;
      const sectionItem = document.createElement('li');
      sectionItem.className = 'menu-item';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'menu-summary';
      button.setAttribute('aria-expanded', 'false');
      button.textContent = title;

      const submenu = document.createElement('ul');
      submenu.className = 'submenu';

      const sectionArticles = Array.from(section.querySelectorAll('article.card'));
      
      if (sectionArticles.length === 0) {
        const sectionLink = document.createElement('li');
        const sectionTitle = title.replace(/\s*<[^>]*>\s*/g, '');
        sectionLink.innerHTML = `<a href="#${section.id}">${sectionTitle}</a>`;
        submenu.appendChild(sectionLink);
      } else {
        sectionArticles.forEach(article => {
          const titleEl = article.querySelector('h3');
          if (!titleEl) return;
          const item = document.createElement('li');
          item.innerHTML = `<a href="#${article.id}">${titleEl.textContent.trim()}</a>`;
          submenu.appendChild(item);
        });
      }

      button.addEventListener('click', () => {
        const isOpen = sectionItem.classList.toggle('open');
        button.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) {
          document.querySelectorAll('.menu-item.open').forEach(otherItem => {
            if (otherItem !== sectionItem) {
              otherItem.classList.remove('open');
              otherItem.querySelector('.menu-summary')?.setAttribute('aria-expanded', 'false');
            }
          });
        }
      });

      sectionItem.append(button, submenu);
      menuSections.appendChild(sectionItem);
    });
  }

  function addCardScheduleButtons() {
    const cards = Array.from(document.querySelectorAll('main article.card'));

    cards.forEach(article => {
      const titleEl = article.querySelector('h3');
      if (!titleEl) return;
      const title = titleEl.textContent.trim();
      const button = document.createElement('a');
      button.className = 'card-book';
      button.textContent = 'Agendar';
      button.href = `${bookingPageBase}?service=${encodeURIComponent(title)}`;
      button.target = '_blank';
      button.rel = 'noopener noreferrer';

      const cardText = article.querySelector('.card-text');
      if (cardText) {
        const priceItems = Array.from(cardText.querySelectorAll('.price'));
        const insertAfter = priceItems.length ? priceItems[priceItems.length - 1] : null;
        if (insertAfter) {
          insertAfter.insertAdjacentElement('afterend', button);
        } else {
          cardText.appendChild(button);
        }
      }
    });
  }

  function closeMenu() {
    menu.classList.remove('open');
    menuLogo.classList.remove('open');
    body.classList.remove('menu-open');
    menuLogo.setAttribute('aria-expanded', 'false');
  }

  addCardScheduleButtons();

  if (menuLogo && menu) {
    buildAccordionMenu();

    menuLogo.addEventListener('click', e => {
      e.preventDefault();
      const open = menu.classList.toggle('open');
      menuLogo.classList.toggle('open');
      body.classList.toggle('menu-open');
      menuLogo.setAttribute('aria-expanded', open);
    });

    document.addEventListener('click', event => {
      const target = event.target;
      if (!target.closest('.menu')) return;
      if (target.matches('.menu a')) {
        closeMenu();
      }
    });

    body.addEventListener('click', e => {
      if (menu.classList.contains('open') && !menu.contains(e.target) && !menuLogo.contains(e.target)) {
        closeMenu();
      }
    });
  }

  const navLinks = document.querySelectorAll('.menu a');
  const sectionTargets = Array.from(navLinks).map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);

  function onScroll() {
    const scrollPos = window.scrollY + 120;
    let current = sectionTargets[0];
    for (const sec of sectionTargets) {
      if (sec.offsetTop <= scrollPos) current = sec;
    }
    navLinks.forEach(a => a.classList.toggle('active', document.querySelector(a.getAttribute('href')) === current));
  }

  window.addEventListener('scroll', onScroll);
  onScroll();
});
