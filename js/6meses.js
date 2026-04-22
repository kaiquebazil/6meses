// js/6meses.js
// Importar dados e funções
import { studyPlan } from "../data/studyPlan.js";
import { resourcesDatabase, defaultResources } from "../data/resources.js";
import { complementaryMaterials } from "../data/complementaryData.js";
import {
  getFormattedDate,
  createVideoCard,
  createMaterialItem,
  calculateProgress,
  calculateMonthProgress,
} from "./utils/helpers.js";

document.addEventListener("DOMContentLoaded", function () {
  // Elementos DOM
  const monthsContainer = document.getElementById("months-container");
  const globalProgress = document.getElementById("global-progress");
  const progressText = document.getElementById("progress-text");
  const contentsCompletedElement =
    document.getElementById("contents-completed");
  const completionRateElement = document.getElementById("completion-rate");
  const totalContentsElement = document.getElementById("total-contents");
  const filterButtons = document.querySelectorAll(".filter-btn[data-filter]");
  const resetButton = document.getElementById("reset-btn");
  const currentDayElement = document.getElementById("currentDay");
  const currentDateElement = document.getElementById("currentDate");

  // Remover o botão e modal de fluência do DOM (já que movemos para conteúdos adicionais)
  const fluencyButtonContainer = document.querySelector(
    ".fluency-button-container"
  );
  const fluencyModal = document.getElementById("fluency-modal");

  if (fluencyButtonContainer) fluencyButtonContainer.remove();
  if (fluencyModal) fluencyModal.remove();

  // Calcular total de conteúdos
  let totalContents = 0;
  studyPlan.forEach((month) => {
    month.weeks.forEach((week) => {
      totalContents += week.contents.length;
    });
  });
  totalContentsElement.textContent = totalContents;

  // Progresso salvo no localStorage
  let completedContents =
    JSON.parse(localStorage.getItem("completedContents")) || [];

  // ========== FUNÇÕES DA SEMANA 0 COM TOGGLE ÚNICO ==========

  // Inicializar progresso da Semana 0
  function initializeWeekZeroProgress() {
    if (!localStorage.getItem('week0Progress')) {
      const initialProgress = {
        completedContents: [],
        startDate: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      };
      localStorage.setItem('week0Progress', JSON.stringify(initialProgress));
    }
  }

  // Função auxiliar para obter ícones
  function getIconForType(type) {
    const icons = {
      tutorial: 'graduation-cap',
      config: 'cog',
      conceptual: 'lightbulb',
      practical: 'hands-helping',
      overview: 'map',
      resources: 'toolbox',
      default: 'file-alt'
    };
    return icons[type] || icons.default;
  }

  // Criar card de conteúdo da Semana 0
  function createWeekZeroContentCard(content) {
    const progress = JSON.parse(localStorage.getItem('week0Progress')) || {
      completedContents: []
    };
    const isCompleted = progress.completedContents?.includes(content.id);
    
    return `
      <div class="week-zero-content-card ${isCompleted ? 'completed' : ''}" id="content-${content.id}">
        <div class="content-card-header" onclick="toggleWeekZeroContent('${content.id}')">
          <div class="content-card-icon">
            <i class="fas fa-${getIconForType(content.type)}"></i>
          </div>
          <div class="content-card-title">
            <h4>${content.title}</h4>
            <p>${content.description}</p>
          </div>
          <div class="content-card-meta">
            <span class="meta-difficulty difficulty-${content.difficulty ? content.difficulty.toLowerCase() : 'fácil'}">
              ${content.difficulty || 'Fácil'}
            </span>
            ${content.duration ? `
              <span class="meta-duration">
                <i class="fas fa-clock"></i> ${content.duration}
              </span>
            ` : ''}
          </div>
          <div class="content-card-toggle">
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>
        
        <div class="content-card-body" id="content-body-${content.id}">
          <div class="old-style-content">
            <!-- VÍDEOS -->
            ${content.videos && content.videos.length > 0 ? `
              <div class="content-card">
                <h3><i class="fas fa-video"></i> Vídeos da Aula</h3>
                <div class="content-videos">
                  ${content.videos.map(video => `
                    <div class="content-video-card" onclick="openVideo('${video.id}')">
                      <img src="https://img.youtube.com/vi/${video.id}/mqdefault.jpg" alt="${video.title}" loading="lazy">
                      <div class="video-info">
                        <h6>${video.title}</h6>
                        <div class="video-meta">
                          <span>${video.channel}</span>
                          <span>• ${video.duration}</span>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            
            <!-- MATERIAIS -->
            ${content.materials && content.materials.length > 0 ? `
              <div class="content-card">
                <h3><i class="fas fa-book"></i> Materiais de Apoio</h3>
                <div class="example-box">
                  <ul class="usage-list">
                    ${content.materials.map(material => {
                      if (material.includes("(link:")) {
                        const linkMatch = material.match(/\((link:[^)]+)\)/);
                        if (linkMatch) {
                          const linkText = linkMatch[0].replace("(link:", "").replace(")", "");
                          const displayText = material.replace(linkMatch[0], "").trim();
                          return `<li>${displayText} <a href="${linkText}" target="_blank" class="highlight">Acessar</a></li>`;
                        }
                      }
                      return `<li>${material}</li>`;
                    }).join('')}
                  </ul>
                </div>
              </div>
            ` : ''}
            
            <!-- APRENDIZAGEM -->
            ${content.learning && content.learning.length > 0 ? `
              <div class="content-card">
                <h3><i class="fas fa-graduation-cap"></i> O que você vai aprender</h3>
                <div class="important-note">
                  <ul class="usage-list">
                    ${content.learning.map(step => `<li>${step}</li>`).join('')}
                  </ul>
                </div>
              </div>
            ` : ''}
            
            <!-- BOTÃO DE CONCLUSÃO -->
            <button class="complete-content-btn ${isCompleted ? 'completed' : ''}" 
                    onclick="completeWeekZeroContent('${content.id}')">
              <i class="fas ${isCompleted ? 'fa-check-double' : 'fa-check'}"></i>
              <span>${isCompleted ? 'Concluído!' : 'Marcar como Concluído'}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Renderizar a Semana 0 com toggle único
  function renderWeekZeroSimple(data) {
    const progress = JSON.parse(localStorage.getItem('week0Progress')) || { 
      completedContents: []
    };
    
    const totalContents = data.contents?.length || 0;
    const completedCount = data.contents?.filter(content => 
      progress.completedContents?.includes(content.id)
    ).length || 0;
    
    return `
      <div class="timeline-item week-zero-item" id="week-zero-timeline">
        <div class="week-zero-header">
          <div style="flex: 1;">
            <h3 class="week-zero-title">
              <i class="fas fa-${data.icon || 'tools'}"></i> ${data.title}
            </h3>
          </div>
          <button class="toggle-week-btn" id="toggle-week-zero-btn">
            <i class="fas fa-chevron-down"></i>
          </button>
        </div>
        
        <div class="week-zero-content" id="week-zero-content">
          <div class="week-zero-section" style="padding: 10px;">
            <!-- GRADE DE CONTEÚDOS -->
            <div class="section-contents-grid">
              ${data.contents && data.contents.length > 0 
                ? data.contents.map(content => createWeekZeroContentCard(content)).join('')
                : '<p class="no-content">Nenhum conteúdo disponível</p>'
              }
            </div>
            
            <!-- DICAS -->
            ${data.tips && data.tips.length > 0 ? `
              <div class="week-zero-tips">
                <div class="tips-header">
                  <i class="fas fa-lightbulb"></i>
                  <h4>Dicas para Configuração</h4>
                </div>
                <div class="tips-list-timeline">
                  ${data.tips.map(tip => `
                    <div class="tip-item-timeline">
                      <i class="fas fa-check"></i>
                      <span>${tip}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // Renderizar a Semana 0 como primeiro item (Desativado - Movido para Mês 0)
  function renderWeekZeroFirst() {
    // Conteúdo movido para o Mês 0 no studyPlan.js
    return;
  }

  // Funções globais da Semana 0
  window.toggleWeekZeroContent = function(contentId) {
    const contentBody = document.getElementById(`content-body-${contentId}`);
    const toggleIcon = document.querySelector(`#content-${contentId} .content-card-toggle i`);
    
    if (contentBody && toggleIcon) {
      const isOpening = !contentBody.classList.contains('active');
      const isDesktop = window.innerWidth > 768;
      
      if (isOpening) {
        // Se for desktop, fechar todos os outros conteúdos da Semana 0
        if (isDesktop) {
          const allBodies = document.querySelectorAll('.week-zero-content-card .content-card-body');
          const allIcons = document.querySelectorAll('.week-zero-content-card .content-card-toggle i');
          
          allBodies.forEach(body => body.classList.remove('active'));
          allIcons.forEach(icon => icon.className = 'fas fa-chevron-down');
        }
        
        // Abrir o atual
        contentBody.classList.add('active');
        toggleIcon.className = 'fas fa-chevron-up';
      } else {
        // Fechar o atual
        contentBody.classList.remove('active');
        toggleIcon.className = 'fas fa-chevron-down';
      }
    }
  };

  window.completeWeekZeroContent = function(contentId) {
    let progress = JSON.parse(localStorage.getItem('week0Progress')) || {
      completedContents: []
    };
    
    if (!progress.completedContents.includes(contentId)) {
      progress.completedContents.push(contentId);
      localStorage.setItem('week0Progress', JSON.stringify(progress));
      
      // Atualizar interface
      const contentCard = document.getElementById(`content-${contentId}`);
      if (contentCard) {
        contentCard.classList.add('completed');
        
        const completeBtn = contentCard.querySelector('.complete-content-btn');
        if (completeBtn) {
          completeBtn.innerHTML = '<i class="fas fa-check-double"></i><span>Concluído!</span>';
          completeBtn.classList.add('completed');
        }
      }
      
      // Atualizar badge de progresso
      updateWeekZeroProgressBadge();
      
      showCompletionToast('Conteúdo concluído!');
    }
  };

  function updateWeekZeroProgressBadge() {
    // Desativado - Conteúdo movido para Mês 0
    return;
  }

  window.toggleWeekZeroContentGlobal = function() {
    const content = document.getElementById('week-zero-content');
    const button = document.getElementById('toggle-week-zero-btn');
    
    if (content && button) {
      content.classList.toggle('active');
      button.classList.toggle('active');
    }
  };

  window.openVideo = function(videoId) {
    window.open(`https://youtube.com/watch?v=${videoId}`, '_blank');
  };

  function showCompletionToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, var(--accent-green), #2ecc71);
      color: white;
      padding: 15px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(59, 185, 80, 0.3);
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 1000;
      animation: slideInUp 0.3s ease;
      max-width: 300px;
    `;
    
    toast.innerHTML = `
      <i class="fas fa-check-circle" style="font-size: 20px;"></i>
      <div>
        <strong style="display: block; font-size: 14px;">Ótimo!</strong>
        <span style="font-size: 13px;">${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideInUp 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function checkCompletedWeekZeroContents() {
    const progress = JSON.parse(localStorage.getItem('week0Progress')) || {
      completedContents: []
    };
    
    progress.completedContents.forEach(contentId => {
      const contentCard = document.getElementById(`content-${contentId}`);
      if (contentCard) {
        contentCard.classList.add('completed');
        const completeBtn = contentCard.querySelector('.complete-content-btn');
        if (completeBtn) {
          completeBtn.innerHTML = '<i class="fas fa-check-double"></i><span>Concluído!</span>';
          completeBtn.classList.add('completed');
        }
      }
    });
  }

  // Atualizar data e dia
  function updateDateTime() {
    const { dayName, day, month, year } = getFormattedDate();
    currentDayElement.textContent = dayName;
    currentDateElement.textContent = `${day} de ${month} de ${year}`;
  }

  // ========== SISTEMA DE TOGGLE ÚNICO PARA CONTEÚDOS ADICIONAIS ==========
  let currentlyOpenCard = null;

  function closeAllCards() {
    const allCards = document.querySelectorAll(".complementary-card-content");
    const allToggles = document.querySelectorAll(".complementary-card-toggle");

    allCards.forEach((card) => {
      card.style.maxHeight = "0px";
    });

    allToggles.forEach((toggle) => {
      toggle.classList.remove("expanded");
      const icon = toggle.querySelector("i");
      if (icon) icon.style.transform = "rotate(0deg)";
    });

    currentlyOpenCard = null;
  }

  function toggleCard(cardId, cardContent, toggleButton) {
    const icon = toggleButton.querySelector("i");

    if (currentlyOpenCard === cardId) {
      // Fechar este card
      cardContent.style.maxHeight = "0px";
      toggleButton.classList.remove("expanded");
      icon.style.transform = "rotate(0deg)";
      currentlyOpenCard = null;
    } else {
      // Fechar todos e abrir este
      closeAllCards();

      cardContent.style.maxHeight = cardContent.scrollHeight + "px";
      toggleButton.classList.add("expanded");
      icon.style.transform = "rotate(180deg)";
      currentlyOpenCard = cardId;
    }
  }

  // Renderizar Conteúdos Adicionais
  function renderComplementaryMaterials() {
    // Filtrar para não incluir a Semana 0 nos conteúdos adicionais
    const otherMaterials = complementaryMaterials;
    
    if (otherMaterials.length === 0) return;

    // Criar container principal
    const complementaryContainer = document.createElement("div");
    complementaryContainer.className = "complementary-container";
    complementaryContainer.innerHTML = `
    <div class="complementary-header">
      <div class="complementary-title">
        <i class="fas fa-plus-circle"></i>
        <span>📚 Conteúdos Adicionais - Fluência em 6 Meses</span>
      </div>
      <button class="complementary-toggle" id="complementary-toggle">
        <i class="fas fa-chevron-down"></i>
      </button>
    </div>
    <div class="complementary-content" id="complementary-content">
      <!-- Conteúdo será inserido aqui -->
    </div>
  `;

    // Inserir depois da Semana 0 e antes dos meses
    const weekZeroElement = document.querySelector('.week-zero-first-section');
    if (weekZeroElement) {
      weekZeroElement.parentNode.insertBefore(complementaryContainer, weekZeroElement.nextSibling);
    } else {
      monthsContainer.parentNode.insertBefore(complementaryContainer, monthsContainer);
    }

    // Referências aos elementos
    const complementaryContent = document.getElementById(
      "complementary-content"
    );
    const complementaryToggle = document.getElementById("complementary-toggle");

    // Renderizar os cards de materiais
    const materialsGrid = document.createElement("div");
    materialsGrid.className = "complementary-grid";

    otherMaterials.forEach((material) => {
      const materialCard = document.createElement("div");
      materialCard.className = "complementary-card";

      // Criar conteúdo interno do card
      const cardContent = document.createElement("div");
      cardContent.className = "complementary-card-content";
      cardContent.style.maxHeight = "0px";
      cardContent.style.overflow = "hidden";
      cardContent.style.transition = "max-height 0.3s ease-out";
      cardContent.id = `card-content-${material.id}`;

      // Header do card com toggle individual
      const cardHeader = document.createElement("div");
      cardHeader.className = "complementary-card-header";
      cardHeader.innerHTML = `
      <div class="complementary-card-title">
        <h3>${material.title}</h3>
        <p class="complementary-card-desc">${material.description}</p>
      </div>
      <button class="complementary-card-toggle" data-target="${material.id}">
        <i class="fas fa-chevron-down"></i>
      </button>
    `;

      // Conteúdo específico baseado no tipo
      let cardBodyHTML = "";

      if (material.type === "videos") {
        // Card de vídeos (com conteúdos adicionais)
        const videosContent =
          material.videos && material.videos.length > 0
            ? material.videos
                .map((video) => {
                  let videoHTML = `
              <div class="complementary-video-item">
                <a href="https://www.youtube.com/watch?v=${video.id}" target="_blank" class="complementary-video-card">
                  <div class="complementary-video-icon">
                    <i class="fas fa-play-circle"></i>
                  </div>
                  <div class="complementary-video-info">
                    <div class="complementary-video-title">${video.title}</div>
                    <div class="complementary-video-details">
                      <span><i class="fas fa-clock"></i> ${video.duration}</span>
                      <span>${video.channel}</span>
                    </div>
                    <div class="complementary-video-desc">${video.description}</div>
                  </div>
                </a>
            `;

                  // Conteúdo adicional do vídeo
                  if (video.additionalContent) {
                    videoHTML += `
                <div class="video-additional-toggle">
                  <button class="video-additional-btn" data-video="${video.id}">
                    <i class="fas fa-plus-circle"></i>
                    <span>Conteúdo Adicional</span>
                  </button>
                </div>
                
                <div class="video-additional-content" id="additional-${
                  video.id
                }">
                  <div class="video-additional-section">
                    <div class="complementary-section-title">
                      <i class="fas fa-book"></i>
                      <span>Materiais Complementares</span>
                    </div>
                    <ul class="complementary-materials-list">
                      ${video.additionalContent.materials
                        .map((item) => {
                          if (item.includes("(link:")) {
                            const linkMatch = item.match(/\((link:[^)]+)\)/);
                            if (linkMatch) {
                              const linkText = linkMatch[0]
                                .replace("(link:", "")
                                .replace(")", "");
                              const displayText = item
                                .replace(linkMatch[0], "")
                                .trim();
                              return `<li>${displayText} <a href="${linkText}" target="_blank" class="material-link"><i class="fas fa-external-link-alt"></i></a></li>`;
                            }
                          }
                          return `<li>${item}</li>`;
                        })
                        .join("")}
                    </ul>
                  </div>
                  
                  <div class="video-additional-section">
                    <div class="complementary-section-title">
                      <i class="fas fa-lightbulb"></i>
                      <span>Dicas de Estudo</span>
                    </div>
                    <ul class="complementary-list">
                      ${video.additionalContent.tips
                        .map((tip) => `<li>${tip}</li>`)
                        .join("")}
                    </ul>
                  </div>
                </div>
              `;
                  }

                  videoHTML += `</div>`;
                  return videoHTML;
                })
                .join("")
            : '<p style="text-align: center; color: var(--text-secondary); padding: 10px;">Sem vídeos disponíveis no momento</p>';

        const materialsContent =
          material.materials && material.materials.length > 0
            ? `
          <div class="complementary-section">
            <div class="complementary-section-title">
              <i class="fas fa-book"></i>
              <span>Materiais Gerais</span>
            </div>
            <ul class="complementary-materials-list">
              ${material.materials
                .map((item) => {
                  if (item.includes("(link:")) {
                    const linkMatch = item.match(/\((link:[^)]+)\)/);
                    if (linkMatch) {
                      const linkText = linkMatch[0]
                        .replace("(link:", "")
                        .replace(")", "");
                      const displayText = item.replace(linkMatch[0], "").trim();
                      return `<li>${displayText} <a href="${linkText}" target="_blank" class="material-link"><i class="fas fa-external-link-alt"></i></a></li>`;
                    }
                  }
                  return `<li>${item}</li>`;
                })
                .join("")}
            </ul>
          </div>
        `
            : "";

        cardBodyHTML = `
        <div class="complementary-card-body">
          <div class="complementary-videos">
            <div class="complementary-section">
              <div class="complementary-section-title">
                <i class="fas fa-video"></i>
                <span>Vídeos Recomendados</span>
              </div>
              <div class="complementary-videos-grid">
                ${videosContent}
              </div>
            </div>
            ${materialsContent}
          </div>
        </div>
      `;
      } else if (material.type === "rules") {
        // Card de regras de fluência
        cardBodyHTML = `
        <div class="complementary-card-body">
          <div class="rules-grid">
            ${material.rules
              .map(
                (rule) => `
              <div class="rule-card-small">
                <div class="rule-icon-small">
                  <i class="fas fa-${rule.icon}"></i>
                </div>
                <h4>${rule.title}</h4>
                <p>${rule.description}</p>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
      } else if (material.type === "grammar-videos") {
        // Card de vídeos de gramática
        cardBodyHTML = `
    <div class="complementary-card-body">
      <div class="grammar-videos-container">
        
        <!-- Introdução -->
        <div class="grammar-intro">
          <p><strong>Minha filosofia:</strong> Gramática deve ser aprendida em contexto, não em listas de regras. 
          Estes vídeos focam na <em>aplicação prática</em> para comunicação real.</p>
        </div>
        
        <!-- Playlists organizadas -->
        <div class="complementary-section">
          <div class="complementary-section-title">
            <i class="fas fa-list-ol"></i>
            <span>Playlists Organizadas</span>
          </div>
          
          <div class="playlists-grid">
            ${material.playlists
              .map(
                (playlist) => `
              <div class="playlist-card">
                <div class="playlist-header">
                  <div class="playlist-icon">
                    <i class="fas fa-play-circle"></i>
                  </div>
                  <div class="playlist-info">
                    <h4>${playlist.name}</h4>
                    <p class="playlist-creator">
                      <i class="fas fa-user"></i> ${playlist.creator}
                    </p>
                    <p class="playlist-desc">${playlist.description}</p>
                  </div>
                </div>
                
                <div class="playlist-videos">
                  <h5>Vídeos desta playlist:</h5>
                  ${playlist.videos
                    .map(
                      (video) => `
                    <div class="playlist-video-item">
                      <a href="https://www.youtube.com/watch?v=${
                        video.id
                      }" target="_blank" class="video-link">
                        <div class="video-thumb">
                          <img src="https://img.youtube.com/vi/${
                            video.id
                          }/hqdefault.jpg" alt="${video.title}">
                          <div class="video-overlay">
                            <i class="fas fa-play"></i>
                            <span class="duration">${video.duration}</span>
                          </div>
                        </div>
                        <div class="video-details">
                          <h6>${video.title}</h6>
                          <div class="video-meta">
                            <span class="difficulty difficulty-${video.difficulty.toLowerCase()}">
                              ${video.difficulty}
                            </span>
                            <div class="video-tags">
                              ${video.tags
                                .map((tag) => `<span class="tag">${tag}</span>`)
                                .join("")}
                            </div>
                          </div>
                          <p class="video-description">${video.description}</p>
                        </div>
                      </a>
                    </div>
                  `
                    )
                    .join("")}
                </div>
                
                <div class="playlist-actions">
                  <a href="${
                    playlist.link
                  }" target="_blank" class="playlist-link-btn">
                    <i class="fab fa-youtube"></i> Ver playlist completa
                  </a>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        
        <!-- Vídeos individuais recomendados -->
        <div class="complementary-section">
          <div class="complementary-section-title">
            <i class="fas fa-star"></i>
            <span>Vídeos Específicos que Recomendo</span>
          </div>
          
          <div class="individual-videos-grid">
            ${material.individualVideos
              .map(
                (video) => `
              <div class="individual-video-card">
                <div class="video-main">
                  <div class="video-thumb-large">
                    <img src="https://img.youtube.com/vi/${
                      video.id
                    }/hqdefault.jpg" alt="${video.title}">
                    <div class="video-overlay-large">
                      <i class="fas fa-play"></i>
                    </div>
                    <div class="video-duration-large">${video.duration}</div>
                  </div>
                  
                  <div class="video-content">
                    <h4>${video.title}</h4>
                    <p class="video-creator">
                      <i class="fas fa-user"></i> ${video.creator}
                    </p>
                    <p class="video-description-large">${video.description}</p>
                    
                    ${
                      video.whyRecommend
                        ? `
                      <div class="why-recommend">
                        <strong><i class="fas fa-thumbs-up"></i> Por que recomendo:</strong>
                        <p>${video.whyRecommend}</p>
                      </div>
                    `
                        : ""
                    }
                    
                    <div class="video-meta-large">
                      <span class="difficulty difficulty-${
                        video.difficulty
                          ? video.difficulty.toLowerCase().split(" ")[0]
                          : "intermediate"
                      }">
                        ${video.difficulty || "Intermediário"}
                      </span>
                      <div class="video-tags-large">
                        ${
                          video.tags
                            ? video.tags
                                .map((tag) => `<span class="tag">${tag}</span>`)
                                .join("")
                            : ""
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="video-actions">
                  <a href="https://www.youtube.com/watch?v=${
                    video.id
                  }" target="_blank" class="watch-btn">
                    <i class="fab fa-youtube"></i> Assistir no YouTube
                  </a>
                  <button class="save-btn" data-video-id="${video.id}">
                    <i class="far fa-bookmark"></i> Salvar para depois
                  </button>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        
        <!-- Níveis de recomendação -->
        <div class="complementary-section">
          <div class="complementary-section-title">
            <i class="fas fa-chart-bar"></i>
            <span>Recomendação por Nível</span>
          </div>
          
          <div class="recommendation-levels">
            ${Object.entries(material.recommendationLevels)
              .map(
                ([level, items]) => `
              <div class="level-card level-${level}">
                <h4>
                  <i class="fas fa-${
                    level === "beginner"
                      ? "seedling"
                      : level === "intermediate"
                      ? "leaf"
                      : "tree"
                  }"></i>
                  Para ${
                    level === "beginner"
                      ? "Iniciantes"
                      : level === "intermediate"
                      ? "Intermediários"
                      : "Avançados"
                  }
                </h4>
                <ul>
                  ${items.map((item) => `<li>${item}</li>`).join("")}
                </ul>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        
        <!-- Dicas de estudo -->
        <div class="complementary-section">
          <div class="complementary-section-title">
            <i class="fas fa-lightbulb"></i>
            <span>Como Estudar com Estes Vídeos</span>
          </div>
          
          <div class="study-tips">
            <div class="tips-steps">
              ${material.studyTips
                .map(
                  (tip, index) => `
                <div class="tip-step">
                  <div class="step-number">${index + 1}</div>
                  <div class="step-content">${tip}</div>
                </div>
              `
                )
                .join("")}
            </div>
            
            <div class="pro-tip">
              <strong><i class="fas fa-gem"></i> Dica Pro:</strong>
              Grave você mesmo explicando o conceito após assistir. Ensine para consolidar!
            </div>
          </div>
        </div>
        
      </div>
    </div>
  `;
      } else if (material.type === "timeline") {
        // Card de timeline/roadmap
        cardBodyHTML = `
        <div class="complementary-card-body">
          <div class="complementary-section">
            <div class="complementary-section-title">
              <i class="fas fa-road"></i>
              <span>Roadmap de 6 Meses</span>
            </div>
            <div class="timeline-container">
              ${material.months
                .map(
                  (month) => `
                <div class="timeline-month">
                  <div class="timeline-month-header">
                    <h4>${month.month}</h4>
                    <span class="timeline-theme">${month.theme}</span>
                  </div>
                  <div class="timeline-month-content">
                    <p><strong>Meta:</strong> ${month.goal}</p>
                    <p><strong>Foco:</strong> ${month.focus}</p>
                    <p><strong>Marcador:</strong> ${month.marker}</p>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        </div>
      `;
      } else if (material.type === "tools") {
        // Card de ferramentas e recursos
        cardBodyHTML = `
    <div class="complementary-card-body">
      <div class="complementary-section">
        <div class="complementary-section-title">
          <i class="fas fa-tools"></i>
          <span>Recursos & Ferramentas</span>
        </div>
        
        <div class="tools-intro">
          <p>Aqui estão os recursos que uso pessoalmente e recomendo para acelerar seu aprendizado. 
          Todos foram testados e aprovados!</p>
        </div>
        
        ${material.categories
          .map(
            (category) => `
          <div class="tools-category">
            <h4 class="tools-category-title">
              <i class="fas fa-${category.icon || "folder"}"></i>
              ${category.name}
            </h4>
            <div class="tools-items-grid">
              ${category.items
                .map(
                  (item) => `
                <div class="tool-item">
                  <div class="tool-header">
                    <div class="tool-icon">
                      <i class="fas fa-${item.icon || "link"}"></i>
                    </div>
                    <div class="tool-info">
                      <h5>${item.name}</h5>
                      <p class="tool-desc">${item.description}</p>
                    </div>
                  </div>
                  
                  <div class="tool-content">
                    ${
                      item.myReview
                        ? `
                      <div class="tool-review">
                        <strong><i class="fas fa-star"></i> Minha avaliação:</strong>
                        <p>${item.myReview}</p>
                      </div>
                    `
                        : ""
                    }
                    
                    <div class="tool-actions">
                      <a href="${item.link}" target="_blank" class="tool-link">
                        <i class="fas fa-external-link-alt"></i> Acessar
                      </a>
                      ${
                        item.isFree
                          ? '<span class="tool-badge free">Gratuito</span>'
                          : ""
                      }
                      ${
                        item.isPaid
                          ? '<span class="tool-badge paid">Premium</span>'
                          : ""
                      }
                    </div>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
          )
          .join("")}
        
        ${
          material.tips && material.tips.length > 0
            ? `
          <div class="tools-tips">
            <h4 class="tools-tips-title">
              <i class="fas fa-lightbulb"></i>
              Dicas de Uso
            </h4>
            <ul class="tools-tips-list">
              ${material.tips.map((tip) => `<li>${tip}</li>`).join("")}
            </ul>
          </div>
        `
            : ""
        }
      </div>
    </div>
  `;
      } else if (material.type === "podcasts") {
        // Card de podcasts
        cardBodyHTML = `
    <div class="complementary-card-body">
      <div class="podcasts-container">
        
        <!-- Header com filtros -->
        <div class="podcasts-header">
          <div class="podcasts-intro">
            <h4><i class="fas fa-podcast"></i> Guia de Podcasts por Nível</h4>
            <p>Selecione podcasts baseado no seu nível atual. A recomendação é ouvir <strong>30-60 minutos por dia</strong> para imersão auditiva eficiente.</p>
          </div>
          
          <div class="podcasts-filters">
            <div class="filter-buttons">
              ${material.filters
                .map(
                  (filter) => `
                <button class="podcast-filter-btn ${
                  filter.id === "all" ? "active" : ""
                }" 
                        data-filter="${filter.id}">
                  <i class="fas fa-${filter.icon}"></i>
                  ${filter.name}
                </button>
              `
                )
                .join("")}
            </div>
            
            <div class="stats-info">
              <span class="stat">
                <i class="fas fa-headphones"></i>
                <strong>${material.levels.reduce(
                  (total, level) => total + level.items.length,
                  0
                )}</strong> podcasts
              </span>
              <span class="stat">
                <i class="fas fa-layer-group"></i>
                <strong>${material.levels.length}</strong> níveis
              </span>
            </div>
          </div>
        </div>
        
        <!-- Níveis de podcasts -->
        <div class="podcasts-levels">
          ${material.levels
            .map(
              (level, levelIndex) => `
            <div class="podcast-level-card level-${level.color} ${
                levelIndex === 0 ? "active" : ""
              }" 
                 data-level="${
                   level.name.toLowerCase().includes("beginner")
                     ? "beginner"
                     : level.name.toLowerCase().includes("basic")
                     ? "basic"
                     : level.name.toLowerCase().includes("intermediate")
                     ? "intermediate"
                     : "advanced"
                 }">
              
              <div class="level-header">
                <div class="level-title">
                  <h4>${level.name}</h4>
                  <p class="level-desc">${level.description}</p>
                </div>
                <div class="level-badge">
                  <span class="badge-count">${
                    level.items.length
                  } podcasts</span>
                  <i class="fas fa-chevron-down"></i>
                </div>
              </div>
              
              <div class="level-content" style="max-height: ${
                levelIndex === 0 ? "1000px" : "0px"
              };">
                <div class="podcast-grid">
                  ${level.items
                    .map(
                      (podcast, podcastIndex) => `
                    <div class="podcast-item" data-index="${podcastIndex}">
                      <div class="podcast-card">
                        <div class="podcast-icon">
                          <i class="fas fa-${podcast.icon}"></i>
                        </div>
                        
                        <div class="podcast-info">
                          <h5>${podcast.name}</h5>
                          <p class="podcast-desc">${podcast.description}</p>
                          
                          <div class="podcast-meta">
                            <span class="platform-badge">
                              <i class="fas fa-${
                                podcast.platform === "YouTube"
                                  ? "youtube"
                                  : podcast.platform === "Spotify"
                                  ? "spotify"
                                  : podcast.platform === "Apple Podcasts"
                                  ? "podcast"
                                  : "globe"
                              }"></i>
                              ${podcast.platform}
                            </span>
                            <span class="frequency-badge">
                              <i class="fas fa-calendar-alt"></i>
                              ${podcast.frequency}
                            </span>
                            ${
                              podcast.bestFor
                                ? `
                              <span class="bestfor-badge">
                                <i class="fas fa-bullseye"></i>
                                ${podcast.bestFor}
                              </span>
                            `
                                : ""
                            }
                          </div>
                        </div>
                        
                        <div class="podcast-actions">
                          <button class="save-podcast-btn" data-podcast="${podcast.name
                            .replace(/\s+/g, "-")
                            .toLowerCase()}">
                            <i class="far fa-bookmark"></i>
                          </button>
                          <button class="play-podcast-btn" data-platform="${
                            podcast.platform
                          }" 
                                  data-search="${encodeURIComponent(
                                    podcast.name
                                  )}">
                            <i class="fas fa-play"></i> Ouvir
                          </button>
                        </div>
                      </div>
                      
                      <!-- Detalhes expandidos -->
                      <div class="podcast-details">
                        <div class="details-content">
                          <div class="study-plan">
                            <h6><i class="fas fa-graduation-cap"></i> Plano de Estudo Sugerido</h6>
                            <ul>
                              <li><strong>Frequência:</strong> ${
                                podcast.frequency
                              }</li>
                              <li><strong>Duração por sessão:</strong> ${
                                level.color === "green"
                                  ? "15-20 minutos"
                                  : level.color === "blue"
                                  ? "20-30 minutos"
                                  : level.color === "yellow"
                                  ? "30-45 minutos"
                                  : "45-60 minutos"
                              }</li>
                              <li><strong>Foco principal:</strong> ${
                                podcast.description.split(".")[0]
                              }</li>
                              ${
                                podcast.bestFor
                                  ? `<li><strong>Melhor para:</strong> ${podcast.bestFor}</li>`
                                  : ""
                              }
                            </ul>
                          </div>
                          
                          <div class="tips-section">
                            <h6><i class="fas fa-lightbulb"></i> Dicas para este podcast</h6>
                            <ul>
                              ${
                                level.color === "green"
                                  ? `<li>Ouça em velocidade reduzida (0.75x) nas primeiras semanas</li>
                                 <li>Repita as frases em voz alta após o apresentador</li>
                                 <li>Foque em entender o contexto geral, não cada palavra</li>`
                                  : level.color === "blue"
                                  ? `<li>Ouça uma vez sem pausar, depois ouça novamente com pausas</li>
                                 <li>Anote 3-5 palavras novas por episódio</li>
                                 <li>Tente resumir o episódio em 2-3 frases</li>`
                                  : level.color === "yellow"
                                  ? `<li>Ouça sem legendas/transcrições primeiro</li>
                                 <li>Foque na entonação e expressões idiomáticas</li>
                                 <li>Discuta o conteúdo com um parceiro de estudo</li>`
                                  : `<li>Ouça como entretenimento, não como "estudo"</li>
                                 <li>Pesquise contextos culturais que não entender</li>
                                 <li>Experimente fazer outras atividades enquanto ouve</li>`
                              }
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
        
        <!-- Dicas gerais -->
        <div class="podcasts-tips-section">
          <div class="tips-header">
            <h4><i class="fas fa-gem"></i> Estratégias de Escuta Eficiente</h4>
          </div>
          
          <div class="tips-grid">
            ${material.tips
              .map(
                (tip, index) => `
              <div class="tip-card">
                <div class="tip-number">${index + 1}</div>
                <div class="tip-content">
                  <p>${tip}</p>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
          
          <div class="pro-tip-podcast">
            <i class="fas fa-rocket"></i>
            <strong>Dica Pro:</strong> Crie uma playlist semanal com podcasts de diferentes níveis para exposição variada.
          </div>
        </div>
        
        <!-- Plataformas -->
        <div class="platforms-section">
          <h4><i class="fas fa-mobile-alt"></i> Plataformas Recomendadas</h4>
          <div class="platforms-grid">
            ${Object.entries(material.platforms)
              .map(
                ([name, url]) => `
              <a href="${url}" target="_blank" class="platform-card">
                <div class="platform-icon">
                  <i class="fab fa-${
                    name === "Spotify"
                      ? "spotify"
                      : name === "YouTube"
                      ? "youtube"
                      : name === "Apple Podcasts"
                      ? "apple"
                      : "chrome"
                  }"></i>
                </div>
                <div class="platform-info">
                  <h5>${name}</h5>
                  <p>Clique para acessar</p>
                </div>
              </a>
            `
              )
              .join("")}
          </div>
        </div>
        
      </div>
    </div>
  `;
      } else if (material.type === "assessment") {
        cardBodyHTML = `
        <div class="complementary-card-body">
          <div class="assessment-container">
            <!-- Introdução -->
            <div class="assessment-intro">
              <h4><i class="fas fa-chart-line"></i> Comece pelo Nível Certo</h4>
              <p>Antes de começar seu estudo, é essencial saber <strong>exatamente onde você está</strong> e <strong>quais palavras priorizar</strong> para ter o máximo de progresso no menor tempo.</p>
            </div>
            
            <!-- Testes de Nivelamento -->
            <div class="complementary-section">
              <div class="complementary-section-title">
                <i class="fas fa-clipboard-check"></i>
                <span>Testes de Nivelamento</span>
              </div>
              
              <div class="tests-grid">
                ${material.sections[0].items
                  .map(
                    (test, index) => `
                  <div class="test-card">
                    <div class="test-icon">
                      <i class="fas fa-${test.icon}"></i>
                    </div>
                    <div class="test-content">
                      <h5>${test.name}</h5>
                      <p class="test-desc">${test.description}</p>
                      <div class="test-meta">
                        <span class="duration-badge">
                          <i class="fas fa-clock"></i> ${test.duration}
                        </span>
                        <span class="bestfor-badge">
                          <i class="fas fa-bullseye"></i> ${test.bestFor}
                        </span>
                      </div>
                    </div>
                    <div class="test-action">
                      <a href="${test.link}" target="_blank" class="test-btn">
                        <i class="fas fa-external-link-alt"></i> Fazer Teste
                      </a>
                    </div>
                  </div>
                `
                  )
                  .join("")}
              </div>
              
              <div class="test-tips">
                <p><i class="fas fa-lightbulb"></i> <strong>Dica:</strong> Faça 2 testes diferentes para ter uma média precisa do seu nível.</p>
              </div>
            </div>
            
            <!-- Níveis de Proficiência -->
            <div class="complementary-section">
              <div class="complementary-section-title">
                <i class="fas fa-layer-group"></i>
                <span>Entenda Seus Resultados</span>
              </div>
              
              <div class="levels-grid">
                ${material.sections[1].levels
                  .map(
                    (level) => `
                  <div class="level-card-assessment">
                    <div class="level-header-assessment">
                      <h5>${level.level}</h5>
                      <span class="words-count">${level.words}</span>
                    </div>
                    <div class="level-body-assessment">
                      <p><strong>Consegue:</strong> ${level.description}</p>
                      <p><strong>Ação Recomendada:</strong> ${level.action}</p>
                    </div>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
            
            <!-- Vocabulário de Alta Frequência -->
            <div class="complementary-section">
              <div class="complementary-section-title">
                <i class="fas fa-star"></i>
                <span>Vocabulário de Alta Frequência</span>
              </div>
              
              <div class="vocab-intro">
                <p>Estas palavras cobrem <strong>80% das conversas diárias</strong>. Aprenda-as primeiro para maior retorno sobre investimento de tempo.</p>
              </div>
              
              <div class="vocab-lists">
                ${material.sections[2].wordLists
                  .map(
                    (list) => `
                  <div class="vocab-list-card">
                    <div class="vocab-list-header">
                      <h5>${list.name}</h5>
                      <p class="vocab-list-desc">${list.description}</p>
                    </div>
                    <div class="vocab-words">
                      ${list.words
                        .map(
                          (word, idx) => `
                        <span class="vocab-word">${word}</span>
                      `
                        )
                        .join("")}
                    </div>
                    <div class="vocab-tip">
                      <i class="fas fa-lightbulb"></i> ${list.tip}
                    </div>
                  </div>
                `
                  )
                  .join("")}
              </div>
              
              <div class="study-tips-section">
                <h5><i class="fas fa-graduation-cap"></i> Dicas de Estudo</h5>
                <ul class="vocab-study-tips">
                  ${material.sections[2].studyTips
                    .map((tip) => `<li>${tip}</li>`)
                    .join("")}
                </ul>
              </div>
            </div>
            
            <!-- Métodos de Prática -->
            <div class="complementary-section">
              <div class="complementary-section-title">
                <i class="fas fa-gamepad"></i>
                <span>Como Praticar Este Vocabulário</span>
              </div>
              
              <div class="methods-grid">
                ${material.sections[3].methods
                  .map(
                    (method) => `
                  <div class="method-card">
                    <div class="method-header">
                      <h5>${method.name}</h5>
                      <p>${method.description}</p>
                    </div>
                    <div class="method-steps">
                      <h6>Passos:</h6>
                      <ol>
                        ${method.steps
                          .map((step) => `<li>${step}</li>`)
                          .join("")}
                      </ol>
                    </div>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
            
            <!-- Dicas Finais -->
            <div class="assessment-footer">
              <div class="final-tips">
                <h5><i class="fas fa-gem"></i> Dicas Importantes</h5>
                <ul>
                  ${material.tips.map((tip) => `<li>${tip}</li>`).join("")}
                </ul>
              </div>
              
              <div class="next-steps">
                <h5><i class="fas fa-arrow-right"></i> Próximos Passos</h5>
                <p>Após fazer o teste e aprender as palavras básicas:</p>
                <ol>
                  <li>Volte ao seu nível no plano de estudos</li>
                  <li>Configure seu ambiente de estudo (Semana 0)</li>
                  <li>Comece com 30 minutos diários de prática</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      `;
      } else if (material.type === "simple-links") {
        cardBodyHTML = `
        <div class="complementary-card-body">
          <div class="simple-links-container">
            ${Object.entries(material.links)
              .map(
                ([category, links]) => `
              <div class="links-category">
                <h4>${category}</h4>
                <div class="links-list">
                  ${links
                    .map(
                      (link) => `
                    <a href="${link.url}" target="_blank" class="simple-link">
                      <div class="link-content">
                        <span class="link-name">${link.name}</span>
                        <span class="link-desc">${link.description}</span>
                      </div>
                      <i class="fas fa-external-link-alt"></i>
                    </a>
                  `
                    )
                    .join("")}
                </div>
              </div>
            `
              )
              .join("")}
            
            <div class="links-tips">
              <p><strong>💡 Dica:</strong> Faça um teste para saber seu nível, depois foque no vocabulário correspondente.</p>
            </div>
          </div>
        </div>
      `;
      } else {
        // Card padrão (fallback)
        cardBodyHTML = `
        <div class="complementary-card-body">
          <p style="text-align: center; color: var(--text-secondary); padding: 20px;">
            Conteúdo em desenvolvimento
          </p>
        </div>
      `;
      }

      cardContent.innerHTML = cardBodyHTML;

      // Montar card completo
      materialCard.appendChild(cardHeader);
      materialCard.appendChild(cardContent);
      materialsGrid.appendChild(materialCard);

      // Configurar toggle individual para cada card (sistema de toggle único)
      const cardToggle = cardHeader.querySelector(".complementary-card-toggle");
      cardToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        const targetId = this.dataset.target;
        const targetContent = document.getElementById(
          `card-content-${targetId}`
        );
        toggleCard(targetId, targetContent, this);
      });
    });

    complementaryContent.appendChild(materialsGrid);

    // Configurar toggles de conteúdo adicional dos vídeos (após renderização)
    setTimeout(() => {
      const videoAdditionalButtons = document.querySelectorAll(
        ".video-additional-btn"
      );
      videoAdditionalButtons.forEach((button) => {
        button.addEventListener("click", function (e) {
          e.stopPropagation();
          const videoId = this.dataset.video;
          const additionalContent = document.getElementById(
            `additional-${videoId}`
          );
          const icon = this.querySelector("i");

          if (
            additionalContent.style.maxHeight === "0px" ||
            additionalContent.style.maxHeight === ""
          ) {
            additionalContent.style.maxHeight =
              additionalContent.scrollHeight + "px";
            icon.classList.remove("fa-plus-circle");
            icon.classList.add("fa-minus-circle");
            this.querySelector("span").textContent = "Esconder Conteúdo";
          } else {
            additionalContent.style.maxHeight = "0px";
            icon.classList.remove("fa-minus-circle");
            icon.classList.add("fa-plus-circle");
            this.querySelector("span").textContent = "Conteúdo Adicional";
          }
        });
      });
    }, 100);

    // Configurar toggle principal
    complementaryToggle.addEventListener("click", function () {
      complementaryContent.classList.toggle("active");
      this.classList.toggle("expanded");

      // Rotacionar ícone
      const icon = this.querySelector("i");
      if (complementaryContent.classList.contains("active")) {
        icon.style.transform = "rotate(180deg)";
      } else {
        icon.style.transform = "rotate(0deg)";
        // Se fechar o container principal, fecha todos os cards também
        closeAllCards();
      }
    });

    // Abrir o card "Meus Vídeos" por padrão
    setTimeout(() => {
      const firstCardToggle = document.querySelector(
        '[data-target="my-videos"]'
      );
      const firstCardContent = document.getElementById(
        "card-content-my-videos"
      );
      if (firstCardToggle && firstCardContent) {
        toggleCard("my-videos", firstCardContent, firstCardToggle);
      }
    }, 200);

    // Adicionar funcionalidade ao botão "Salvar para depois"
    setTimeout(() => {
      const saveButtons = document.querySelectorAll(".save-btn");
      saveButtons.forEach((button) => {
        button.addEventListener("click", function () {
          const videoId = this.dataset.videoId;
          const videoTitle = this.closest(
            ".individual-video-card"
          ).querySelector("h4").textContent;

          // Salvar no localStorage
          let savedVideos =
            JSON.parse(localStorage.getItem("savedGrammarVideos")) || [];

          if (!savedVideos.find((v) => v.id === videoId)) {
            savedVideos.push({
              id: videoId,
              title: videoTitle,
              savedAt: new Date().toISOString(),
            });
            localStorage.setItem(
              "savedGrammarVideos",
              JSON.stringify(savedVideos)
            );

            // Feedback visual
            const icon = this.querySelector("i");
            icon.classList.remove("fa-bookmark", "far");
            icon.classList.add("fa-check", "fas");
            this.textContent = " Salvo!";
            this.style.backgroundColor = "rgba(63, 185, 80, 0.2)";
            this.style.borderColor = "var(--accent-green)";

            setTimeout(() => {
              icon.classList.remove("fa-check", "fas");
              icon.classList.add("fa-bookmark", "far");
              this.innerHTML =
                '<i class="far fa-bookmark"></i> Salvar para depois';
              this.style.backgroundColor = "";
              this.style.borderColor = "";
            }, 2000);
          } else {
            // Já está salvo
            const icon = this.querySelector("i");
            icon.classList.remove("fa-bookmark", "far");
            icon.classList.add("fa-check", "fas");
            this.textContent = " Já salvo";

            setTimeout(() => {
              icon.classList.remove("fa-check", "fas");
              icon.classList.add("fa-bookmark", "far");
              this.innerHTML =
                '<i class="far fa-bookmark"></i> Salvar para depois';
            }, 1500);
          }
        });
      });
    }, 300);
  }

  // Renderizar o plano de estudos
  function renderStudyPlan(filter = "all") {
    monthsContainer.innerHTML = "";

    studyPlan.forEach((monthData, monthIndex) => {
      const monthCard = document.createElement("div");
      monthCard.className = "month-card";

      // Calcular progresso do mês usando função auxiliar
      const { monthCompleted, monthTotal, percentage } = calculateMonthProgress(
        monthData,
        completedContents,
        monthIndex
      );

      const monthHeader = document.createElement("div");
      monthHeader.className = "month-header";

      const monthTitle = document.createElement("div");
      monthTitle.className = "month-title";
      monthTitle.textContent = monthData.month;

      const monthProgress = document.createElement("div");
      monthProgress.className = "month-progress";
      monthProgress.textContent = `${monthCompleted}/${monthTotal} (${percentage}%)`;

      monthHeader.appendChild(monthTitle);
      monthHeader.appendChild(monthProgress);
      monthCard.appendChild(monthHeader);

      const weeksContainer = document.createElement("div");
      weeksContainer.className = "weeks-container";

      monthData.weeks.forEach((week) => {
        const weekCard = document.createElement("div");
        weekCard.className = "week-card";

        const weekTitle = document.createElement("div");
        weekTitle.className = "week-title";
        weekTitle.innerHTML = `<span>${week.title}</span> <i class="fas fa-book-open"></i>`;
        weekCard.appendChild(weekTitle);

        const contentList = document.createElement("ul");
        contentList.className = "content-list";

        week.contents.forEach((content, contentIndex) => {
          const contentId = `${monthIndex}-${week.title}-${contentIndex}`;
          const isCompleted = completedContents.includes(contentId);
          
          // Aplicar filtro
          if (filter === "completed" && !isCompleted) return;
          if (filter === "pending" && isCompleted) return;

          const contentItem = document.createElement("li");
          contentItem.className = "content-item";

          // Header do conteúdo
          const contentHeader = document.createElement("div");
          contentHeader.className = "content-header";

          // Checkbox
          const checkboxContainer = document.createElement("div");
          checkboxContainer.className = "content-checkbox";
          if (isCompleted) checkboxContainer.classList.add("checked");

          if (isCompleted) {
            const checkIcon = document.createElement("i");
            checkIcon.className = "fas fa-check";
            checkboxContainer.appendChild(checkIcon);
          }

          // Label - agora usando content.title se for objeto
          const label = document.createElement("span");
          label.className = `content-label ${isCompleted ? "completed" : ""}`;
          label.textContent = typeof content === 'object' ? content.title : content;

          // Botão toggle
          const toggleBtn = document.createElement("button");
          toggleBtn.className = "toggle-btn";
          toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';

          // Conteúdo expandido
          const expandedContent = document.createElement("div");
          expandedContent.className = "expanded-content";

          // Obter recursos
          const topicTitle = typeof content === 'object' ? content.title : content;
          const resources = getResources(topicTitle);

          // Verificar se é Mês 0 para aplicar estilização antiga
          if (monthIndex === 0) {
            // Estilização antiga (Mês 0)
            const oldStyleContainer = document.createElement("div");
            oldStyleContainer.className = "old-style-content";
            
            // Vídeos com estilo antigo
            if (resources.videos && resources.videos.length > 0) {
              const videosSection = document.createElement("div");
              videosSection.className = "content-card";
              videosSection.innerHTML = `<h3><i class="fas fa-video"></i> Vídeos da Aula</h3>`;
              
              const videosGrid = document.createElement("div");
              videosGrid.className = "videos-grid";
              
              resources.videos.forEach((video) => {
                const videoCard = createVideoCard(video);
                videosGrid.appendChild(videoCard);
              });
              
              videosSection.appendChild(videosGrid);
              oldStyleContainer.appendChild(videosSection);
            }
            
            // Materiais com estilo antigo (Example Box style)
            if (resources.materials && resources.materials.length > 0) {
              const materialsSection = document.createElement("div");
              materialsSection.className = "content-card";
              materialsSection.innerHTML = `<h3><i class="fas fa-book"></i> Materiais de Apoio</h3>`;
              
              const materialsBox = document.createElement("div");
              materialsBox.className = "example-box";
              
              const materialsList = document.createElement("ul");
              materialsList.className = "usage-list";
              
              resources.materials.forEach((material) => {
                const li = document.createElement("li");
                if (material.includes("(link:")) {
                  const linkMatch = material.match(/\((link:[^)]+)\)/);
                  const linkText = linkMatch[0].replace("(link:", "").replace(")", "");
                  const displayText = material.replace(linkMatch[0], "").trim();
                  li.innerHTML = `${displayText} <a href="${linkText}" target="_blank" class="highlight">Acessar</a>`;
                } else {
                  li.textContent = material;
                }
                materialsList.appendChild(li);
              });
              
              materialsBox.appendChild(materialsList);
              materialsSection.appendChild(materialsBox);
              oldStyleContainer.appendChild(materialsSection);
            }
            
            // Aprendizagem com estilo antigo (Important Note style)
            if (resources.learning && resources.learning.length > 0) {
              const learningSection = document.createElement("div");
              learningSection.className = "content-card";
              learningSection.innerHTML = `<h3><i class="fas fa-graduation-cap"></i> O que você vai aprender</h3>`;
              
              const learningNote = document.createElement("div");
              learningNote.className = "important-note";
              
              const learningList = document.createElement("ul");
              learningList.className = "usage-list";
              
              resources.learning.forEach((item) => {
                const li = document.createElement("li");
                li.textContent = item;
                learningList.appendChild(li);
              });
              
              learningNote.appendChild(learningList);
              learningSection.appendChild(learningNote);
              oldStyleContainer.appendChild(learningSection);
            }
            
            expandedContent.appendChild(oldStyleContainer);
          } else {
            // Estilização padrão (outros meses)
            // Seção de vídeos
            const videosSection = document.createElement("div");
            videosSection.className = "resources-section";
            
            const videosHeader = document.createElement("div");
            videosHeader.className = "section-header";
            videosHeader.innerHTML = '<i class="fas fa-video"></i> Vídeos Recomendados';
            
            const videosGrid = document.createElement("div");
            videosGrid.className = "videos-grid";
            
            resources.videos.forEach((video) => {
              const videoCard = createVideoCard(video);
              videosGrid.appendChild(videoCard);
            });
            
            videosSection.appendChild(videosHeader);
            videosSection.appendChild(videosGrid);
            expandedContent.appendChild(videosSection);

            // Seção de materiais
            const materialsSection = document.createElement("div");
            materialsSection.className = "resources-section";
            
            const materialsHeader = document.createElement("div");
            materialsHeader.className = "section-header";
            materialsHeader.innerHTML = '<i class="fas fa-book"></i> Materiais Complementares';
            
            const materialsList = document.createElement("ul");
            materialsList.className = "materials-list";
            
            resources.materials.forEach((material) => {
              const materialItem = createMaterialItem(material);
              materialsList.appendChild(materialItem);
            });
            
            materialsSection.appendChild(materialsHeader);
            materialsSection.appendChild(materialsList);
            expandedContent.appendChild(materialsSection);

            // SEÇÃO DE APRENDIZAGEM (NO FINAL)
            if (resources.learning && resources.learning.length > 0) {
              const learningSection = document.createElement("div");
              learningSection.className = "learning-section";
              
              const learningHeader = document.createElement("div");
              learningHeader.className = "section-header learning-header";
              learningHeader.innerHTML = '<i class="fas fa-graduation-cap"></i> O que você vai aprender';
              
              const learningList = document.createElement("ul");
              learningList.className = "learning-list";
              
              resources.learning.forEach((item) => {
                const learningItem = document.createElement("li");
                learningItem.className = "learning-item";
                learningItem.innerHTML = `<i class="fas fa-check-circle"></i> ${item}`;
                learningList.appendChild(learningItem);
              });
              
              learningSection.appendChild(learningHeader);
              learningSection.appendChild(learningList);
              expandedContent.appendChild(learningSection);
            }
          }

          // Evento do toggle (Lógica de Accordion apenas para Desktop)
          toggleBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            
            const isOpening = !expandedContent.classList.contains("active");
            const isDesktop = window.innerWidth > 768;
            
            if (isOpening) {
              // Se for desktop, fechar outros antes de abrir o atual
              if (isDesktop) {
                const allExpanded = monthsContainer.querySelectorAll(".expanded-content.active");
                const allToggleBtns = monthsContainer.querySelectorAll(".toggle-btn.expanded");
                
                allExpanded.forEach(el => {
                  el.classList.remove("active");
                  el.style.maxHeight = "0px";
                });
                
                allToggleBtns.forEach(btn => {
                  btn.classList.remove("expanded");
                });
              }
              
              // Abrir o atual
              expandedContent.classList.add("active");
              this.classList.add("expanded");
              expandedContent.style.maxHeight = expandedContent.scrollHeight + "px";
            } else {
              // Fechar o atual
              expandedContent.classList.remove("active");
              this.classList.remove("expanded");
              expandedContent.style.maxHeight = "0px";
            }
          });

          // Evento do checkbox
          checkboxContainer.addEventListener("click", function (e) {
            e.stopPropagation();
            const isCurrentlyCompleted = completedContents.includes(contentId);

            if (!isCurrentlyCompleted) {
              // Marcar como concluído
              completedContents.push(contentId);
              this.classList.add("checked");

              if (!this.querySelector("i.fa-check")) {
                const checkIcon = document.createElement("i");
                checkIcon.className = "fas fa-check";
                this.appendChild(checkIcon);
              }

              label.classList.add("completed");

              // Removida a expansão automática ao marcar como concluído a pedido do usuário
            } else {
              // Desmarcar
              completedContents = completedContents.filter(
                (id) => id !== contentId
              );
              this.classList.remove("checked");

              const checkIcon = this.querySelector("i.fa-check");
              if (checkIcon) {
                this.removeChild(checkIcon);
              }

              label.classList.remove("completed");
            }

            localStorage.setItem(
              "completedContents",
              JSON.stringify(completedContents)
            );
            updateProgress();

            // Atualizar progresso do mês
            const {
              monthCompleted: newMonthCompleted,
              monthTotal: newMonthTotal,
              percentage: newPercentage,
            } = calculateMonthProgress(
              monthData,
              completedContents,
              monthIndex
            );

            monthProgress.textContent = `${newMonthCompleted}/${newMonthTotal} (${newPercentage}%)`;
          });

          // Adicionar elementos ao header
          contentHeader.appendChild(checkboxContainer);
          contentHeader.appendChild(label);
          contentHeader.appendChild(toggleBtn);

          // Adicionar ao item
          contentItem.appendChild(contentHeader);
          contentItem.appendChild(expandedContent);
          contentList.appendChild(contentItem);
        });

        weekCard.appendChild(contentList);
        weeksContainer.appendChild(weekCard);
      });

      monthCard.appendChild(weeksContainer);
      monthsContainer.appendChild(monthCard);
    });
  }

  // Função para obter recursos
  function getResources(topic) {
    return resourcesDatabase[topic] || defaultResources;
  }

  // Atualizar progresso
  function updateProgress() {
    const { completed, percentage } = calculateProgress(
      completedContents,
      totalContents
    );

    globalProgress.style.width = `${percentage}%`;
    progressText.textContent = `${percentage}% Completo`;
    contentsCompletedElement.textContent = completed;
    completionRateElement.textContent = `${percentage}%`;
  }

  // Filtros
  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const filter = this.dataset.filter;

      filterButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");

      // Limpar busca ao mudar filtro
      searchInput.value = "";
      searchClearBtn.style.display = "none";
      searchResults.innerHTML = "";
      document.body.classList.remove("searching");
      clearSearchHighlights();

      renderStudyPlan(filter);
    });
  });

  // ========== SISTEMA DE BUSCA ==========
  const searchInput = document.getElementById("search-input");
  const searchClearBtn = document.getElementById("search-clear");
  const searchResults = document.getElementById("search-results");

  if (searchInput) {
    let searchDebounceTimer;

    searchInput.addEventListener("input", function () {
      const query = this.value.trim().toLowerCase();

      // Mostrar/esconder botão de limpar
      searchClearBtn.style.display = query ? "flex" : "none";

      // Debounce para busca
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        if (query) {
          performSearch(query);
        } else {
          clearSearch();
        }
      }, 150);
    });

    // Buscar ao pressionar Enter
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        const query = this.value.trim().toLowerCase();
        if (query) {
          performSearch(query);
        }
      }
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener("click", function () {
      searchInput.value = "";
      searchClearBtn.style.display = "none";
      searchResults.innerHTML = "";
      clearSearch();
      searchInput.focus();
    });
  }

  // Função de busca
  function performSearch(query) {
    document.body.classList.add("searching");
    let matchCount = 0;
    let totalChecked = 0;

    // Buscar em meses e semanas
    const monthCards = document.querySelectorAll(".month-card");
    monthCards.forEach((monthCard) => {
      let monthHasMatch = false;
      const weekCards = monthCard.querySelectorAll(".week-card");

      weekCards.forEach((weekCard) => {
        let weekHasMatch = false;
        const contentItems = weekCard.querySelectorAll(".content-item");

        contentItems.forEach((item) => {
          const label = item.querySelector(".content-label");
          if (!label) return;

          const text = label.textContent.toLowerCase();
          totalChecked++;

          if (text.includes(query)) {
            item.classList.add("has-match");
            highlightText(label, query);
            weekHasMatch = true;
            monthHasMatch = true;
            matchCount++;
          } else {
            item.classList.remove("has-match");
            removeHighlight(label);
          }
        });

        if (weekHasMatch) {
          weekCard.classList.add("has-match");
        } else {
          weekCard.classList.remove("has-match");
        }
      });

      if (monthHasMatch) {
        monthCard.classList.add("has-match");
      } else {
        monthCard.classList.remove("has-match");
      }
    });

    // Buscar em conteúdos complementares
    const complementaryCards = document.querySelectorAll(".complementary-card");
    complementaryCards.forEach((card) => {
      const title = card.querySelector(".complementary-card-title h3");
      const desc = card.querySelector(".complementary-card-desc");

      let cardHasMatch = false;
      if (title && title.textContent.toLowerCase().includes(query)) {
        cardHasMatch = true;
      }
      if (desc && desc.textContent.toLowerCase().includes(query)) {
        cardHasMatch = true;
      }

      if (cardHasMatch) {
        card.classList.add("has-match");
        if (title) highlightText(title, query);
        if (desc) highlightText(desc, query);
        matchCount++;
      } else {
        card.classList.remove("has-match");
        if (title) removeHighlight(title);
        if (desc) removeHighlight(desc);
      }
    });

    // Atualizar contador de resultados
    if (matchCount === 0) {
      searchResults.innerHTML = `<span class="no-results"><i class="fas fa-exclamation-circle"></i> Nenhum resultado encontrado</span>
      `;
    } else {
      const resultText = matchCount === 1 ? "resultado" : "resultados";
      searchResults.innerHTML = `
        <span class="has-results"><i class="fas fa-check-circle"></i> ${matchCount} ${resultText} encontrado${matchCount === 1 ? "" : "s"}</span>
      `;
    }
  }

  // Limpar busca
  function clearSearch() {
    document.body.classList.remove("searching");
    clearSearchHighlights();

    // Remover classes de match
    document.querySelectorAll(".has-match").forEach((el) => {
      el.classList.remove("has-match");
    });

    searchResults.innerHTML = "";
  }

  // Destacar texto encontrado
  function highlightText(element, query) {
    if (!element || element.dataset.hasHighlight) return;

    const originalText = element.textContent;
    const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
    const highlighted = originalText.replace(
      regex,
      '<span class="search-highlight">$1</span>'
    );

    element.innerHTML = highlighted;
    element.dataset.originalText = originalText;
    element.dataset.hasHighlight = "true";
  }

  // Remover destaque
  function removeHighlight(element) {
    if (!element || !element.dataset.hasHighlight) return;

    element.textContent = element.dataset.originalText || element.textContent;
    delete element.dataset.hasHighlight;
    delete element.dataset.originalText;
  }

  // Limpar todos os destaques
  function clearSearchHighlights() {
    document.querySelectorAll(".search-highlight").forEach((el) => {
      const parent = el.parentElement;
      if (parent) {
        parent.textContent = parent.dataset.originalText || parent.textContent;
        delete parent.dataset.hasHighlight;
        delete parent.dataset.originalText;
      }
    });
  }

  // Escapar caracteres especiais para regex
  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Atalho de teclado Ctrl+K ou Cmd+K para focar na busca
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }

    // Esc para limpar busca
    if (e.key === "Escape" && searchInput === document.activeElement) {
      if (searchInput.value) {
        searchInput.value = "";
        searchClearBtn.style.display = "none";
        searchResults.innerHTML = "";
        clearSearch();
      } else {
        searchInput.blur();
      }
    }
  });

  // Reiniciar progresso
  resetButton.addEventListener("click", function () {
    if (confirm("Tem certeza que deseja reiniciar todo o progresso?")) {
      completedContents = [];
      localStorage.removeItem("completedContents");
      updateProgress();
      renderStudyPlan();

      filterButtons.forEach((btn) => btn.classList.remove("active"));
      document
        .querySelector('.filter-btn[data-filter="all"]')
        .classList.add("active");
    }
  });

  // ========== INICIALIZAÇÃO ==========
  
  updateDateTime();
  updateProgress();
  
  // Inicializar progresso da Semana 0
  initializeWeekZeroProgress();
  
  // 1. Renderizar Semana 0 primeiro
  renderWeekZeroFirst();
  
  // 2. Inicializar conteúdos já concluídos da Semana 0
  setTimeout(() => {
    checkCompletedWeekZeroContents();
    
    // Configurar event listeners para os conteúdos da Semana 0
    const contentHeaders = document.querySelectorAll('.content-card-header');
    contentHeaders.forEach(header => {
      header.addEventListener('click', function() {
        const contentId = this.closest('.week-zero-content-card').id.replace('content-', '');
        window.toggleWeekZeroContent(contentId);
      });
    });
  }, 500);
  
  // 3. Conteúdos adicionais (sem a Semana 0)
  renderComplementaryMaterials();
  
  // 4. Plano de estudos (meses)
  renderStudyPlan();

  // Atualizar data a cada minuto
  setInterval(updateDateTime, 60000);
});

// js/app.js
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.installButton = null;
    this.installContainer = null;
    this.init();
  }

  init() {
    // Registrar Service Worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log(
              "ServiceWorker registrado com sucesso:",
              registration.scope
            );
            this.checkForUpdates(registration);
          })
          .catch((error) => {
            console.log("Falha ao registrar ServiceWorker:", error);
          });
      });
    }

    // Detectar evento de instalação
    window.addEventListener("beforeinstallprompt", (e) => {
      console.log("beforeinstallprompt disparado");
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPromotion();
    });

    // Detectar se app já está instalado
    window.addEventListener("appinstalled", () => {
      console.log("App instalado com sucesso!");
      this.deferredPrompt = null;
      this.hideInstallPromotion();
    });

    // Verificar modo standalone (se já está instalado)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      console.log("App rodando em modo standalone");
      this.onAppInstalled();
    }
  }

  showInstallPromotion() {
    // Criar botão de instalação se não existir
    if (!this.installContainer) {
      this.createInstallButton();
    }

    this.installContainer.style.display = "flex";

    // Mostrar por 10 segundos, depois esconder
    setTimeout(() => {
      if (this.installContainer) {
        this.installContainer.style.display = "none";
      }
    }, 10000);
  }

  createInstallButton() {
    this.installContainer = document.createElement("div");
    this.installContainer.className = "install-container";
    this.installContainer.innerHTML = `
      <div class="install-card">
        <div class="install-icon">
          <i class="fas fa-download"></i>
        </div>
        <div class="install-content">
          <h3>Instalar App</h3>
          <p>Instale o app para acesso offline e notificações de estudo!</p>
          <div class="install-buttons">
            <button class="install-btn" id="install-button">
              <i class="fas fa-mobile-alt"></i> Instalar
            </button>
            <button class="install-cancel" id="install-cancel">
              Agora não
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.installContainer);

    this.installButton = document.getElementById("install-button");
    const cancelButton = document.getElementById("install-cancel");

    this.installButton.addEventListener("click", () => this.installApp());
    cancelButton.addEventListener("click", () => this.hideInstallPromotion());
  }

  hideInstallPromotion() {
    if (this.installContainer) {
      this.installContainer.style.display = "none";
    }
  }

  async installApp() {
    if (!this.deferredPrompt) return;

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;

    console.log(`Usuário ${outcome} a instalação`);
    this.deferredPrompt = null;
    this.hideInstallPromotion();
  }

  onAppInstalled() {
    // Configurações específicas para quando o app está instalado
    console.log("App está instalado, configurando...");

    // Adicionar funcionalidades específicas para app instalado
    this.setupAppFeatures();
  }

  setupAppFeatures() {
    // Notificações diárias
    this.setupDailyNotifications();

    // Sync em background
    this.setupBackgroundSync();

    // Gerenciamento de armazenamento
    this.setupStorageManagement();
  }

  setupDailyNotifications() {
    // Pedir permissão para notificações
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("Permissão para notificações concedida");
          this.scheduleDailyReminder();
        }
      });
    }
  }

  scheduleDailyReminder() {
    // Agendar notificação diária às 19:00
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification("Hora de Estudar Inglês!", {
          body: "Não se esqueça de completar seus estudos diários de inglês!",
          icon: "icons/icon-192x192.png",
          badge: "icons/icon-72x72.png",
          tag: "daily-reminder",
          requireInteraction: true,
          actions: [
            { action: "study", title: "Estudar Agora" },
            { action: "snooze", title: "Lembrar mais tarde" },
          ],
        });
      });
    }
  }

  setupBackgroundSync() {
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.sync
          .register("sync-progress")
          .then(() => console.log("Background sync registrado"))
          .catch(console.error);
      });
    }
  }

  setupStorageManagement() {
    // Monitorar uso de armazenamento
    if ("storage" in navigator && "estimate" in navigator.storage) {
      navigator.storage.estimate().then((estimate) => {
        console.log(`Usando ${estimate.usage} de ${estimate.quota} bytes`);
      });
    }
  }

  checkForUpdates(registration) {
    // Verificar atualizações periodicamente
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // A cada hora
  }

  // Métodos para funcionalidades do app
  static shareProgress() {
    if (navigator.share) {
      const progress = localStorage.getItem("completedContents");
      const completed = progress ? JSON.parse(progress).length : 0;

      navigator.share({
        title: "Meu Progresso em Inglês",
        text: `Já completei ${completed} conteúdos no app Inglês em 6 Meses!`,
        url: window.location.href,
      });
    }
  }

  static addToHomeScreen() {
    // Esta função pode ser chamada de um botão no app
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
    }
  }
}

// Exportar para uso global
window.PWAManager = PWAManager;