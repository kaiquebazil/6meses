// js/utils/helpers.js

// Função para obter data formatada
export function getFormattedDate() {
  const now = new Date();
  const days = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return {
    dayName: days[now.getDay()],
    day: now.getDate(),
    month: months[now.getMonth()],
    year: now.getFullYear(),
  };
}

// Função para criar vídeo card
export function createVideoCard(video) {
  const videoCard = document.createElement("a");
  videoCard.href = `https://www.youtube.com/watch?v=${video.id}`;
  videoCard.target = "_blank";
  videoCard.className = "video-card";

  videoCard.innerHTML = `
    <div class="video-icon">
      <i class="fas fa-play-circle"></i>
    </div>
    <div class="video-info">
      <div class="video-title">${video.title}</div>
      <div class="video-details">
        <span><i class="fas fa-clock"></i> ${video.duration}</span>
        <span>${video.channel}</span>
      </div>
    </div>
  `;

  return videoCard;
}

// Função para criar material item
export function createMaterialItem(material) {
  const item = document.createElement("li");
  item.className = "material-item";

  // Verificar se tem link
  if (material.includes("(link:")) {
    const linkMatch = material.match(/\((link:[^)]+)\)/);
    if (linkMatch) {
      const linkText = linkMatch[0].replace("(link:", "").replace(")", "");
      const displayText = material.replace(linkMatch[0], "").trim();

      item.innerHTML = `
        ${displayText} 
        <a href="${linkText}" target="_blank" class="material-link">
          <i class="fas fa-external-link-alt"></i>
        </a>
      `;
    } else {
      item.textContent = material;
    }
  } else {
    item.textContent = material;
  }

  return item;
}

// Função para calcular progresso
export function calculateProgress(completedContents, totalContents) {
  const completed = completedContents.length;
  const percentage = Math.round((completed / totalContents) * 100);

  return {
    completed,
    percentage,
  };
}

// Função para calcular progresso do mês
export function calculateMonthProgress(
  monthData,
  completedContents,
  monthIndex
) {
  let monthCompleted = 0;
  let monthTotal = 0;

  monthData.weeks.forEach((week) => {
    monthTotal += week.contents.length;
    week.contents.forEach((content, contentIndex) => {
      const contentId = `${monthIndex}-${week.title}-${contentIndex}`;
      if (completedContents.includes(contentId)) {
        monthCompleted++;
      }
    });
  });

  return {
    monthCompleted,
    monthTotal,
    percentage:
      monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0,
  };
}
