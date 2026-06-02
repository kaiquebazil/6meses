// js/languageManager.js
// Gerenciador de Idioma - Controla a troca de idioma e renderização

import { translations, getCurrentLanguage, setLanguage, toggleLanguage } from '../data/i18n.js';
import { dynamicTranslations } from '../data/dynamicTranslations.js';

export class LanguageManager {
  constructor() {
    this.currentLanguage = getCurrentLanguage();
    this.observers = [];
  }

  // Obter tradução
  t(key) {
    // Tenta buscar nas traduções estáticas primeiro
    const staticTranslation = translations[this.currentLanguage]?.[key];
    if (staticTranslation) return staticTranslation;

    // Se não encontrar, tenta buscar nas traduções dinâmicas
    const dynamicTranslation = dynamicTranslations[this.currentLanguage]?.[key];
    if (dynamicTranslation) return dynamicTranslation;

    return key;
  }

  // Alternar idioma
  toggle() {
    this.currentLanguage = toggleLanguage();
    this.notifyObservers();
    return this.currentLanguage;
  }

  // Definir idioma específico
  setLanguage(language) {
    if (language === 'pt' || language === 'en') {
      this.currentLanguage = setLanguage(language);
      this.notifyObservers();
      return this.currentLanguage;
    }
  }

  // Registrar observador para mudanças de idioma
  subscribe(callback) {
    this.observers.push(callback);
  }

  // Notificar todos os observadores
  notifyObservers() {
    this.observers.forEach(callback => callback(this.currentLanguage));
  }

  // Criar botão de troca de idioma
  createLanguageToggleButton() {
    const button = document.createElement('button');
    button.id = 'language-toggle-btn';
    button.className = 'language-toggle-btn';
    button.setAttribute('aria-label', 'Toggle language');
    button.setAttribute('data-lang', this.currentLanguage === 'pt' ? 'EN' : 'PT');
    button.innerHTML = `
      <i class="fas fa-globe"></i>
      <span class="language-label">${this.t('language.toggle')}</span>
    `;
    
    button.addEventListener('click', () => {
      this.toggle();
      this.updateLanguageButtonText();
      // Disparar evento customizado para que o app saiba que o idioma mudou
      window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { language: this.currentLanguage } 
      }));
    });

    return button;
  }

  // Atualizar texto do botão de idioma
  updateLanguageButtonText() {
    const button = document.getElementById('language-toggle-btn');
    if (button) {
      button.setAttribute('data-lang', this.currentLanguage === 'pt' ? 'EN' : 'PT');
      const label = button.querySelector('.language-label');
      if (label) {
        label.textContent = this.t('language.toggle');
      }
    }
  }

  // Traduzir data para o idioma atual
  translateDate(dayName, day, month, year) {
    const dayTranslations = {
      pt: {
        'Sunday': 'Domingo',
        'Monday': 'Segunda-feira',
        'Tuesday': 'Terça-feira',
        'Wednesday': 'Quarta-feira',
        'Thursday': 'Quinta-feira',
        'Friday': 'Sexta-feira',
        'Saturday': 'Sábado'
      },
      en: {
        'Domingo': 'Sunday',
        'Segunda-feira': 'Monday',
        'Terça-feira': 'Tuesday',
        'Quarta-feira': 'Wednesday',
        'Quinta-feira': 'Thursday',
        'Sexta-feira': 'Friday',
        'Sábado': 'Saturday'
      }
    };

    const monthTranslations = {
      pt: {
        'January': 'Janeiro',
        'February': 'Fevereiro',
        'March': 'Março',
        'April': 'Abril',
        'May': 'Maio',
        'June': 'Junho',
        'July': 'Julho',
        'August': 'Agosto',
        'September': 'Setembro',
        'October': 'Outubro',
        'November': 'Novembro',
        'December': 'Dezembro'
      },
      en: {
        'Janeiro': 'January',
        'Fevereiro': 'February',
        'Março': 'March',
        'Abril': 'April',
        'Maio': 'May',
        'Junho': 'June',
        'Julho': 'July',
        'Agosto': 'August',
        'Setembro': 'September',
        'Outubro': 'October',
        'Novembro': 'November',
        'Dezembro': 'December'
      }
    };

    const translatedDay = dayTranslations[this.currentLanguage][dayName] || dayName;
    const translatedMonth = monthTranslations[this.currentLanguage][month] || month;

    return {
      dayName: translatedDay,
      day,
      month: translatedMonth,
      year
    };
  }

  // Atualizar textos estáticos da página
  updateStaticTexts() {
    // Título da app
    const appTitle = document.querySelector('.app-title');
    if (appTitle) {
      appTitle.innerHTML = this.t('app.title').replace(' ', ' <br> ');
    }

    // Títulos de seções
    const progressTitle = document.querySelector('.section-title');
    if (progressTitle) {
      progressTitle.innerHTML = `<i class="fas fa-chart-line"></i> ${this.t('progress.title')}`;
    }

    // Labels de estatísticas
    const statLabels = document.querySelectorAll('.stat-label');
    const labelTexts = [
      this.t('stats.completed'),
      this.t('stats.total'),
      this.t('stats.rate')
    ];
    statLabels.forEach((label, index) => {
      if (labelTexts[index]) label.textContent = labelTexts[index];
    });

    // Botões de filtro
    const filterButtons = document.querySelectorAll('.filter-btn');
    const filterTexts = {
      'all': this.t('controls.all'),
      'completed': this.t('controls.completed'),
      'pending': this.t('controls.pending')
    };
    filterButtons.forEach(btn => {
      const filter = btn.getAttribute('data-filter');
      if (filterTexts[filter]) {
        const icon = btn.querySelector('i');
        btn.innerHTML = `${icon?.outerHTML || ''} ${filterTexts[filter]}`;
      }
    });

    // Botão de reset
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.innerHTML = `<i class="fas fa-redo"></i> ${this.t('controls.reset')}`;
    }

    // Campo de busca
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.placeholder = this.t('search.placeholder');
    }

    // Mensagem de footer
    const footerMessage = document.querySelector('p[style*="margin-top"]');
    if (footerMessage) {
      footerMessage.textContent = this.t('footer.message');
    }

    // Botão de voltar
    const backButton = document.querySelector('.back-button');
    if (backButton) {
      const span = backButton.querySelector('span');
      if (span) span.textContent = this.t('footer.backButton');
    }

    // Doação
    const donationCard = document.querySelector('.donation-card');
    if (donationCard) {
      const h3 = donationCard.querySelector('h3');
      const p = donationCard.querySelector('p');
      const span = donationCard.querySelector('.pix-badge span');
      
      if (h3) h3.textContent = this.t('donation.title');
      if (p) p.textContent = this.t('donation.description');
      if (span) {
        const pixKey = span.querySelector('strong')?.textContent || '52.177.531/0001-58';
        span.innerHTML = `${this.t('donation.pixKey')} <strong>${pixKey}</strong>`;
      }
    }

    // Títulos dos botões flutuantes
    const floatingButtons = document.querySelectorAll('.float-btn');
    const floatingTitles = [
      this.t('footer.scrollTop'),
      this.t('footer.scrollDonation'),
      this.t('footer.whatsapp')
    ];
    floatingButtons.forEach((btn, index) => {
      if (floatingTitles[index]) {
        btn.setAttribute('title', floatingTitles[index]);
      }
    });
  }

  // Atualizar data e hora
  updateDateTime() {
    const now = new Date();
    const days = this.currentLanguage === 'pt' ? [
      "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
      "Quinta-feira", "Sexta-feira", "Sábado"
    ] : [
      "Sunday", "Monday", "Tuesday", "Wednesday",
      "Thursday", "Friday", "Saturday"
    ];
    
    const months = this.currentLanguage === 'pt' ? [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ] : [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();

    const currentDayElement = document.getElementById('currentDay');
    const currentDateElement = document.getElementById('currentDate');

    if (currentDayElement) currentDayElement.textContent = dayName;
    if (currentDateElement) {
      if (this.currentLanguage === 'en') {
        currentDateElement.textContent = `${month} ${day}, ${year}`;
      } else {
        currentDateElement.textContent = `${day} de ${month} de ${year}`;
      }
    }
  }
}

// Instância global do gerenciador de idioma
export const languageManager = new LanguageManager();
