const dbName = 'gameData';
const dbVersion = 3;

let db;

function openDB() {
    const request = indexedDB.open(dbName, dbVersion);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains('pages')) {
            const pageStore = db.createObjectStore('pages', { keyPath: 'pageId' });
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

let pages = [];
let sections = [];
let titles = []
let characters = [];
let synopses = [];
let cells = [];
let deletePageId;
let pageData;

document.addEventListener('DOMContentLoaded', () => {
    openDB();
    document.getElementById('pic1-btn').addEventListener('click', () => {
        document.getElementById('home-pic1').style.display = 'none';
        document.getElementById('home-pic2').style.display = 'block';
    });
    document.getElementById('pic2-btn').addEventListener('click', () => {
        document.getElementById('home-pic2').style.display = 'none';
        document.getElementById('home-pic1').style.display = 'block';
    });
    document.getElementById('create-section-btn').addEventListener('click', generateSection);
    document.getElementById('page-list').addEventListener('click', handleSectionClick);
});

function generateSection() {
    const template = document.getElementById('section-template').content.cloneNode(true);
    const newId = Date.now();
    const pageNum = sections.length + 1;
    
    const newSection = {
        id: newId,
        text: 'Page ' + pageNum
    };
    sections.push(newSection);
    
    updateSection(template, newSection);
    generateArticle(newSection.id);
    document.getElementById('page-list').appendChild(template);
    saveState();
}

function generateArticle(newId) {
    const newPage = {
        pageId: newId,
        data: {},
        characters: [],
        cells: [],
        synopses: []
    };
    pages.push(newPage);
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
    if (target.classList.contains('page-open-btn') || target.classList.contains('title')) {
        const title = wrapper.querySelector('.title').textContent;
        const sectionsParam = encodeURIComponent(JSON.stringify(sections));
        window.location.href = `article.html?pageId=${index}&pageTitle=${encodeURIComponent(title)}`;
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
    const transaction = db.transaction(['pages'], 'readwrite');
    
    const pageStore = transaction.objectStore('pages');
    
    pageStore.get(section.id).onsuccess = function(event) {
        const pageData = event.target.result;
        
        if (pages) {
            if (confirm('Are you sure you want to delete this page?')) {
                wrapper.remove();
                pages = pages.filter(page => page.pageId !== section.id);
                sections.splice(sections.indexOf(section), 1);
                pageStore.delete(pageData.pageId);
                saveState();
            }
        }
    };
}

function loadState() {
    const savedSections = JSON.parse(localStorage.getItem('sections'));
    const transaction = db.transaction(['pages'], 'readonly');
    const pageStore = transaction.objectStore('pages');
    
    if (savedSections) {
        savedSections.forEach(section => {
            const template = document.getElementById('section-template').content.cloneNode(true);
            updateSection(template, section);
            console.log('section: ' + section.id);
            document.getElementById('page-list').appendChild(template);
        });
        sections.push(...savedSections);
    }
    
    pageStore.getAll().onsuccess = function(event) {
        pages = event.target.result;
        titles = pages.titles;
        pages.forEach(page => {
          console.log('page: ' + page.pageId);
        });
    };
}

function saveState() {
    localStorage.setItem('sections', JSON.stringify(sections));
    const transaction = db.transaction(['pages'], 'readwrite');
    
    const pageStore = transaction.objectStore('pages');
    
    pages.forEach(page => pageStore.put(page));
}

function clearSavedState() {
    if (confirm('Are you sure you want to delete all the saved files?')) {
        const transaction = db.transaction(['pages'], 'readwrite');
        
        const pageStore = transaction.objectStore('pages');

        pageStore.clear();
        localStorage.remove('sections');
        

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
  const transaction = db.transaction(['pages'], 'readwrite');
    
    const pageStore = transaction.objectStore('pages');
    
    if (type === 'section') {
        sections = sections.filter(section => section.id !== id);
    } else if (type === 'page') {
        pages = pages.filter(page => page.pageId !== id);
        pageStore.delete(id);
    }
    saveState();
}
