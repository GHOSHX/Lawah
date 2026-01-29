const dbName = 'gameData';
const dbVersion = 7;

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
let tutorialComplete = false;

document.addEventListener('DOMContentLoaded', () => {
    openDB();
    document.getElementById('tutorial-page-btn').addEventListener('click', () => {
        window.location.href = 'tutorial.html';
    });
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
    document.getElementById('create-article-btn').addEventListener('click', generateArticle);
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
          
          const template = document.getElementById('section-template').content.cloneNode(true);
          const newId = Date.now();
          
          // Restore data
          const newArticle = {
              articleId: newId,
              data: uploadedData.data,
              rows: uploadedData.infoboxes || uploadedData.rows,
              cells: uploadedData.cells
          };
          articles.push(newArticle);
          
          updateSection(template, newArticle);
          document.getElementById('article-list').appendChild(template);
          document.getElementById('clear-all-btn').style.display = 'inline';
          saveState();
    
          alert('File uploaded and data restored ✅');
        } catch (err) {
          alert('Invalid JSON file ❌');
          console.error(err);
        }
      };
      reader.readAsText(file);
    });
});

function generateArticle() {
    const template = document.getElementById('section-template').content.cloneNode(true);
    const newId = Date.now();
    const articleNum = articles.length + 1;
    
    const newData = {
        id: newId,
        title: 'Article ' + articleNum,
        intro: 'Write intro here...',
        synopsis: 'Write synopsis here...',
        poster: 'https://i.ibb.co/jkvtj531/file-00000000b08861faaa5ae1d6be8c5b27.png',
        upperToolbar: false,
        infobox: false
    };
    
    const newArticle = {
        articleId: newId,
        data: newData,
        rows: [],
        cells: []
    };
    articles.push(newArticle);
    
    updateSection(template, newArticle);
    document.getElementById('article-list').appendChild(template);
    document.getElementById('clear-all-btn').style.display = 'inline';
    saveState();
}

function updateSection(template, section) {
    template.querySelector('.section-wrapper').setAttribute('data-index', section.articleId);
    template.querySelector('.title').textContent = section.data.title;
    let introText;
    if (section.data.intro.length > 100) {
        introText = section.data.intro.slice(0, 100);
    } else {
        introText = section.data.intro;
    }
    template.querySelector('.intro-text').textContent = introText + '...(tap to open)';
    template.querySelector('.article-poster').style.backgroundImage = `url(${section.data.poster})`;
}

function handleSectionClick (event) {
    const target = event.target;
    const wrapper = target.closest('.section-wrapper');
    const index = wrapper.dataset.index;
    const section = articles.find(sec => sec.articleId == index);
    if (target.classList.contains('section-wrapper')) {
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
        section.data.title = titleInput.value;
        title.textContent = section.data.title;
        target.textContent = '✏️';
    }
    saveState();
}

function deleteSection(wrapper, section) {
    const transaction = db.transaction(['articles'], 'readwrite');
    
    const articleStore = transaction.objectStore('articles');
    
    articleStore.get(section.articleId).onsuccess = function(event) {
        const articleData = event.target.result;
        
        if (articleData) {
            if (confirm('Are you sure you want to delete this article?')) {
                wrapper.remove();
                articles = articles.filter(article => article.articleId !== section.articleId);
                articleStore.delete(section.articleId);
                
                if (articles.length === 0) {
                    document.getElementById('clear-all-btn').style.display = 'none';
                }
                
                saveState();
            }
        }
    };
}

function loadState() {
    const savedSections = JSON.parse(localStorage.getItem('sections'));
    tutorialComplete = localStorage.getItem('tutorial-complete') === 'true';
    const transaction = db.transaction(['articles'], 'readonly');
    const articleStore = transaction.objectStore('articles');
    
    articleStore.getAll().onsuccess = function(event) {
        if (!tutorialComplete) {
            window.location.href = 'tutorial.html';
        }
        
        articles = event.target.result;
        articles.forEach(article => {
          console.log('Article: ' + article.articleId);
        });
        
        if (articles && articles.length > 0) {
            document.getElementById('clear-all-btn').style.display = 'inline';
            
            articles.forEach(article => {
                if (article) {
                  const template = document.getElementById('section-template').content.cloneNode(true);
                  updateSection(template, article);
                  console.log('Section: ' + article.articleId);
                  document.getElementById('article-list').appendChild(template);
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