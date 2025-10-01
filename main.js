const dbName = 'gameData';
const dbVersion = 5;

let db;

function openDB() {
    const request = indexedDB.open(dbName, dbVersion);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains('articles')) {
            const articleStore = db.createObjectStore('articles', { keyPath: 'articleId' });
        }
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        loadState();
    };

    request.onerror = function(event) {
        console.error('IndexedDB error:', event.target.error);
    };
}

let articles = [];
let sections = [];

document.addEventListener('DOMContentLoaded', () => {
    openDB();
    document.getElementById('pic-toggle-btn').addEventListener('click', () => {
        const isVisible = document.getElementById('home-pic1').style.display !== 'none';
        
        if (isVisible) {
            document.getElementById('home-pic1').style.display = 'none';
            document.getElementById('home-pic2').style.display = 'inline';
        } else {
            document.getElementById('home-pic1').style.display = 'inline';
            document.getElementById('home-pic2').style.display = 'none';
        }
    });
    document.getElementById('create-section-btn').addEventListener('click', () => generateSection(null, null));
    document.getElementById('article-list').addEventListener('click', handleSectionClick);
    document.getElementById('upload-file-btn').addEventListener('click', () => {
      document.getElementById('upload-input').click();
    });
    document.getElementById('upload-input').addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;
    
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const uploadedData = JSON.parse(e.target.result);
          
          const newId = Date.now();
          
          // Restore data
          const newArticle = {
              articleId: newId,
              data: uploadedData.data,
              characters: uploadedData.characters,
              cells: uploadedData.cells,
              synopses: uploadedData.synopses
          };
          articles.push(newArticle);
          generateSection(newId, uploadedData.data.title);
          
    
          alert('File uploaded and data restored ✅');
        } catch (err) {
          alert('Invalid JSON file ❌');
          console.error(err);
        }
      };
      reader.readAsText(file);
    });
});

function generateSection(id, title) {
    const template = document.getElementById('section-template').content.cloneNode(true);
    const newId = Date.now();
    const articleNum = sections.length + 1;
    console.log(id);
    
    const newSection = {
        id: id ? id : newId,
        text: title ? title : 'Article ' + articleNum
    };
    sections.push(newSection);
    
    updateSection(template, newSection);
    if (!id) {
      generateArticle(newSection.id, newSection.text);
    }
    document.getElementById('article-list').appendChild(template);
    saveState();
}

function generateArticle(newId, newTitle) {
    const newData = {
        id: newId,
        title: newTitle,
        intro: 'Write intro here...',
        synopsis: 'Write synopsis here...',
        poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/660px-No-Image-Placeholder.svg.png?20200912122019',
    };
    
    const newArticle = {
        articleId: newId,
        data: newData,
        characters: [],
        cells: [],
        synopses: []
    };
    articles.push(newArticle);
}

function updateSection(template, section) {
    template.querySelector('.section-wrapper').setAttribute('data-index', section.id);
    template.querySelector('.title').textContent = section.text;
}

function handleSectionClick (event) {
    const target = event.target;
    const wrapper = target.closest('.section-wrapper');
    const index = wrapper.dataset.index;
    const section = sections.find(sec => sec.id == index);
    if (target.classList.contains('article-open-btn') || target.classList.contains('title')) {
        const title = wrapper.querySelector('.title').textContent;
        const sectionsParam = encodeURIComponent(JSON.stringify(sections));
        window.location.href = `article.html?articleId=${index}&articleTitle=${encodeURIComponent(title)}`;
    } else if (target.classList.contains('edit-section-btn')) {
        editSection(section, wrapper, target);
    } else if (target.classList.contains('delete-section-btn')) {
        deleteSection(wrapper, section);
    }
}

function editSection(section, element, target) {
    const editMode = target.textContent === '✏️';
    const title = element.querySelector('.title');
    const titleInput = element.querySelector('.title-input');
    
    if (editMode) {
        title.style.display = 'none';
        titleInput.style.display = 'inline';
        titleInput.value = title.textContent;
        target.textContent = '✔️';
    } else {
        titleInput.style.display = 'none';
        title.style.display = 'block';
        section.text = titleInput.value;
        title.textContent = section.text;
        target.textContent = '✏️';
    }
    saveState();
}

function deleteSection(wrapper, section) {
    const transaction = db.transaction(['articles'], 'readwrite');
    
    const articleStore = transaction.objectStore('articles');
    
    articleStore.get(section.id).onsuccess = function(event) {
        const articleData = event.target.result;
        
        if (articleData) {
            if (confirm('Are you sure you want to delete this article?')) {
                wrapper.remove();
                articles = articles.filter(article => article.articleId !== section.id);
                sections.splice(sections.indexOf(section), 1);
                articleStore.delete(articleData.articleId);
                saveState();
            }
        }
    };
}

function loadState() {
    const savedSections = JSON.parse(localStorage.getItem('sections'));
    const transaction = db.transaction(['articles'], 'readonly');
    const articleStore = transaction.objectStore('articles');
    
    articleStore.getAll().onsuccess = function(event) {
        articles = event.target.result;
        articles.forEach(article => {
          console.log('Article: ' + article.articleId);
        });
        
        if (savedSections) {
            savedSections.forEach(section => {
                const article = articles.find(a => a.articleId == section.id)
                
                if (article) {
                  const template = document.getElementById('section-template').content.cloneNode(true);
                  updateSection(template, section);
                  console.log('Section: ' + section.id);
                  document.getElementById('article-list').appendChild(template);
                  sections.push(section);
                }
            });
        }
    };
}

function saveState() {
    localStorage.setItem('sections', JSON.stringify(sections));
    const transaction = db.transaction(['articles'], 'readwrite');
    
    const articleStore = transaction.objectStore('articles');
    
    articles.forEach(article => articleStore.put(article));
}

function clearSavedState() {
    if (confirm('Are you sure you want to delete all the saved files?')) {
        const transaction = db.transaction(['articles'], 'readwrite');
        
        const articleStore = transaction.objectStore('articles');

        articleStore.clear();
        localStorage.removeItem('sections');
        

        transaction.oncomplete = function() {
            console.log('Data cleared from IndexedDB');
            location.reload();
        };

        transaction.onerror = function(event) {
            console.error('IndexedDB transaction error:', event.target.error);
        };
    }
}

function deleteCommand(id, type) {
  const transaction = db.transaction(['articles'], 'readwrite');
    
    const articleStore = transaction.objectStore('articles');
    
    if (type === 'section') {
        sections = sections.filter(section => section.id !== id);
    } else if (type === 'article') {
        articles = articles.filter(article => article.articleId !== id);
        articleStore.delete(id);
    }
    saveState();
}