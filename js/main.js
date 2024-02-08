document.addEventListener('DOMContentLoaded', function () {
  fetch('./database/data.json')
    .then(response => response.json())
    .then(data => {
      const listGroup = document.querySelector('.list-group'); // Assurez-vous que cette classe correspond à votre conteneur d'entrées

      data.forEach(item => {
        const entryElement = document.createElement('a');
        entryElement.classList.add('list-group-item', 'list-group-item-action');
        entryElement.setAttribute('aria-current', 'true');

        // Construction du contenu pour le deuxième <p> de manière conditionnelle
        let additionalInfo = [item.chineseName, item.otherNames].filter(Boolean).join(', ');

        entryElement.innerHTML = `
                <div class="d-flex flex-column flex-sm-row w-100 entry" href="javascript:void(0);" onclick="showDetails('${item.ID}')">
                    <p class="fw-bold" style="width:200px">${item.englishName}</p>
                    <p class="flex-grow-1">${additionalInfo}</p>
                    <span class="badge rounded-pill bg-primary">${item.creatersInitial}</span>
                </div>
            `;
        listGroup.appendChild(entryElement);
      });
    })
    .catch(error => console.error('Error loading the data:', error));
});

function copyText(elementId) {
  const textToCopy = document.getElementById(elementId).innerText;
  navigator.clipboard.writeText(textToCopy).then(() => {
    document.getElementById("copyButton").classList.add("success")
    setTimeout(() => { document.getElementById("copyButton").classList.remove("success"); }, 3000);;
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}

// Fonction pour charger et compter les données
function loadDataAndCount() {
  fetch('./database/data.json')
    .then(response => response.json()) // Parse la réponse en JSON
    .then(data => {
      // Met à jour le span avec le nombre d'éléments
      // Supposons que `data` est un tableau
      document.getElementById('dataCount').textContent = `目前共有 ${data.length} 条译名信息`;
    })
    .catch(error => {
      console.error('Erreur lors du chargement du fichier JSON:', error);
      document.getElementById('dataCount').textContent = 'Erreur lors du chargement des données.';
    });
}

// Appelle la fonction au chargement de la page
window.addEventListener('load', loadDataAndCount);


function showDetails(id) {
  fetch('./database/data.json')
    .then(response => response.json())
    .then(data => {
      const detail = data.find(item => item.ID === id);
      if (detail) {
        const detailSidebar = document.getElementById('detailSidebar');
        detailSidebar.innerHTML = `
                <div class="card-body">
                    <h3 class="card-title">${detail.englishName}</h3>
                    <div class="copy-container">
                    <p class="pt-3" id="textToCopy">${detail.chineseName}</p><button id="copyButton" type="button" class="btn btn-copy" onclick="copyText('textToCopy')"><span></span></button>
                    </div>
                    <p>${detail.otherNames}</p>
                    <p>${detail.description}</p>
                    <p>Created by: ${detail.creatersInitial}</p>
                    <p>Entry Date: ${detail.entryDate}</p>
                    <p>Last Modified: ${detail.lastModifiedDate} by ${detail.lastModifiedAuthor}</p>
                </é>
            `;
        detailSidebar.style.display = 'block';
      }
    })
    .catch(error => console.error('Error loading the details:', error));
}