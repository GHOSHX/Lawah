let db;

function openDB() {
    const request = indexedDB.open('gameData', 6);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        loadState(false);
    };

    request.onerror = function(event) {
        console.error('IndexedDB error:', event.target.error);
    };
}

let data = {};
let rows = [];
let cells = [];
let undoList = [];
let redoList = [];
let tempArray = [];
let previousSaves = [];
let articleName;
let currentArticleId;
let currentTextArea;
let toggleSynopsisBtn;
let toggleInfoboxBtn;
let editSynopsisBtn;
let toggleAddBtn;
let addRow1Btn;
let addRow2Btn;
let addRow3Btn;
let addCell1Btn;
let addCell2Btn;
let editButton;
let fileUploadBtn;
let downloadBtn;
let settingsBtn
let content;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentArticleId = Number(urlParams.get('articleId'));
    articleName = decodeURIComponent(urlParams.get('articleTitle'));
    
    openDB();
    
    const inputPoster = document.getElementById('poster-input');
    toggleSynopsisBtn = document.getElementById('toggle-synopsis-btn');
    toggleInfoboxBtn = document.getElementById('toggle-infobox-btn');
    editButton = document.getElementById('edit-article-btn');
    fileUploadBtn = document.getElementById('file-upload-btn');
    downloadBtn = document.getElementById('download-btn');
    settingsBtn = document.getElementById('settings-btn');
    editSynopsisBtn = document.getElementById('edit-synopsis-btn');
    toggleAddBtn = document.getElementById('toggle-add-btn');
    addRow1Btn = document.getElementById('add-infobox-btn');
    addRow2Btn = document.getElementById('add-category-btn');
    addRow3Btn = document.getElementById('add-text-btn');
    addCell1Btn = document.getElementById('add-info-btn1');
    addCell2Btn = document.getElementById('add-info-btn2');
    content = document.getElementById('content');
    content.style.display = 'none';
    addCell1Btn.addEventListener('click', () => generateCell('info-template', null));
    addCell2Btn.addEventListener('click', () => generateCell('info-template2', null));
    toggleAddBtn.addEventListener('click', () => {
        const addBtn = document.querySelectorAll('.row-add-btn');
        
        addBtn.forEach(button => {
            if (getComputedStyle(button).display.includes('none')) {
                button.style.display = 'inline-flex';
            } else {
                button.style.display = 'none';
            }
        });
    });
    addRow1Btn.addEventListener('click', () => generateRow(null, null, 'infobox'));
    document.getElementById('add-table-btn').addEventListener('click', () => generateRow(null, null, 'table'));
    addRow2Btn.addEventListener('click', () => generateRow(null, null, 'category'));
    addRow3Btn.addEventListener('click', () => generateRow(null, null, 'text-area'));
    toggleSynopsisBtn.addEventListener('click', () => toggleTable('table1', toggleSynopsisBtn));
    toggleInfoboxBtn.addEventListener('click', () => toggleTable('row-list', toggleInfoboxBtn));
    document.getElementById('reset-article-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset this article?')) {
            resetArticle();
        }
    });
    document.getElementById('enable-preset1').addEventListener('click', () => presetGenerateCell(1));
    document.getElementById('enable-preset2').addEventListener('click', () => presetGenerateCell(2));
    document.getElementById('close-settings-btn').addEventListener('click', toggleSettings);
    document.getElementById('upper-toolbar-btn').addEventListener('click', function () {
        if (this.textContent === 'Upper Toolbar: Off') {
            data.upperToolbar = true;
        } else {
            data.upperToolbar = false;
        }
        toggleUpperToolbar();
        saveState(1);
    });
    document.getElementById('infobox-toggle-btn').addEventListener('click', function () {
        if (this.textContent === 'Main Infobox: Hide') {
            data.infobox = true;
        } else {
            data.infobox = false;
        }
        toggleMainInfobox();
        saveState(2);
    });
    document.getElementById('show-code-btn').addEventListener('click', () => {
        document.getElementById('show-code').style.display = 'block';
        const clone = content.cloneNode(true);
        
        clone.querySelectorAll('img').forEach(img => {
            img.setAttribute('src', '[REDACTED]');
        });
        
        document.getElementById('show-code').value = clone.innerHTML;
    });
    document.getElementById('undo-btn').addEventListener('click', undoManager);
    document.getElementById('redo-btn').addEventListener('click', redoManager);
    document.getElementById('header-toggle-btn').addEventListener('click', () => {
        const headerTextBtn = document.querySelectorAll('.header-text-btn');
      
        headerTextBtn.forEach(button => {
            if (button.style.display === 'none'||button.style.display === '') {
              button.style.display = 'inline-block';
            } else {
              button.style.display = 'none';
            }
        });
    });
    document.getElementById('header1-text-btn').addEventListener('click', () => styleText('h1'));
    document.getElementById('header2-text-btn').addEventListener('click', () => styleText('h2'));
    document.getElementById('header3-text-btn').addEventListener('click', () => styleText('h3'));
    document.getElementById('bold-text-btn').addEventListener('click', () => styleText('b'));
    document.getElementById('italic-text-btn').addEventListener('click', () => styleText('i'));
    document.getElementById('link-text-btn').addEventListener('click', () => styleText('a'));
    settingsBtn.addEventListener('click', toggleSettings);
    document.getElementById('img-toggle-btn').addEventListener('click', () => { 
        const imgBtn = document.querySelectorAll('.img-btn');
      
        imgBtn.forEach(button => {
            if (button.style.display === 'none'||button.style.display === '') {
              button.style.display = 'inline-block';
            } else {
              button.style.display = 'none';
            }
        });
    });
    document.getElementById('img-file-btn').addEventListener('click', () => {
        document.getElementById('upload-img2').click();
    });
    document.getElementById('img-link-btn').addEventListener('click', () => {
        styleText('img');
    });
    document.getElementById('upload-img2').addEventListener('change', function() {
        const file = this.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgSrc = e.target.result;
            styleText('img2', imgSrc)
        }
        reader.readAsDataURL(file);
    });
    document.getElementById('bullet-list-btn').addEventListener('click', () => styleText('ul'));
    editButton.addEventListener('click', editArticle);
    document.getElementById('sidebar-toggle-btn').addEventListener('click', function () {
        const sidebar = document.getElementById('sidebar-content');
        if (getComputedStyle(sidebar).display.includes('none')) {
            sidebar.style.display = 'block';
            this.innerHTML = '◀';
        } else {
            sidebar.style.display = 'none';
            this.innerHTML = '▶';
        }
    })
    fileUploadBtn.addEventListener('click', () => {
      document.getElementById('upload-input').click();
    });
    document.getElementById('upload-input').addEventListener('change', uploadFile);
    downloadBtn.addEventListener('click', async () => {
      try {
        const articleData = {
          articleId: currentArticleId,
          data: data,
          rows: rows,
          cells: cells
        };
        const jsonContent = JSON.stringify(articleData, null, 2);
    
        // ✅ Check if File System Access API is available
        if (window.showSaveFilePicker) {
          const handle = await window.showSaveFilePicker({
            suggestedName: `${articleName || 'gameData'}.json`,
            types: [{
              description: 'JSON file',
              accept: { 'application/json': ['.json'] },
            }],
          });
    
          const writable = await handle.createWritable();
          await writable.write(jsonContent);
          await writable.close();
    
          alert('File saved successfully ✅');
        } else {
          // ✅ Fallback for Firefox, Safari, etc.
          const blob = new Blob([jsonContent], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
    
          const a = document.createElement('a');
          a.href = url;
          a.download = `${articleName || 'gameData'}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
    
          URL.revokeObjectURL(url);
          alert('File backup downloaded ✅');
        }
      } catch (err) {
        console.error('File save cancelled or failed:', err);
      }
    });
    document.getElementById('change-poster').addEventListener('click', () => {
      if (editButton.textContent === '✔️') {
          inputPoster.click();
      }
    });
    inputPoster.addEventListener('change', function () {
      const reader = new FileReader();
      reader.onload = function(e) {
        const oldPoster = data.poster;
        data.poster = e.target.result;
        const poster = document.getElementById('poster');
        poster.src = data.poster;
        actionManager(poster, data.poster, oldPoster, 'image-change');
      }
      
      reader.readAsDataURL(this.files[0]);
    });
    document.getElementById('main-page-btn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    document.getElementById('articles-toggle-btn').addEventListener('click', function () {
        const articleList = document.getElementById('article-list');
        if (articleList.style.display !== 'block') {
            articleList.style.display = 'block';
            this.textContent = 'Your Articles 🔼';
        } else {
            articleList.style.display = 'none';
            this.textContent = 'Your Articles 🔽';
        }
    });
    document.getElementById('toggle-saves-btn').addEventListener('click', function () {
        const saveList = document.getElementById('save-list');
        if (saveList.style.display !== 'block') {
            saveList.style.display = 'block';
            this.textContent = 'Saves 🔼';
        } else {
            saveList.style.display = 'none';
            this.textContent = 'Saves 🔽';
        }
    });
    document.getElementById('tutorial-page-btn').addEventListener('click', () => {
        window.location.href = 'tutorial.html';
    });
    document.getElementById('article-list').addEventListener('click', handleArticleClick);
    document.getElementById('save-list').addEventListener('click', handleSaveClick);
    document.getElementById('info-list').addEventListener('click', handleCellClick);
    document.getElementById('info-list').addEventListener('input', handleCellInput);
    document.getElementById('row-list').addEventListener('click', handleRowClick);
    document.getElementById('row-list').addEventListener('input', handleRowInput);
    document.getElementById('row-list').addEventListener('change', handleRowChange);
    document.getElementById('intro-input').addEventListener('input', (event) => {
        const element = event.target;
        const elementActions = undoList.filter(undo => undo.element === element);
        const lastText = elementActions.length ? elementActions[elementActions.length - 1].newData : document.getElementById('intro').innerHTML;
        
        actionManager(element, element.innerHTML, lastText, 'text-change');
    });
    document.getElementById('synopsis-text-input').addEventListener('input', (event) => {
        const element = event.target;
        const elementActions = undoList.filter(undo => undo.element === element);
        const lastText = elementActions.length ? elementActions[elementActions.length - 1].newData : document.getElementById('synopsis-text').innerHTML;
        actionManager(element, element.innerHTML, lastText, 'text-change');
    });
});

function toggleUpperToolbar() {
    const upperToolbarBtn = document.getElementById('upper-toolbar-btn');
    const toolbar = document.getElementById('toolbar');
    const container = document.getElementById('container');
    
    if (data.upperToolbar) {
        upperToolbarBtn.innerHTML = '<b>Upper Toolbar: On</b>';
        toolbar.classList.add('top');
        toolbar.classList.remove('bottom');
        if (toolbar.style.display !== 'none') {
            container.classList.toggle('intro-wrapper1');
            container.classList.toggle('intro-wrapper2');
        }
    } else {
        upperToolbarBtn.innerHTML = '<b>Upper Toolbar: Off</b>';
        toolbar.classList.remove('top');
        toolbar.classList.add('bottom');
        if (toolbar.style.display !== 'none') {
            container.classList.toggle('intro-wrapper1');
            container.classList.toggle('intro-wrapper2');
        }
    }
}

function toggleMainInfobox() {
    const mainInfobox = document.getElementById('infobox');
    const infoboxToggleBtn = document.getElementById('infobox-toggle-btn');
    const presetBtn1 = document.getElementById('enable-preset1');
    const presetBtn2 = document.getElementById('enable-preset2');
    if (data.infobox) {
        mainInfobox.style.display = 'table';
        presetBtn1.style.display = 'inline';
        presetBtn2.style.display = 'inline';
        infoboxToggleBtn.innerHTML = `<b>Main Infobox: Show</b>`;
    } else {
        mainInfobox.style.display = 'none';
        presetBtn1.style.display = 'none';
        presetBtn2.style.display = 'none';
        infoboxToggleBtn.innerHTML = `<b>Main Infobox: Hide</b>`;
    }
}

function actionManager(element, newData, oldData, type) {
    let newAction = {};
    if (type === 'text-change') {
        const selectedText = selectedTextBeforeCursor(element);
        const elementActions = undoList.filter(undo => undo.element === element);
        const previousAction = elementActions[elementActions.length - 1];
        if (elementActions.length) {
            const targetText = `${previousAction.tempText.selectedText} `;
            if (selectedText.replace(/\u00A0/g, ' ') === targetText || previousAction.tempText.selectedText.length > selectedText.length || selectedText.length > targetText.length + 13) {
                previousAction.newData = previousAction.tempText.newData;
            } else {
                previousAction.tempText.newData = newData;
                previousAction.tempText.selectedText = selectedText;
                previousAction.newData = newData;
                redoList = [];
                return;
            }
        }
        
        newAction = {
          newData,
          tempText: { 
            newData, 
            selectedText
          },
          oldData,
          type,
          element
        };
    } else if (type === 'element-change') {
        newAction = {
          newData,
          oldData,
          type,
          element
        };
    } else if (type === 'image-change') {
        newAction = {
          newData,
          oldData,
          type,
          element
        };
    };
    undoList.push(newAction);
    
    redoList = [];
}

function selectedTextBeforeCursor(element) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return '';

  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  
  return preCaretRange.toString();
}

function undoManager() {
    const previousAction = undoList.pop();
    let type;
    if (!previousAction) return;
    let element = previousAction.element;
    type = previousAction.type;
    
    if (type === 'text-change') {
        element.innerHTML = previousAction.oldData;
    } else if (type === 'element-change') {
        const newArray = previousAction.newData;
        const oldArray = previousAction.oldData;
        previousAction.newData = JSON.parse(JSON.stringify(newArray));
        previousAction.oldData = newArray;
        
        newArray.length = 0;
        newArray.push(...oldArray);
        if (element) {
            loadState(element);
        } else {
            loadState(true);
        }
    } else if (type === 'image-change') {
            element.src = previousAction.oldData;
    }
    redoList.push(previousAction);
}

function redoManager() {
    const previousAction = redoList.pop();
    if (!previousAction) return;
    const element = previousAction.element;
    const type = previousAction.type;
    
    if (type === 'text-change') {
        element.innerHTML = previousAction.newData;
    } else if (type === 'element-change') {
        const newArray = previousAction.newData;
        const oldArray = previousAction.oldData;
        previousAction.oldData = JSON.parse(JSON.stringify(oldArray));
        previousAction.newData = oldArray;
        
        oldArray.length = 0;
        oldArray.push(...newArray);
        if (element) {
            loadState(element);
        } else {
            loadState(true);
        }
    } else if (type === 'image-change') {
        element.src = previousAction.newData;
    }
    undoList.push(previousAction);
}

function toggleTable(tableId, button) {
    let isVisible = getComputedStyle(button).backgroundImage.includes('https://i.ibb.co/s91K27m8/20251024-091953.png');
    var table = document.getElementById(tableId);
    const rowNodes = document.querySelectorAll('.row-wrapper');
    
    if (!isVisible) {
        table.style.display = 'block';
        button.style.backgroundImage = 'url(https://i.ibb.co/s91K27m8/20251024-091953.png)';
        let toggleCategoryBtn;
        
        rowNodes.forEach(node => {
            const index = node.getAttribute('data-index');
            const row = rows.find(row => row.id == index);
            
            if (row.type === 'category') {
                toggleCategoryBtn = getComputedStyle(node.querySelector('.toggle-category-btn')).backgroundImage;
            } else if (toggleCategoryBtn && toggleCategoryBtn.includes('https://i.ibb.co/6q919Xb/20251024-055350.png')) {
                node.style.display = 'none';
            }
        });
    } else {
        table.style.display = 'none';
        button.style.backgroundImage = 'url(https://i.ibb.co/6q919Xb/20251024-055350.png)';
    }
}

// Styling texts
function styleText(type, imgSrc) {
    const selection = window.getSelection();
    
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const parentNode = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentNode;
        const selectedText = range.toString();

        if (selectedText.length > 0) {
            let tag, openingTag, closingTag, href;

            tag = type;
            
            if (parentNode.nodeName.toLowerCase() === tag || parentNode.closest(tag)) {
                const prevText = currentTextArea.innerHTML;
                if (tag === 'ul') {
                    const tagElement = parentNode.closest(tag);
                    const listItems = Array.from(tagElement.querySelectorAll('li'));
                    
                    listItems.forEach(li => {
                        const textNode = document.createTextNode(li.textContent);
                      
                        tagElement.parentNode.insertBefore(textNode, tagElement);
                        
                        tagElement.parentNode.insertBefore(document.createTextNode(' '), tagElement);
                    });
                    
                    tagElement.remove();
                    return;
                } else {
                    const tagElement = parentNode;
                    while (tagElement.firstChild) {
                        tagElement.parentNode.insertBefore(tagElement.firstChild, tagElement);
                    }
                    tagElement.remove();
                }
                
                const lastAction = undoList.length ? undoList[undoList.length - 1] : null;
                const lastText = (lastAction && lastAction.parentId === currentTextArea.id) ? lastAction.updatedText : prevText;
                
                const newAction = {
                  newData: currentTextArea.innerHTML,
                  oldData: lastText,
                  type: 'text-change',
                  element: currentTextArea
                };
                undoList.push(newAction);
                return;
            } else {
                if (tag === 'a') {
                    href = prompt('Enter the URL', 'https://');
                    openingTag = `<${tag} href="${href}">`;
                    closingTag = `</${tag}>`;
                } else if (tag === 'img') {
                    href = prompt('Enter the URL', 'https://');
                    let imgSize = prompt('Enter the image size');
                    if (!imgSize) {
                      imgSize = '100%';
                    }
                    openingTag = `<img src="${href}" alt="${selectedText}" width="${imgSize}">`;
                } else if (tag === 'img2') {
                    href = imgSrc;
                    let imgSize = prompt('Enter the image size');
                    if (!imgSize) {
                      imgSize = '100%';
                    }
                    openingTag = `<img src="${href}" alt="${selectedText}" width="${imgSize}">`;
                } else if (tag === 'ul') {
                    const items = selectedText.split(/\r?\n|,\s*|\s+/);
                    const listItems = items.map(item => `<li>${item}</li>`).join('');
                    openingTag = `<${tag}>${listItems}</${tag}>`;
                } else {
                    openingTag = `<${tag}>`;
                    closingTag = `</${tag}>`;
                }
                const newText = closingTag ? openingTag + selectedText + closingTag : openingTag ;
                const fragment = range.createContextualFragment(newText);
                
                range.deleteContents();
                range.insertNode(fragment);
            }
            
            selection.removeAllRanges();
            selection.addRange(range);
            
            currentTextArea.dispatchEvent(new Event('input'));
        } else {
            alert('Select text for styling');
        }
    } else {
        alert('Select text for styling');
    }
}

function toggleSettings() {
    const settings = document.getElementById('settings');
    
    if (settings.style.display === 'none') {
        settings.style.display = 'block';
    } else {
        settings.style.display = 'none';
    }
}

// Generates rows for the main Infobox
function generateCell(templateId, text) {
    const template = document.getElementById(templateId).content.cloneNode(true);
    const newId = Date.now();
    const newPosition = cells.length ? cells[cells.length - 1].position + 1 : 0;
    const oldCells = JSON.parse(JSON.stringify(cells));

    const newCell = {
        id: newId,
        text1: text ? text : 'Write here',
        text2: templateId === 'info-template' ? 'Write here' : null,
        articleId: currentArticleId,
        position: newPosition
    };
    cells.push(newCell);
    
    updateCell(template, newCell);
    const element = template.querySelector('.info-wrapper');
    document.getElementById('info-list').appendChild(template);
    actionManager(element, cells, oldCells, 'element-change');
}

function updateCell(template, cell) {
    const cellNode = template.querySelector('.info-wrapper') || template;
    if (!cellNode.dataset.index) {
        cellNode.setAttribute('data-index', cell.id);
        cellNode.querySelector('.info-title').innerHTML = cell.text1;
        cellNode.querySelector('.info-input').innerHTML = cell.text1;
        const infoTitle = cellNode.querySelector('.info-title');
        const infoInput = cellNode.querySelector('.info-input');
        infoInput.addEventListener('focus', function(event) {
            currentTextArea = event.target;
        });
        if (cell.text2) {
            cellNode.querySelector('.value-cell').innerHTML = cell.text2;
            cellNode.querySelector('.value-input').innerHTML = cell.text2;
            const valueCell = cellNode.querySelector('.value-cell');
            const valueInput = cellNode.querySelector('.value-input');
            valueInput.addEventListener('focus', function(event) {
                currentTextArea = event.target;
            });
        }
    }
}

function editArticle() {
    const controlRoom = document.querySelectorAll('.control-room');
    const toolbar = document.getElementById('toolbar');
    const mainInfobox = document.getElementById('infobox');
    const title = document.getElementById('title');
    const introText = document.getElementById('intro');
    const synopsisText = document.getElementById('synopsis-text');
    const titleInput = document.getElementById('title-input');
    const poster = document.getElementById('poster');
    const articleTitle = document.querySelector(`.article-section[data-id="${currentArticleId}"]`).querySelector('.article-title');
    const introInput = document.getElementById('intro-input');
    const synopsisInput = document.getElementById('synopsis-text-input');
    const container = document.getElementById('container');
    const rowList = document.getElementById('row-list');
    const editMode = editButton.textContent === '✏️';
    
    if (db) {
        if (editMode) {
            if (getComputedStyle(toggleSynopsisBtn).backgroundImage.includes('https://i.ibb.co/6q919Xb/20251024-055350.png')) {
                toggleSynopsisBtn.click();
            }
            if (getComputedStyle(toggleInfoboxBtn).backgroundImage.includes('https://i.ibb.co/6q919Xb/20251024-055350.png')) {
                toggleInfoboxBtn.click();
            }
            controlRoom.forEach(room => {
                room.style.display = 'block';
            });
            if (data.upperToolbar) {
                container.classList.
                toggle('intro-wrapper1');
                container.classList.toggle('intro-wrapper2');
            } else {
                rowList.classList.toggle('row-list-edit-mode');
            }
            mainInfobox.classList.toggle('cell-edit-mode');
            toolbar.style.display = '';
            titleInput.value = title.textContent;
            introInput.innerHTML = introText.innerHTML;
            synopsisInput.innerHTML = synopsisText.innerHTML;
            introInput.style.display = 'block';
            synopsisInput.style.display = 'block';
            introText.style.display = 'none';
            synopsisText.style.display = 'none';
            editButton.textContent = '✔️';
            editRow(editMode);
            editMainInfobox(editMode);
        } else {
            controlRoom.forEach(room => {
                room.style.display = 'none';
            });
            if (data.upperToolbar) {
                container.classList.toggle('intro-wrapper1');
                container.classList.toggle('intro-wrapper2');
            } else {
                rowList.classList.toggle('row-list-edit-mode');
            }
            mainInfobox.classList.toggle('cell-edit-mode');
            data.title = titleInput.value;
            articleTitle.textContent = data.title;
            data.intro = introInput.innerHTML;
            data.poster = poster.src;
            data.synopsis = synopsisInput.innerHTML;
            title.textContent = data.title;
            introText.innerHTML = data.intro;
            synopsisText.innerHTML = data.synopsis;
            introInput.style.display = 'none';
            synopsisInput.style.display = 'none';
            introText.style.display = 'block';
            synopsisText.style.display = 'block';
            toolbar.style.display = 'none';
            editButton.textContent = '✏️';
            assignCategoriesToRows();
            editRow(editMode);
            editMainInfobox(editMode);
            saveState(6);
        }
    }
}

function assignCategoriesToRows() {
  let currentCategoryId = null;
  let currentSubCategoryId = null;
  const rowNodes = document.querySelectorAll('.row-wrapper');
  rows.sort((a, b) => a.position - b.position);

  rows.forEach((row, i) => {
      if (row.type === "category") {
          currentCategoryId = row.id;
          currentSubCategoryId = null;
      } else if (row.type === "sub-category") {
          currentSubCategoryId = row.id;
          row.category = currentCategoryId;
          rowNodes[i].dataset.category = currentCategoryId;
      } else {
          row.category = currentCategoryId;
          row.subCategory = currentSubCategoryId;
          rowNodes[i].dataset.category = currentCategoryId;
          rowNodes[i].dataset.subCategory = currentSubCategoryId;
      }
  });
}

function editRow(editMode) {
    const rowNodes = document.querySelectorAll('.row-wrapper');
    if (!rowNodes) return;
    
    rowNodes.forEach(node => {
        const nameText = node.querySelector('.infobox-name');
        const nameInput = node.querySelector('.name-input');
        const infoboxImg = node.querySelector('.infobox-img');
        const bioText = node.querySelector('.infobox-bio-text');
        const bioInput = node.querySelector('.bio-input');
        const presetBtn = node.querySelector('.generate-preset-btn');
        const index = node.getAttribute('data-index');
        const row = rows.find(row => row.id == index);
        const toggleCategoryBtn = node.querySelector('.toggle-category-btn');
        const isCategoryVisible = toggleCategoryBtn ? getComputedStyle(toggleCategoryBtn).backgroundImage.includes('https://i.ibb.co/s91K27m8/20251024-091953.png') : null;
          
        if (editMode) {
            if (row.type === 'category') {
                if (!isCategoryVisible) {
                    toggleCategoryBtn.click();
                }
            }
            node.classList.toggle('row-edit-mode');
            if (nameText) {
              nameInput.value = nameText.textContent;
            }
            
            if (bioText) {
              bioInput.innerHTML = bioText.innerHTML;
            }
            if (presetBtn) {
                editSection(node, row, editMode);
            }
        } else {
            node.classList.toggle('row-edit-mode');
            if (nameText) {
                if (nameInput.value.trim()) {
                    row.name = nameInput.value;
                    nameText.textContent = nameInput.value;
                }
            }
            
            if (infoboxImg) {
                row.imgSrc = infoboxImg.src;
            }
            
            if (bioText) {
                if (bioInput.innerHTML.trim()) {
                    row.bio = bioInput.innerHTML;
                    bioText.innerHTML = bioInput.innerHTML;
                }
            }
            if (presetBtn) {
                editSection(node, row, editMode);
            }
        }
        
        if (row.type === 'table') {
            const miniRows = row.miniRows;
            const rowDelete2Wrapper = node.querySelector('.row2-wrapper');
            
            miniRows.forEach(miniRow => {
                const miniRowNode = node.querySelector(`.mini-row-wrapper[data-index="${miniRow.id}"]`);
                editTableData(miniRowNode, miniRow, editMode);
            });
        }
    });
}

function editTableData(rowElement, row, editMode) {
    const dataWrappers = rowElement.querySelectorAll('.data-wrapper');
    const rowDeleteBtns = rowElement.querySelectorAll('.row-delete-wrapper')
    const tableData = row.data;
    
    if (dataWrappers) {
        dataWrappers.forEach(wrapper => {
            const infoTitle = wrapper.querySelector('.info-title');
            const inputWrapper = wrapper.querySelector('.cell-input-wrapper');
            const infoInput = wrapper.querySelector('.info-input');
            const index = wrapper.dataset.index;
            const currentData = tableData.find(el => el.id == index);
            
            
            if (editMode) {
                infoInput.innerHTML = infoTitle.innerHTML;
            } else {
                currentData.text = infoInput.innerHTML;
                /* if (!infoInput.textContent.trim()) {
                    const wrapper = infoInput.closest('.info-wrapper');
                    deleteElement(section, cell, 'section');
                } else {
                    infoTitle.innerHTML = cell.text1;
                    valueCell.innerHTML = cell.text2;
                } */
                infoTitle.innerHTML = currentData.text;
            }
        });
    }
}

function editSection(row, infobox, editMode) {
    const sectionWrappers = row.querySelectorAll('.section-wrapper');
    let sections = infobox.sections;
    
    if (sectionWrappers) {
        sectionWrappers.forEach(section => {
            const rowDeleteCell = section.querySelector('.row-delete-cell');
            const rowCell1 = section.querySelector('.infobox-cell1');
            const rowCell3 = section.querySelector('.infobox-cell3');
            const infoTitle = section.querySelector('.info-title');
            const valueCell = section.querySelector('.value-cell');
            const inputWrapper = section.querySelectorAll('.cell-input-wrapper');
            const textWrapper = section.querySelectorAll('.cell-text');
            const infoInput = section.querySelector('.info-input');
            const valueInput = section.querySelector('.value-input');
            const index = infoTitle.closest('.section-wrapper').getAttribute('data-index');
            let cell = sections.find(el => el.id == index);
            
            if (editMode) {
                infoInput.innerHTML = infoTitle.innerHTML;
                if (!rowCell3) {
                    valueInput.innerHTML = valueCell.innerHTML;
                }
            } else {
                cell.text1 = infoInput.innerHTML;
                infoTitle.innerHTML = cell.text1;
                if (!rowCell3) {
                    cell.text2 = valueInput.innerHTML;
                    valueCell.innerHTML = cell.text2;
                }
            }
        });
    }
}

function editMainInfobox(editMode) {
    const infoWrappers = document.querySelectorAll('.info-wrapper');
    
    if (infoWrappers) {
        infoWrappers.forEach(info => {
            const infoTitle = info.querySelector('.info-title');
            const valueCell = info.querySelector('.value-cell');
            const inputWrapper = info.querySelectorAll('.cell-input-wrapper');
            const textWrapper = info.querySelectorAll('.cell-text');
            const cell1 = info.querySelector('.cell1');
            const cell2 = info.querySelector('.cell2');
            const cell3 = info.querySelector('.cell3');
            const infoInput = info.querySelector('.info-input');
            const valueInput = info.querySelector('.value-input');
            const index = infoTitle.closest('.info-wrapper').getAttribute('data-index');
            const cell = cells.find(el => el.id == index);
            
            if (editMode) {
                if (!cell3) {
                    valueInput.innerHTML = valueCell.innerHTML;
                }
                infoInput.innerHTML = infoTitle.innerHTML;
            } else {
                if (cell3) {
                    cell.text1 = infoInput.innerHTML;
                    if (!infoInput.textContent.trim()) {
                        const wrapper = infoInput.closest('.info-wrapper');
                        deleteElement(wrapper, cell, cells, 'cell');
                    } else {
                        infoTitle.innerHTML = cell.text1;
                    }
                } else {
                    cell.text1 = infoInput.innerHTML;
                    cell.text2 = valueInput.innerHTML;
                    if (!infoInput.textContent.trim() && !valueInput.textContent.trim()) {
                        const wrapper = infoInput.closest('.info-wrapper');
                        deleteElement(wrapper, cell, cells, 'cell');
                    } else {
                        infoTitle.innerHTML = cell.text1;
                        valueCell.innerHTML = cell.text2;
                    }
                }
            }
        });
    }
}

function handleArticleClick(event) {
    const target = event.target;
    const article = target.closest('.article-section');
    console.log(target);
    
    if (editButton.textContent === '✔️') {
        editButton.click();
    }
    currentArticleId = Number(article.dataset.id);
    document.getElementById('article-list').innerHTML = '';
    document.getElementById('row-list').innerHTML = '';
    document.getElementById('info-list').innerHTML = '';
    loadState();
}

function handleSaveClick(event) {
    console.log('w');
    const target = event.target;
    const section = target.closest('.save-state-section');
    const previousSave = previousSaves.find(save => save.id == section.dataset.id);
    
    data = previousSave.data;
    rows = previousSave.rows;
    cells = previousSave.cells;
    loadState(true);
}

function handleCellClick(event) {
    const target = event.target;
    const row = target.closest('.info-wrapper');
    const index = row ? row.dataset.index : null;
    const cell = cells.find(el => el.id == index);
    
    if (target.classList.contains('cell-up-btn')) {
        moveCell(row, cell, 'up');
    } else if (target.classList.contains('cell-down-btn')) {
        moveCell(row, cell, 'down');
    } else if (target.classList.contains('row-delete-btn')) {
        deleteElement(row, cell, cells, 'cell');
    }
}

function handleCellInput(event) {
    const element = event.target;
    const cellNode = element.closest('.info-wrapper');
    const index = cellNode.dataset.index;
    const cell = cells.find(cell => cell.id == index);
    
    if (element.classList.contains('info-input')) {
        const infoText = cellNode.querySelector('.info-title');
        const elementActions = undoList.filter(undo => undo.element === element);
        const lastText = elementActions.length ? elementActions[elementActions.length - 1].newData : infoText.innerHTML;
        
        actionManager(element, element.innerHTML, lastText, 'text-change');
    } else if (element.classList.contains('value-input')) {
        const valueText = cellNode.querySelector('.value-cell');
        const elementActions = undoList.filter(undo => undo.element === element);
        const lastText = elementActions.length ? elementActions[elementActions.length - 1].newData : valueText.innerHTML;
        
        actionManager(element, element.innerHTML, lastText, 'text-change');
    }
}

function handleRowClick(event) {
    const target = event.target;
    const rowNode = target.closest('.row-wrapper');
    const index = rowNode ? rowNode.dataset.index : null;
    const row = rows.find(char => char.id == index);

    if (target.classList.contains('upload-img-btn')) {
        const imgBtn = rowNode.querySelectorAll('.infobox-img-btn');
      
        imgBtn.forEach(button => {
            if (getComputedStyle(button).display.includes('none')) {
              button.style.display = 'inline-flex';
            } else {
              button.style.display = 'none';
            }
        });
    } else if (target.classList.contains('img-file-btn')) {
        rowNode.querySelector('.upload-img').click();
    } else if (target.classList.contains('img-link-btn')) {
        loadImage(null, row);
    } else if (target.classList.contains('move-up-btn')) {
        moveInfobox(rowNode, row, 'up');
    } else if (target.classList.contains('move-down-btn')) {
        moveInfobox(rowNode, row, 'down');
    } else if (target.classList.contains('cell-up-btn')) {
        const section = target.closest('.section-wrapper');
        moveSection(section, row, 'up');
    } else if (target.classList.contains('cell-down-btn')) {
        const section = target.closest('.section-wrapper');
        moveSection(section, row, 'down');
    } else if (target.classList.contains('see-more-btn')) {
        toggleBio(rowNode);
    } else if (target.classList.contains('copy-row-btn')) {
        generateRow(rowNode, row, 'copy');
    } else if (target.classList.contains('delete-btn')) {
        const className = rowNode.classList[0];
        const type = className.replace('-wrapper', '');
        deleteElement(rowNode, row, rows, type);
    } else if (target.classList.contains('add-section-btn')) {
        generateSection('section-template', rowNode, row, null);
    } else if (target.classList.contains('add-section-btn2')) {
        generateSection('section-template2', rowNode, row, null);
    } else if (target.classList.contains('generate-preset-btn')) {
        presetGenerateSection(rowNode, row);
    } else if (target.classList.contains('toggle-category-btn')) {
        toggleCategory(rowNode, row);
    } else if (target.classList.contains('add-sub-cat-btn')) {
        generateRow(rowNode, row, 'sub-category');
    } else if (target.classList.contains('add-infobox-btn2')) {
        generateRow(rowNode, row, 'infobox');
    } else if (target.classList.contains('add-text-btn2')) {
        generateRow(rowNode, row, 'text-area');
    } else if (target.classList.contains('add-table-btn2')) {
        generateRow(rowNode, row, 'table');
    }else if (target.classList.contains('add-row-btn')) {
        generateMiniRow(rowNode, row);
    } else if (target.classList.contains('add-data-btn')) {
        generateTableData(rowNode, row);
    } else if (target.classList.contains('section-delete-btn')) {
        const sectionNode = target.closest('.section-wrapper');
        const sections = row.sections;
        const index = sectionNode.dataset.index;
        const section = sections.find(a => a.id == index);
        deleteElement(sectionNode, section, sections, 'section');
    } else if (target.classList.contains('row-delete-btn')) {
        const miniRowNode = target.closest('.mini-row-wrapper');
        const miniRows = row.miniRows;
        const index = miniRowNode.dataset.index;
        const miniRow = miniRows.find(r => r.id == index);
        deleteElement(miniRowNode, miniRow, miniRows, 'mini row');
    } else if (target.classList.contains('row-delete2-btn')) {
        if (confirm('Are you sure you want to delete these cells?')) {
            deleteElement(target, row, null, 'table data');
        }
    } else if (target.classList.contains('row-up-btn')) {
        const miniRowNode = target.closest('.mini-row-wrapper');
        moveMiniRow(miniRowNode, row, 'up');
    } else if (target.classList.contains('row-down-btn')) {
        const miniRowNode = target.closest('.mini-row-wrapper');
        moveMiniRow(miniRowNode, row, 'down');
    } else if (target.classList.contains('row-left-btn')) {
        const rowDelete2Btn = target.parentNode.querySelector('.row-delete2-btn');
        const index = rowDelete2Btn.dataset.index;
        moveTableData(rowNode, row, index, 'left');
    } else if (target.classList.contains('row-right-btn')) {
        const rowDelete2Btn = target.parentNode.querySelector('.row-delete2-btn');
        const index = rowDelete2Btn.dataset.index;
        moveTableData(rowNode, row, index, 'right');
    } else if (target.classList.contains('toggle-add-btn2')) {
        const addBtn = rowNode.querySelectorAll('.row-add-btn2');
        
        addBtn.forEach(button => {
            if (getComputedStyle(button).display.includes('none')) {
                button.style.display = 'inline-flex';
            } else {
                button.style.display = 'none';
            }
        });
    }
}

function allignRows() {
    const rowNodes = document.querySelectorAll('.row-wrapper');
          
    rowNodes.forEach((node, i) => {
        const row = rows.find(row => row.id == node.dataset.index);
        row.position = i;
    });
    rows.sort((a, b) => a.position - b.position);
}

function handleRowInput(event) {
    const element = event.target;
    const rowNode = element.closest('.row-wrapper');
    const index = rowNode.dataset.index;
    const row = rows.find(row => row.id == index);
    
    if (element.classList.contains('bio-input')) {
        const bio = element.parentNode.querySelector('.infobox-bio-text');
        const elementActions = undoList.filter(undo => undo.element === element);
        const lastText = elementActions.length ? elementActions[elementActions.length - 1].newData : bio.innerHTML;
        
        actionManager(element, element.innerHTML, lastText, 'text-change');
    } else if (element.classList.contains('info-input')) {
        const infoText = element.parentNode.parentNode.querySelector('.info-title');
        const elementActions = undoList.filter(undo => undo.element === element);
        const lastText = elementActions.length ? elementActions[elementActions.length - 1].newData : infoText.innerHTML;
        
        actionManager(element, element.innerHTML, lastText, 'text-change');
    } else if (element.classList.contains('value-input')) {
        const valueText = element.parentNode.parentNode.querySelector('.value-cell');
        const elementActions = undoList.filter(undo => undo.element === element);
        const lastText = elementActions.length ? elementActions[elementActions.length - 1].newData : valueText.innerHTML;
        
        actionManager(element, element.innerHTML, lastText, 'text-change');
    }
}

function handleRowChange(event) {
    const target = event.target;
    const rowNode = target.closest('.row-wrapper');
    const index = rowNode ? rowNode.dataset.index : null;
    const row = rows.find(row => row.id == index);

    if (target.classList.contains('upload-img')) {
        const type = target.getAttribute('data-type');
        loadImage(event, row);
    }
}

function toggleCategory(catNode, category) {
    let id = category.id;
    let toggleButton = catNode.querySelector('.toggle-category-btn');
    let isVisible = getComputedStyle(toggleButton).backgroundImage.includes('https://i.ibb.co/s91K27m8/20251024-091953.png');
    const rowNodes = document.querySelectorAll('.row-wrapper');
    
    rowNodes.forEach(node => {
        const index = node.dataset.index;
        const row = rows.find(row => row.id == index);
        
        if (row.category === id) {
            if (isVisible) {
                node.style.display = 'none';
            } else {
                node.style.display = '';
            }
        }
    });
    
    if (isVisible) {
        toggleButton.style.backgroundImage = 'url(https://i.ibb.co/6q919Xb/20251024-055350.png)';
    } else {
        toggleButton.style.backgroundImage = 'url(https://i.ibb.co/s91K27m8/20251024-091953.png)';
    }
}

// generates rows
function generateRow(elementNode, element, type) {
    let template;
    let isClone;
    let firstRow;
    let clones = [];
    const oldRows = JSON.parse(JSON.stringify(rows));
    const newId = Date.now();
    if (type === 'copy') {
        type = element.type;
        isClone = true;
        template = document.getElementById(`${type}-template`).content.cloneNode(true);
        const clone = JSON.parse(JSON.stringify(element));
        clone.id = newId;
        updateRow(template, clone, type, isClone);
        if (type === 'category' || 'sub-category') {
            let childRows;
            let childRowNodes;
            if (type === 'category') {
                childRows = rows.filter(row => row.category === element.id);
                childRowNodes = document.querySelectorAll(`.row-wrapper[data-category="${element.id}"]`);
            } else {
                childRows = rows.filter(row => row.subCategory === element.id);
                childRowNodes = document.querySelectorAll(`.row-wrapper[data-sub-category="${element.id}"]`);
            }
            firstRow = childRowNodes[childRowNodes.length - 1];
            childRows.forEach(row => {
                const cloneTemplate = document.getElementById(`${row.type}-template`).content.cloneNode(true);
                clones.push({ element: cloneTemplate, row: JSON.parse(JSON.stringify (row)) });
            });
        } else {
            firstRow = elementNode.nextElementSibling;
        }
    } else {
        template = document.getElementById(`${type}-template`).content.cloneNode(true);
        
        if (element) {
            firstRow = elementNode.nextElementSibling;
        } else {
            firstRow = document.querySelector(`.row-wrapper[data-index="${rows[0]?.id}"]`) || null;
        }
        isClone = false;
        updateRow(template, element, type, isClone);
    }
    
    const rowElement = template.querySelector('.row-wrapper');
    
    if (firstRow) {
        if (clones.length) {
            firstRow.parentNode.insertBefore(template, firstRow.nextElementSibling);
            firstRow = rowElement;
            clones.forEach((clone, i) => {
                const cloneNode = clone.element.querySelector('.row-wrapper');
                clone.row.id = newId + i + 1;
                if (type === 'category') {
                    clone.row.category = newId;
                } else if (type === 'sub-category') {
                    clone.row.subCategory = newId;
                }
                updateRow(cloneNode, clone.row, clone.row.type, true);
                clone.element = cloneNode;
                firstRow.parentNode.insertBefore(cloneNode, firstRow.nextElementSibling);
                firstRow = cloneNode;
            });
            clones = clones.map(clone => clone.element);
            clones.push(rowElement);
        } else {
            firstRow.parentNode.insertBefore(template, firstRow);
        }
    } else {
        document.getElementById('row-list').appendChild(template);
    }
    allignRows();
    if (!clones.length) {
        actionManager(rowElement, rows, oldRows, 'element-change');
    } else {
        actionManager(clones, rows, oldRows, 'element-change');
    }
} 

function updateRow(template, row, type, isClone) {
    const newId = Date.now();
    let newRow;
    let categoryId = null;
    let subCategoryId = null;
    if (row?.type === 'category') {
        categoryId = row.id;
    } else if (row?.type === 'sub-category') {
        categoryId = row.category;
        subCategoryId = row.id;
    }
    
    if (type === 'category') {
        if (isClone) {
            newRow = row;
        } else {
            newRow = {
                id: newId,
                name: 'Category No.' + (rows.length ? rows.length + 1 : 1),
                type: 'category',
                position: 0
            };
        }
        rows.push(newRow);
        updateCategory(template, newRow);
    } else if (type === 'sub-category') {
        if (isClone) {
            newRow = row;
        } else {
            newRow = {
                id: newId,
                name: 'Sub Category No.' + (rows.length ? rows.length + 1 : 1),
                type: 'sub-category',
                category: categoryId,
                position: 0
            };
        }
        rows.push(newRow);
        updateSubCategory(template, newRow);
    } else if (type === 'infobox') {
        if (isClone) {
            newRow = row;
            newRow.sections.forEach(arr => {
                arr.parentId = newRow.id;
            });
        } else {
            newRow = {
                id: newId,
                name: 'Infobox No.' + (rows.length ? rows.length + 1 : 1),
                bio: 'Write description about the subject here...',
                imgSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/660px-No-Image-Placeholder.svg.png?20200912122019',
                type: 'infobox',
                category: categoryId,
                subCategory: subCategoryId,
                sections: [],
                position: 0
            };
        }
        rows.push(newRow);
        updateInfobox(template, newRow, []);
    } else if (type === 'text-area') {
        if (isClone) {
            newRow = row;
        } else {
            newRow = {
                id: newId,
                bio: 'Write description about the subject here...',
                type: 'text-area',
                category: categoryId,
                subCategory: subCategoryId,
                position: 0
            };
        }
        rows.push(newRow);
        updateTextArea(template, newRow);
    } else if (type === 'table') {
        if (isClone) {
            newRow = row;
            newRow.miniRows.forEach(row => {
                row.parentId = newRow.id;
                row.data.forEach(tableData => {
                    tableData.parentId = row.id + '-' + row.parentId;
                });
            });
        } else {
            newRow = {
                id: newId,
                type: 'table',
                category: categoryId,
                subCategory: subCategoryId,
                miniRows: [],
                position: 0
            };
        }
        rows.push(newRow);
        updateTable(template, newRow, []);
    }
}

function updateCategory(row, category) {
    const editMode = editButton.textContent === '✔️';
    const categoryNode = row.querySelector('.row-wrapper') || row;
    
    if (!categoryNode.dataset.index) {
        row.querySelector('.row-wrapper').dataset.index = category.id;
        const editorWrapper = categoryNode.querySelector('.row-controls');
        const name = categoryNode.querySelector('.infobox-name');
        const nameInput = categoryNode.querySelector('.name-input');
        if (editMode) {
            categoryNode.querySelector('.toggle-category-btn').style.backgroundImage = 'url(https://i.ibb.co/s91K27m8/20251024-091953.png)';
            categoryNode.classList.add('row-edit-mode');
            nameInput.value = category.name;
        } else {
            categoryNode.classList.remove('row-edit-mode');
            name.textContent = category.name;
        }
    }
}

function updateSubCategory(row, subCategory) {
    const editMode = editButton.textContent === '✔️';
    const subCatNode = row.querySelector('.row-wrapper') || row;
    
    if (!subCatNode.dataset.index) {
        subCatNode.dataset.index = subCategory.id;
        subCatNode.dataset.category = subCategory.category;
        const editorWrapper = subCatNode.querySelector('.row-controls');
        const name = subCatNode.querySelector('.infobox-name');
        const nameInput = subCatNode.querySelector('.name-input');
        if (editMode) {
            subCatNode.classList.add('row-edit-mode');
            nameInput.value = subCategory.name;
        } else {
            subCatNode.classList.remove('row-edit-mode');
            name.textContent = subCategory.name;
        }
    }
}

function updateInfobox(row, infobox, oldElements) {
    const infoboxNode = row.querySelector('.row-wrapper') || row;
    
    if (!infoboxNode.dataset.index) {
        infoboxNode.dataset.index = infobox.id;
        infoboxNode.dataset.category = infobox.category;
        infoboxNode.dataset.subCategory = infobox.subCategory;
        const name = infoboxNode.querySelector('.infobox-name');
        const bio = infoboxNode.querySelector('.infobox-bio-text');
        const nameInput = infoboxNode.querySelector('.name-input');
        const bioInput = infoboxNode.querySelector('.bio-input');
        
        const editMode = editButton.textContent === '✔️';
        
        if (editMode) {
            infoboxNode.querySelector('.control-room').style.display = 'block';
            infoboxNode.classList.add('row-edit-mode');
            nameInput.value = infobox.name;
            bioInput.innerHTML = infobox.bio;
        } else {
            infoboxNode.classList.remove('row-edit-mode');
            name.textContent = infobox.name;
            bio.innerHTML = infobox.bio;
        }
        infoboxNode.querySelector('.infobox-img').src = infobox.imgSrc;
    } else {
        const sectionNodes = row.querySelectorAll('.section-wrapper');
        oldElements.push(...sectionNodes);
    }
    const sections = infobox.sections;
    if (sections) {
        sections.sort((a, b) => a.position - b.position);
        sections.forEach(section => {
            let template = oldElements.find(node => node.dataset.index == section.id && node.dataset.parentId == section.parentId);
            if (template) {
                oldElements.splice(oldElements.indexOf(template), 1);
            } else {
                if (section.text2) {
                    template = document.getElementById('section-template').content.cloneNode(true);
                } else {
                    template = document.getElementById('section-template2').content.cloneNode(true);
                }
            }
            updateSection(template, section);
            const rowDeleteCell = template.querySelector('.row-delete-cell');
            row.querySelector('.section-lists').appendChild(template);
        });
    }
}

function updateTextArea(row, textArea) {
    const editMode = editButton.textContent === '✔️';
    const textAreaNode = row.querySelector('.row-wrapper') || row;
    
    if (!textAreaNode.dataset.index) {
        textAreaNode.dataset.index = textArea.id;
        textAreaNode.dataset.category = textArea.category;
        textAreaNode.dataset.subCategory = textArea.subCategory;
        const editorWrapper = textAreaNode.querySelector('.row-controls');
        const bio = row.querySelector('.infobox-bio-text');
        const bioInput = textAreaNode.querySelector('.bio-input');
        if (editMode) {
            textAreaNode.classList.add('row-edit-mode');
            bioInput.innerHTML = textArea.bio;
        } else {
            textAreaNode.classList.remove('row-edit-mode');
            bio.innerHTML = textArea.bio;
        }
    }
}

function updateTable(template, table, oldElements) {
    const tableNode = template.querySelector('.row-wrapper') || template;
    
    if (!tableNode.dataset.index) {
        tableNode.dataset.index = table.id;
        tableNode.dataset.category = table.category;
        tableNode.dataset.subCategory = table.subCategory;
        
        const editMode = editButton.textContent === '✔️';
        
        if (editMode) {
            tableNode.classList.add('row-edit-mode');
        } else {
            tableNode.classList.remove('row-edit-mode');
        }
        const rowDelete2Template = document.getElementById('row2-template').content.cloneNode(true);
        tableNode.querySelector('.table-body').appendChild(rowDelete2Template);
    } else {
        const rowNodes = tableNode.querySelectorAll('.mini-row-wrapper');
        oldElements.push(...rowNodes);
    }
    const miniRows = table.miniRows;
    let firstRow = true;
    if (miniRows) {
        miniRows.sort((a, b) => a.position - b.position);
        miniRows.forEach(row => {
            let template = oldElements ? oldElements.find(node => node.dataset.index == row.id && node.dataset.parentId == table.id) : null;
            if (template) {
                oldElements.splice(oldElements.indexOf(template), 1);
            } else {
                template = document.getElementById('row-template').content.cloneNode(true);
            }
            updateMiniRow(template, row, oldElements);
            tableNode.querySelector('.table-body').appendChild(template);
        });
        const rowDelete2Wrapper = tableNode?.querySelector('.row2-wrapper');
        const rowDelete2Btns = rowDelete2Wrapper?.querySelectorAll('.row-delete2-wrapper');
        rowDelete2Btns?.forEach(btn => btn.remove());
        miniRows[0]?.data?.forEach(cell => {
            const rowDelete2Btn = document.getElementById('row-delete2-template').content.cloneNode(true);
            rowDelete2Btn.querySelector('.row-delete2-btn').setAttribute('data-index', cell.position);
            rowDelete2Wrapper.appendChild(rowDelete2Btn);
        });
    }
}

function generateMiniRow(row, table) {
    const miniRows = table.miniRows;
    const isClone = miniRows.length ? true : false;
    const newId = Date.now();
    const newPosition = miniRows.length ? miniRows[miniRows.length - 1].position + 1 : 0;
    const oldRows = JSON.parse(JSON.stringify(rows));
    const template = document.getElementById('row-template').content.cloneNode(true);
    let newRow;
    if (!isClone) {
        
        newRow = {
            id: newId,
            data: [],
            parentId: table.id,
            position: newPosition
        };
    } else {
        newRow = JSON.parse(JSON.stringify(miniRows[miniRows.length - 1]));
        newRow.id = newId;
        newRow.parentId = table.id;
    }
    miniRows.push(newRow);
    
    updateMiniRow(template, newRow, []);
    const element = template.querySelector('.mini-row-wrapper') || template;
    row.querySelector('.table-body').appendChild(template);
    actionManager(element, rows, oldRows, 'element-change');
}

function updateMiniRow(template, row, oldElements) {
    const rowElement = template.querySelector('.mini-row-wrapper') || template;
    
    if (!rowElement.dataset.index) {
        rowElement.dataset.index = row.id;
        rowElement.dataset.parentId = row.parentId;
    } else {
        const dataElements = rowElement.querySelectorAll('.data-wrapper');
        if (dataElements.length) {
            oldElements.push(...dataElements);
        }
    }
    const tableData = row.data;
    if (tableData) {
        tableData.sort((a, b) => a.position - b.position);
        tableData.forEach(cell => {
            let template;
            template = oldElements ? oldElements.find(el => el.dataset.index == cell.id && el.dataset.parentId == cell.parentId) : null;
            if (template) {
                oldElements.splice(oldElements.indexOf(template), 1);
            } else {
                template = document.getElementById('data-template').content.cloneNode(true);
            }
            updateTableData(template, cell);
            rowElement.appendChild(template);
        });
    }
}

function generateTableData(tableElement, table) {
    const miniRows = table.miniRows;
    let previousPosition;
    let elements = [];
    const oldCells = JSON.parse(JSON.stringify(rows));
    
    miniRows.forEach(row => {
        const rowElement = tableElement.querySelector(`.mini-row-wrapper[data-index="${row.id}"]`);
        const template = document.getElementById('data-template').content.cloneNode(true);
        const newId = Date.now();
        const tableData = row.data;
        const newPosition = tableData.length ? tableData[tableData.length - 1].position + 1 : 0;
      
        const newTableData = {
            id: newId,
            text: 'Write here',
            parentId: row.id + '-' + row.parentId,
            position: newPosition
        };
        row.data.push(newTableData);
        
        updateTableData(template, newTableData);
        const infoTitle = template.querySelector('.info-title');
        const inputWrapper = template.querySelector('.cell-input-wrapper');
        
        infoTitle.style.display = 'none';
        inputWrapper.style.display = 'block';
        const element = template.querySelector('.data-wrapper');
        rowElement.appendChild(template);
        previousPosition = newPosition;
        elements.push(element);
    });
    const rowDelete2Btn = document.getElementById('row-delete2-template').content.cloneNode(true);
    const rowDelete2Wrapper = tableElement.querySelector('.row2-wrapper');
    rowDelete2Btn.querySelector('.row-delete2-btn').setAttribute('data-index', previousPosition)
    rowDelete2Wrapper.appendChild(rowDelete2Btn);
    actionManager(elements, rows, oldCells, 'element-change');
}

function updateTableData(template, tableData) {
    const dataNode = template.querySelector('.data-wrapper') || template;
    
    if (!dataNode.dataset.index) {
        dataNode.dataset.index = tableData.id;
        dataNode.dataset.parentId = tableData.parentId;
        const infoTitle = dataNode.querySelector('.info-title');
        const infoInput = dataNode.querySelector('.info-input');
        infoTitle.innerHTML = tableData.text;
        infoInput.innerHTML = tableData.text;
    }
}

function loadImage(event, element) {
    function setImage(src) {
        const oldSrc = element.imgSrc;
        const row = document.querySelector(`.row-wrapper[data-index="${element.id}"]`);
        const infoboxImg = row.querySelector('.infobox-img');
        element.imgSrc = src;
        infoboxImg.src = src;
        actionManager(infoboxImg, src, oldSrc, 'image-change');
    }
    
    if (event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = e => setImage(e.target.result);
        reader.readAsDataURL(file);
    } else {
        const url = prompt('Enter the URL', 'https://');
        if (url) setImage(url);
    }
}

// moves sections up and down inside infobox row
function moveSection(row, infobox, direction) {
    const previousRow = row.previousElementSibling;
    const nextRow = row.nextElementSibling;
    const index = row.getAttribute('data-index');
    const sections = infobox.sections;
    const currentSection = sections.find(sec => sec.id == index);
    const oldRows = JSON.parse(JSON.stringify(rows));
    
    if (direction === 'up' && previousRow) {
        const previousIndex = Number(previousRow.dataset.index);
        const previousSection = sections.find(sec => sec.id === previousIndex);
        
        const currentPosition = currentSection.position;
        currentSection.position = previousSection.position;
        previousSection.position = currentPosition;
    
        row.parentNode.insertBefore(row, previousRow);
    } else if (direction === 'down' && nextRow) {
        const nextIndex = Number(nextRow.dataset.index);
        const nextSection = sections.find(sec => sec.id === nextIndex);
        
        const currentPosition = currentSection.position;
        currentSection.position = nextSection.position;
        nextSection.position = currentPosition;
    
        row.parentNode.insertBefore(nextRow, row);
    } else {
        let previousPosition = -1;
        
        sections.forEach(section => {
            if (section.position !== previousPosition + 1) {
                section.position = previousPosition + 1;
            }
            previousPosition = section.position;
        });
    }
    sections.sort((a, b) => a.position - b.position);
    actionManager(null, rows, oldRows, 'element-change');
}

// moves mini rows inside the table row
function moveMiniRow(row, table, direction) {
    const previousRowElement = row.previousElementSibling;
    const nextRowElement = row.nextElementSibling;
    const index = row.dataset.index;
    const miniRows = table.miniRows;
    const oldRows = JSON.parse(JSON.stringify(rows));
    const currentRow = miniRows.find(r => r.id == index);
    if (direction === 'up' && previousRowElement) {
        const previousIndex = Number(previousRowElement.dataset.index);
        const previousRow = miniRows.find(sec => sec.id === previousIndex);
        
        const currentPosition = currentRow.position;
        currentRow.position = previousRow.position;
        previousRow.position = currentPosition;
    
        row.parentNode.insertBefore(row, previousRowElement);
    } else if (direction === 'down' && nextRowElement) {
        const nextIndex = Number(nextRowElement.dataset.index);
        const nextRow = miniRows.find(sec => sec.id === nextIndex);
        
        const currentPosition = currentRow.position;
        currentRow.position = nextRow.position;
        nextRow.position = currentPosition;
    
        row.parentNode.insertBefore(nextRowElement, row);
    } else {
        let previousPosition = 0;
        
        miniRows.forEach(box => {
            box.position = previousPosition++;
        });
    }
    miniRows.sort((a, b) => a.position - b.position);
    actionManager(null, rows, oldRows, 'element-change');
}

function moveTableData(tableNode, table, position, direction) {
    const miniRows = table.miniRows;
    const oldRows = JSON.parse(JSON.stringify(rows));
    miniRows.forEach(row => {
        const tableData = row.data;
        const rowElement = tableNode.querySelector(`.mini-row-wrapper[data-index="${row.id}"]`);
        tableData.forEach(cell => {
            if (cell.position == position) {
                const dataElement = rowElement.querySelector(`.data-wrapper[data-index="${cell.id}"]`);
                const previousCell = dataElement.previousElementSibling;
                const nextCell = dataElement.nextElementSibling;
                
                if (direction === 'left' && previousCell && previousCell.classList.contains('data-wrapper')) {
                    const previousIndex = Number(previousCell.dataset.index);
                    const previousData = tableData.find(a => a.id === previousIndex);
                    
                    const currentPosition = cell.position;
                    cell.position = previousData.position;
                    previousData.position = currentPosition;
                    
                    dataElement.parentNode.insertBefore(dataElement, previousCell);
                } else if (direction === 'right' && nextCell) {
                    const nextIndex = Number(nextCell.dataset.index);
                    const nextData = tableData.find(a => a.id === nextIndex);
                    
                    const currentPosition = cell.position;
                    cell.position = nextData.position;
                    nextData.position = currentPosition;
                    
                    dataElement.parentNode.insertBefore(nextCell, dataElement);
                }
            }
            tableData.sort((a, b) => a.position - b.position);
        });
    });
    actionManager(null, rows, oldRows, 'element-change');
}

function moveCell(row, currentCell, direction) {
    const previousRow = row.previousElementSibling;
    const nextRow = row.nextElementSibling;
    const oldRows = JSON.parse(JSON.stringify(cells));
    
    if (direction === 'up' && previousRow) {
        const previousIndex = Number(previousRow.dataset.index);
        const previousCell = cells.find(el => el.id === previousIndex);
        
        const currentPosition = currentCell.position;
        currentCell.position = previousCell.position;
        previousCell.position = currentPosition;
    
        row.parentNode.insertBefore(row, previousRow);
    } else if (direction === 'down' && nextRow) {
        const nextIndex = Number(nextRow.dataset.index);
        const nextCell = cells.find(el => el.id === nextIndex);
        
        const currentPosition = currentCell.position;
        currentCell.position = nextCell.position;
        nextCell.position = currentPosition;
    
        row.parentNode.insertBefore(nextRow, row);
    } else {
        let previousPosition = -1;
        
        cells.forEach(cell => {
            if (cell.position !== previousPosition + 1) {
                cell.position = previousPosition + 1;
            }
            previousPosition = cell.position;
        });
    }
    cells.sort((a, b) => a.position - b.position);
    actionManager(null, cells, oldRows, 'element-change');
}

// moves infobox rows up and down
function moveInfobox(row, infobox, direction) {
    let previousInfobox;
    let nextInfobox;
    let previousRow;
    let nextRow;
    if (infobox.type === 'category') {
        const categories = rows.filter(box => box.type == 'category');
        categories.sort((a, b) => a.position - b.position);
        previousInfobox = categories[categories.indexOf(infobox) - 1];
        nextInfobox = categories[categories.indexOf(infobox) + 1];
        previousRow = previousInfobox ? document.querySelector(`.row-wrapper[data-index="${previousInfobox.id}"]`) : null;
        nextRow = nextInfobox ? document.querySelector(`.row-wrapper[data-index="${nextInfobox.id}"]`) : null;
    } else {
        previousRow = row.previousElementSibling;
        nextRow = row.nextElementSibling;
        if (previousRow) {
            const previousIndex = Number(previousRow.dataset.index);
            previousInfobox = rows.find(char => char.id === previousIndex);
        }
        if (nextRow) {
            const nextIndex = Number(nextRow.dataset.index);
            nextInfobox = rows.find(char => char.id === nextIndex);
        }
    }
    const oldRows = JSON.parse(JSON.stringify(rows));
    
    if (direction === 'up' && previousRow) {
        row.parentNode.insertBefore(row, previousRow);
        
        if (infobox.type === 'category') {
            allignCategory(row, infobox);
        } else {
            const currentPosition = infobox.position;
            infobox.position = previousInfobox.position;
            previousInfobox.position = currentPosition;
        }
    } else if (direction === 'down' && nextRow) {
        row.parentNode.insertBefore(nextRow, row);
        
        if (infobox.type === 'category') {
            allignCategory(nextRow, nextInfobox);
            allignCategory(row, infobox);
        } else {
            const currentPosition = infobox.position;
            infobox.position = nextInfobox.position;
            nextInfobox.position = currentPosition;
        }
    }
    rows.sort((a, b) => a.position - b.position);
    actionManager(null, rows, oldRows, 'element-change');
}

function allignCategory(catNode, category) {
    let id = category.id;
    const childRows = document.querySelectorAll(`.row-wrapper[data-category="${id}"]`);
    let previousRow = catNode;
    
    if (childRows.length) {
        childRows.forEach(row => {
            row.style.display = 'block';
            row.parentNode.insertBefore(row, previousRow.nextElementSibling);
            previousRow = row;
        });
    }
    allignRows();
}

function toggleBio(row) {
    const bioElement = row.querySelector('.infobox-bio');
    const btnElement = row.querySelector('.see-more-btn');

    if (bioElement.style.maxHeight) {
        bioElement.style.maxHeight = null;
        btnElement.textContent = 'show more';
    } else {
        bioElement.style.maxHeight = bioElement.scrollHeight + 'px';
        btnElement.textContent = 'show less';
    }
}

// generates info cells for the infoboxes
function generateSection(templateId, row, infobox, text) {
    const template = document.getElementById(templateId).content.cloneNode(true);
    const newId = Date.now();
    const sections = infobox.sections;
    const newPosition = sections.length ? sections[sections.length - 1].position + 1 : 0;
    const oldSections = JSON.parse(JSON.stringify(sections));

    const newSection = {
        id: newId,
        text1: text ? text : 'Write here',
        text2: templateId === 'section-template' ? 'Write here' : null,
        parentId: infobox.id,
        position: newPosition
    };
    infobox.sections.push(newSection);
    
    updateSection(template, newSection);
    
    const bioElement = row.querySelector('.infobox-bio');
    const element = template.querySelector('.section-wrapper');
    row.querySelector('.section-lists').appendChild(template);
    actionManager(element, sections, oldSections, 'element-change');
    bioElement.style.maxHeight = bioElement.scrollHeight + 'px';
}

function updateSection(template, section) {
    const sectionNode = template.querySelector('.section-wrapper') || template;
    
    if (!sectionNode.dataset.index) {
        sectionNode.dataset.index = section.id;
        sectionNode.dataset.parentId = section.parentId;
        const infoText = template.querySelector('.info-title');
        const infoInput = sectionNode.querySelector('.info-input');
        infoText.innerHTML = section.text1;
        infoInput.innerHTML = section.text1;
        if (section.text2) {
            const valueText = sectionNode.querySelector('.value-cell');
            const valueInput = sectionNode.querySelector('.value-input');
            valueText.innerHTML = section.text2;
            valueInput.innerHTML = section.text2;
        }
    }
}

function updateData(data) {
    document.getElementById('title').textContent = data.title;
    document.getElementById('intro').innerHTML = data.intro;
    document.getElementById('synopsis-text').innerHTML = data.synopsis;
    document.getElementById('synopsis-text-input').addEventListener('focus', function(event) {
        currentTextArea = event.target;
    });
    document.getElementById('intro-input').addEventListener('focus', function(event) {
        currentTextArea = event.target;
    });
    document.getElementById('poster').src = data.poster;
    toggleUpperToolbar();
    toggleMainInfobox();
}

function loadState(oldElement) {
    function loadElements(oldElements) {
        updateData(data);
        rows.sort((a, b) => a.position - b.position);
            
        rows.forEach(row => {
            if (!row.type) {
              row.type = 'infobox';
            }
            let template = oldElements?.find(node => node.dataset.index == row.id);
            if (template) {
                oldElements.splice(oldElements.indexOf(template), 1);
            } else {
                template = document.getElementById(`${row.type}-template`).content.cloneNode(true);
            }
            if (row.type === 'category') {
              updateCategory(template, row);
            } else if (row.type === 'sub-category') {
              updateSubCategory(template, row);
            } else if (row.type === 'text-area' || row.type === 'text') {
              updateTextArea(template, row);
            } else if (row.type === 'table') {
              updateTable(template, row, oldElements);
            } else if (row.type === 'infobox') {
              updateInfobox(template, row, oldElements);
            }
            
            document.getElementById('row-list').appendChild(template);
        });
        
        cells.sort((a, b) => a.position - b.position);
        
        cells.forEach(cell => {
            let template = oldElements ? oldElements.find(node => node.dataset.index == cell.id && node.classList.contains('info-wrapper')) : null;
            if (template) {
                oldElements.splice(oldElements.indexOf(template), 1);
            }
            if (cell.text2) {
                template = template ? template : document.getElementById('info-template').content.cloneNode(true);
            } else {
                template = template ? template : document.getElementById('info-template2').content.cloneNode(true);
            }
            updateCell(template, cell);
            document.getElementById('info-list').appendChild(template);
        });
        // removing the leftover elements
        oldElements.forEach(el => el.remove());
    }
    
    if (oldElement) {
        let oldElements = [];
        const rowNodes = document.getElementById('row-list').querySelectorAll('.row-wrapper');
        const cellNodes = document.getElementById('info-list').querySelectorAll('.info-wrapper');
        if (cellNodes.length) {
            oldElements.push(...cellNodes);
        }
        if (rowNodes.length) {
            oldElements.push(...rowNodes);
        }
        if (oldElement.length) {
            oldElements.push(...oldElement);
        } else if (oldElement.tagName) {
            oldElements.push(oldElement);
        }
        loadElements(oldElements);
    } else {
        const transaction = db.transaction(['articles'], 'readonly');
        const articleStore = transaction.objectStore('articles');
        
        articleStore.getAll().onsuccess = function (event) {
            const articles = event.target.result;
            console.log(articles);
            
            articles.forEach(article => {
                const template = document.getElementById('article-template').content.cloneNode(true);
                template.querySelector('.article-section').dataset.id = article.articleId;
                if (article.articleId == currentArticleId) {
                    template.querySelector('.article-section').style.backgroundColor = '#fff0c7';
                }
                template.querySelector('.article-title').textContent = article.data.title;
                document.getElementById('article-list').appendChild(template);
            });
        };
        
        articleStore.get(currentArticleId).onsuccess = function(event) {
            const articleData = event.target.result;
            
            if (articleData) {
                data = articleData.data;
                rows = articleData.characters || articleData.rows;
                cells = articleData.cells;
                previousSaves = articleData.previousSaves || [];
                
                if (previousSaves) {
                    previousSaves.forEach((state, i) => {
                        const template = document.getElementById('save-state-template').content.cloneNode(true);
                        template.querySelector('.save-state-section').dataset.id = state.id;
                        template.querySelector('.state-title').textContent = 'File ' + ( i + 1 );
                        document.getElementById('save-list').appendChild(template);
                    });
                }
                content.style.display = '';
                loadElements([]);
            }
        };
    }
}

function uploadFile(event) {
    const file = event.target.files[0];
      if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const uploadedData = JSON.parse(e.target.result);
  
        // Restore data
        data = uploadedData.data;
        rows = uploadedData.infoboxes || uploadedData.rows;
        cells = uploadedData.cells;
  
        // Update UI
        updateData(data);
        document.getElementById('row-list').innerHTML = '';
        document.getElementById('info-list').innerHTML = '';
        saveState(3); // persist back to IndexedDB
        loadState(); // reload saved structures
  
        alert('File uploaded and data restored ✅');
      } catch (err) {
        alert('Invalid JSON file ❌');
        console.error(err);
      }
    };
    reader.readAsText(file);
}

function saveState(trigger) {
    const transaction = db.transaction(['articles'], 'readwrite');
    
    const articleStore = transaction.objectStore('articles');
    
    const newId = Date.now();
    
    if (trigger === 6) {
        const previousSave = {
            id: newId,
            data: JSON.parse(JSON.stringify(data)),
            rows: JSON.parse(JSON.stringify(rows)),
            cells: JSON.parse(JSON.stringify(cells))
        };
        previousSaves.push(previousSave);
        if (previousSaves.length > 5) {
          previousSaves.shift();
        }
    }

    const articleData = {
        articleId: currentArticleId,
        data: data,
        rows: rows,
        cells: cells,
        previousSaves: previousSaves
    };
    articleStore.put(articleData);

    transaction.oncomplete = function() {
        console.log('Data saved to IndexedDB');
        console.log(trigger)
    };
}

function resetArticle() {
    const newData = {
        id: currentArticleId,
        title: 'New Page',
        intro: 'Write intro here...',
        synopsis: 'Write synopsis here...',
        poster: 'https://i.ibb.co/jkvtj531/file-00000000b08861faaa5ae1d6be8c5b27.png',
        upperToolbar: false,
        infobox: false
    };
    data = newData;
    rows = [];
    cells = [];
    loadState(true);
}

function deleteElement(row, element, array, type) {
    let elements = [];
    if (type !== 'table data') {
        if (confirm(`Are you sure you want to delete this ${type}?`)) {
            let oldRows;
            let newRows;
            if (cells === array) {
                oldRows = JSON.parse(JSON.stringify(array));
                newRows = array;
            } else {
                oldRows = JSON.parse(JSON.stringify(rows));
                newRows = rows;
            }
            if (type === 'category') {
                const filteredRows = rows.filter(arr => arr.category === element.id);
                filteredRows.forEach(arr => {
                    const childNode = document.querySelector(`.row-wrapper[data-index="${arr.id}"]`);
                    childNode.remove();
                    rows.splice(rows.indexOf(arr), 1);
                    elements.push(childNode);
                });
            }
            
            row.remove();
            array.splice(array.indexOf(element), 1);
            array.forEach((el, index) => el.position = index);
            elements.push(row);
            
            actionManager(elements, newRows, oldRows, 'element-change');
        }
    } else if (type === 'table data') {
        const target = row;
        const index = target.dataset.index;
        const parentRow = target.closest('.table-body');
        const rowDelete2Wrapper = target.closest('.row2-wrapper');
        target.parentNode.remove();
        const rowDelete2Btns = rowDelete2Wrapper.querySelectorAll('.row-delete2-btn');
        const miniRows = element.miniRows;
        const oldRows = JSON.parse(JSON.stringify(rows));
        
        rowDelete2Btns.forEach((btn, i) => {
            btn.setAttribute('data-index', i);
        });
        
        miniRows.forEach(miniRow => {
            const tableData = miniRow.data;
            const cell = tableData.find(a => a.position == index);
            const dataElement = parentRow.querySelector(`.data-wrapper[data-index="${cell.id}"]`);
            
            dataElement.remove();
            elements.push(dataElement);
            tableData.splice(miniRow.data.indexOf(cell), 1);
            
            tableData.forEach((cell, i) => cell.position = i);
        });
        actionManager(elements, rows, oldRows, 'element-change');
    }
}

// Generates premade rows for the Infobox
function presetGenerateCell(type) {
    editButton.click();
    settingsBtn.click();
    let presetCells = [];
    if (type === 1)
        presetCells = [
            { text: 'Capital:', id: 1 },
            { text: 'Biggest city:', id: 2 },
            { text: 'Other names:', id: 3 },
            { text: 'Notable cities:', id: 4 },
            { text: 'Established', id: 5 },
            { text: 'Demonyn:', id: 6 },
            { text: 'Official languages:', id: 7 },
            { text: 'Religion:', id: 8 },
            { text: 'Government:', id: 9 },
            { text: 'Currency:', id: 10 }
        ];
    else {
        presetCells = [
            { text: 'Creator:', id: 1 },
            { text: 'Genre:', id: 2 },
            { text: 'Inspired by:', id: 3 },
            { text: 'Platform:', id: 4 },
            { text: 'Year', id: 5 },
            { text: 'location:', id: 6 },
            { text: 'Target audience:', id: 7 },
            { text: 'Language:', id: 8 },
            { text: 'Additional languages:', id: 9 },
            { text: 'Game Engine:', id: 10 },
            { text: 'Mode:', id: 11 }
        ];
    }
    
    presetCells.sort((a, b) => a.id - b.id);
    
    presetCells.forEach((cell, index) => {
        setTimeout(() => {
            generateCell('info-template', `<b>${cell.text}</b>`);
        }, index * 100);
    });
}

// Generates premade rows for the infoboxes
function presetGenerateSection(row, infobox) {
    let presetSectionCells = [];
    
    presetSectionCells = [
        { text: 'Full name:', id: 1 },
        { text: 'Born:', id: 2 },
        { text: 'Gender:', id: 3 },
        { text: 'Languages:', id: 4 },
        { text: 'Nationality:', id: 5 },
        { text: 'Home:', id: 6 },
        { text: 'Occupation:', id: 7 },
        { text: 'Species:', id: 8 },
        { text: 'Religion:', id: 9 }
    ];
    
    presetSectionCells.sort((a, b) => a.id - b.id);
    
    presetSectionCells.forEach((cell, index) => {
        setTimeout(() => {
            generateSection('section-template', row, infobox, `<b>${cell.text}</b>`);
        }, index * 100);
    });
}