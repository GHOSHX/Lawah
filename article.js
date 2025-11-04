let db;

function openDB() {
    const request = indexedDB.open('gameData', 5);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        loadState();
    };

    request.onerror = function(event) {
        console.error('IndexedDB error:', event.target.error);
    };
}

let data = {};
let infoboxes = [];
let cells = [];
let undoList = [];
let redoList = [];
let tempArray = [];
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
let settingsBtn;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentArticleId = Number(urlParams.get('articleId'));
    articleName = decodeURIComponent(urlParams.get('articleTitle'));
    
    openDB();
    
    const inputPoster = document.getElementById('poster-input');
    toggleSynopsisBtn = document.getElementById('toggle-synopsis-btn');
    toggleInfoboxBtn = document.getElementById('toggle-infobox-btn');
    editButton = document.getElementById('edit-infobox');
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
    addRow3Btn.addEventListener('click', () => generateRow(null, null, 'text'));
    toggleSynopsisBtn.addEventListener('click', () => toggleTable('table1', toggleSynopsisBtn));
    toggleInfoboxBtn.addEventListener('click', () => toggleTable('row-list', toggleInfoboxBtn));
    document.getElementById('delete-article-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this saved article?')) {
            deleteElementFromArticle();
        }
    });
    document.getElementById('enable-preset1').addEventListener('click', () => presetGenerateCell(1));
    document.getElementById('enable-preset2').addEventListener('click', () => presetGenerateCell(2));
    document.getElementById('upper-toolbar-btn').addEventListener('click', function() {
        const toolbar = document.getElementById('toolbar');
        const introWrapper = document.getElementById('intro-wrapper');
        
        if (this.textContent === 'Upper Toolbar: Off') {
            this.innerHTML = '<b>Upper Toolbar: On</b>';
            toolbar.classList.toggle('top');
            toolbar.classList.toggle('bottom');
            if (toolbar.style.display === 'block') {
                introWrapper.classList.toggle('intro-wrapper1');
                introWrapper.classList.toggle('intro-wrapper2');
            }
            data.upperToolbar = true;
        } else {
            this.innerHTML = '<b>Upper Toolbar: Off</b>';
            toolbar.classList.toggle('top');
            toolbar.classList.toggle('bottom');
            if (toolbar.style.display === 'block') {
                introWrapper.classList.toggle('intro-wrapper1');
                introWrapper.classList.toggle('intro-wrapper2');
            }
            data.upperToolbar = false;
        }
        saveState(1);
    });
    document.getElementById('infobox-toggle-btn').addEventListener('click', function() {
        const mainInfobox = document.getElementById('infobox');
        const presetBtn1 = document.getElementById('enable-preset1');
        const presetBtn2 = document.getElementById('enable-preset2');
        
        if (this.textContent === 'Main Infobox: Hide') {
            mainInfobox.style.display = 'table';
            presetBtn1.style.display = 'inline';
            presetBtn2.style.display = 'inline';
            this.innerHTML = `<b>Main Infobox: Show</b>`
            data.infobox = true;
        } else {
            mainInfobox.style.display = 'none';
            presetBtn1.style.display = 'none';
            presetBtn2.style.display = 'none';
            this.innerHTML = `<b>Main Infobox: Hide</b>`
            data.infobox = false;
        }
        saveState(2);
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
    fileUploadBtn.addEventListener('click', () => {
      document.getElementById('upload-input').click();
    });
    document.getElementById('upload-input').addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;
    
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const uploadedData = JSON.parse(e.target.result);
    
          // Restore data
          data = uploadedData.data;
          infoboxes = uploadedData.characters || uploadedData.infoboxes;
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
    });
    downloadBtn.addEventListener('click', async () => {
      try {
        const articleData = {
          articleId: currentArticleId,
          data: data,
          infoboxes: infoboxes,
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
        data.poster = e.target.result;
        document.getElementById('poster').src = data.poster;
        saveState(4);
      }
      
      reader.readAsDataURL(this.files[0]);
    });
    document.getElementById('info-list').addEventListener('click', handleCellClick);
    document.getElementById('row-list').addEventListener('click', handleRowClick);
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

function actionManager(element, newData, oldData, type) {
    let newAction = {};
    if (type === 'text-change') {
        const elementActions = undoList.filter(undo => undo.element === element);
        const previousAction = elementActions[elementActions.length - 1];
        if (elementActions.length) {
            if (newData === tempArray[tempArray.length - 1] + '&nbsp;') {
                previousAction.newData = tempArray[tempArray.length - 1];
                tempArray = [];
            } else {
                tempArray.push(newData);
                previousAction.newData = newData;
                redoList = [];
                return;
            }
        }
        
        newAction = {
          newData,
          oldData,
          type,
          element
        };
    } else if (type === 'element-change') {
        newAction = {
          newArray: newData,
          oldArray: oldData,
          nextElement: element.nextElementSibling,
          parentNode: element.parentNode,
          type,
          element
        };
    } else if (type === 'element-change2') {
        newAction = {
          newElement: {
            newArray: newData,
            newData: element.innerHTML
          },
          oldElement: {
            oldArray: oldData.oldRows,
            oldData: oldData.oldData
          },
          type,
          element
        };
    }
    undoList.push(newAction);
    
    redoList = [];
}

function undoManager() {
    const previousAction = undoList.pop();
    const element = previousAction?.element;
    
    if (!element) return;
    
    if (element.isConnected && previousAction.type === 'text-change') {
        element.innerHTML = previousAction.oldData;
    } else if (previousAction.type === 'element-change') {
        const newArray = previousAction.newArray;
        const oldArray = previousAction.oldArray;
        previousAction.newArray = JSON.parse(JSON.stringify(newArray));
        previousAction.oldArray = newArray;
        
        newArray.length = 0;
        newArray.push(...oldArray);
        if (element.isConnected) {
            element.remove();
        } else {
            const id = previousAction.element.dataset.index;
            const oldRow = oldArray.find(a => a.id == id);
            const template = document.createDocumentFragment();
            template.appendChild(element);
            const nextElement = previousAction.nextElement;
            nextElement ? previousAction.parentNode.insertBefore(element, nextElement) : previousAction.parentNode.appendChild(element);
        }
    } else if (previousAction.type === 'element-change2') {
        const newArray = previousAction.newElement.newArray;
        const oldArray = previousAction.oldElement.oldArray;
        previousAction.newElement.newArray = JSON.parse(JSON.stringify(newArray));
        previousAction.oldElement.oldArray = newArray;
        
        newArray.length = 0;
        newArray.push(...oldArray);
        previousAction.element.innerHTML = previousAction.oldElement.oldData;
    }
    redoList.push(previousAction);
}

function redoManager() {
    const previousAction = redoList.pop();
        
    const element = previousAction?.element;
    if (!element) return;
    
    if (previousAction.type === 'text-change') {
        element.innerHTML = previousAction.newData;
    } else if (previousAction.type === 'element-change') {
        const newArray = previousAction.newArray;
        const oldArray = previousAction.oldArray;
        previousAction.oldArray = JSON.parse(JSON.stringify(oldArray));
        previousAction.newArray = oldArray;
        
        oldArray.length = 0;
        oldArray.push(...newArray);
        if (element.isConnected) {
            element.remove();
        } else {
            const id = previousAction.element.dataset.index;
            const oldRow = oldArray.find(a => a.id == id);
            const template = document.createDocumentFragment();
            template.appendChild(element);
            const nextElement = previousAction.nextElement;
            nextElement ? previousAction.parentNode.insertBefore(element, nextElement) : previousAction.parentNode.appendChild(element);
        }
    } else if (previousAction.type === 'element-change2') {
        const newArray = previousAction.newElement.newArray;
        const oldArray = previousAction.oldElement.oldArray;
        previousAction.oldElement.oldArray = JSON.parse(JSON.stringify(oldArray));
        previousAction.newElement.newArray = oldArray;
        
        oldArray.length = 0;
        oldArray.push(...newArray);
        previousAction.element.innerHTML = previousAction.newElement.newData;
    }
    undoList.push(previousAction);
}

function toggleTable(tableId, button) {
    let isVisible = getComputedStyle(button).backgroundImage.includes('https://i.ibb.co/s91K27m8/20251024-091953.png');
    var table = document.getElementById(tableId);
    const infoboxTemplate = document.querySelectorAll('.character-wrapper');
    
    if (!isVisible) {
        table.style.display = 'block';
        button.style.backgroundImage = 'url(https://i.ibb.co/s91K27m8/20251024-091953.png)';
        let toggleCategoryBtn;
        
        infoboxTemplate.forEach(template => {
            const index = template.getAttribute('data-index');
            const infobox = infoboxes.find(char => char.id == index);
            
            if (infobox.type === 'category') {
                toggleCategoryBtn = getComputedStyle(template.querySelector('.toggle-category-btn')).backgroundImage;
            } else if (toggleCategoryBtn && toggleCategoryBtn.includes('https://i.ibb.co/6q919Xb/20251024-055350.png')) {
                template.style.display = 'none';
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
    const editMode = editButton.textContent === '✔️';
    template.querySelector('.info-wrapper').setAttribute('data-index', cell.id);
    if (editMode) {
        const textWrapper = template.querySelectorAll('.cell-text');
        const inputWrappers = template.querySelectorAll('.cell-input-wrapper');
        
        textWrapper.forEach(text => {
            text.style.display = 'none';
        })
        inputWrappers.forEach(input => {
            input.style.display = 'block';
        });
    }
    template.querySelector('.info-title').innerHTML = cell.text1;
    template.querySelector('.info-input').innerHTML = cell.text1;
    const infoTitle = template.querySelector('.info-title');
    const infoInput = template.querySelector('.info-input');
    infoInput.addEventListener('input', (event) => {
        const element = event.target;
        const elementActions = undoList.filter(undo => undo.element === element);
        const lastText = elementActions.length ? elementActions[elementActions.length - 1].newData : infoTitle.innerHTML;
        
        actionManager(element, element.innerHTML, lastText, 'text-change');
    });
    infoInput.addEventListener('focus', function(event) {
        currentTextArea = event.target;
    });
    if (cell.text2) {
        template.querySelector('.value-cell').innerHTML = cell.text2;
        template.querySelector('.value-input').innerHTML = cell.text2;
        const valueCell = template.querySelector('.value-cell');
        const valueInput = template.querySelector('.value-input');
        valueInput.addEventListener('input', (event) => {
            const element = event.target;
            const elementActions = undoList.filter(undo => undo.element === element);
            const lastText = elementActions.length ? elementActions[elementActions.length - 1].newData : valueCell.innerHTML;
            
            actionManager(element, element.innerHTML, lastText, 'text-change');
        });
        valueInput.addEventListener('focus', function(event) {
            currentTextArea = event.target;
        });
    }
}

function editArticle() {
    const controlRoom = document.querySelectorAll('.control-room');
    const toolbar = document.getElementById('toolbar');
    const title = document.getElementById('title');
    const introText = document.getElementById('intro');
    const synopsisText = document.getElementById('synopsis-text');
    const titleInput = document.getElementById('title-input');
    const introInput = document.getElementById('intro-input');
    const synopsisInput = document.getElementById('synopsis-text-input');
    const introWrapper = document.getElementById('intro-wrapper');
    const rowList = document.getElementById('row-list');
    const writebleElements = document.querySelectorAll('.writeble-element');
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
                introWrapper.classList.
                toggle('intro-wrapper1');
                introWrapper.classList.toggle('intro-wrapper2');
            } else {
                rowList.classList.toggle('row-list-edit-mode');
            }
            writebleElements.forEach(el => {
                el.style.backgroundColor = 'white';
            });
            toolbar.style.display = 'block';
            titleInput.value = title.textContent;
            introInput.innerHTML = introText.innerHTML;
            synopsisInput.innerHTML = synopsisText.innerHTML;
            titleInput.style.display = 'inline';
            introInput.style.display = 'block';
            synopsisInput.style.display = 'block';
            title.style.display = 'none';
            introText.style.display = 'none';
            synopsisText.style.display = 'none';
            editButton.textContent = '✔️';
            editInfobox(editMode);
            editMainInfobox(editMode);
        } else {
            controlRoom.forEach(room => {
                room.style.display = 'none';
            });
            if (data.upperToolbar) {
                introWrapper.classList.toggle('intro-wrapper1');
                introWrapper.classList.toggle('intro-wrapper2');
            } else {
                rowList.classList.toggle('row-list-edit-mode');
            }
            writebleElements.forEach(el => {
                el.style.backgroundColor = '#F1e7dd';
            });
            data.title = titleInput.value;
            data.intro = introInput.innerHTML;
            data.synopsis = synopsisInput.innerHTML;
            title.textContent = data.title;
            introText.innerHTML = data.intro;
            synopsisText.innerHTML = data.synopsis;
            titleInput.style.display = 'none';
            introInput.style.display = 'none';
            synopsisInput.style.display = 'none';
            title.style.display = 'block';
            introText.style.display = 'block';
            synopsisText.style.display = 'block';
            toolbar.style.display = 'none';
            editButton.textContent = '✏️';
            assignCategoriesToInfoboxes();
            editInfobox(editMode);
            editMainInfobox(editMode);
            saveState(6);
        }
    }
}

function assignCategoriesToInfoboxes() {
  let currentCategoryId = null;

  infoboxes.sort((a, b) => a.position - b.position);

  infoboxes.forEach(infobox => {
      if (infobox.type === "category") {
          currentCategoryId = infobox.id;
      } else {
          infobox.category = currentCategoryId;
      }
  });
}

function editInfobox(editMode) {
    const infoboxTemplate = document.querySelectorAll('.character-wrapper');
    if (!infoboxTemplate) return;
    
    infoboxTemplate.forEach(template => {
        const infoboxName = template.querySelector('.infobox-name');
        const infoboxNameInput = template.querySelector('.name-input');
        const charControls = template.querySelector('.infobox-name-controls');
        const infoboxBio = template.querySelector('.infobox-bio-text');
        const infoboxBioInput = template.querySelector('.bio-input');
        const presetBtn = template.querySelector('.generate-preset-btn');
        const index = template.getAttribute('data-index');
        const infobox = infoboxes.find(char => char.id == index);
        const toggleCategoryBtn = template.querySelector('.toggle-category-btn');
        const isCategoryVisible = toggleCategoryBtn ? getComputedStyle(toggleCategoryBtn).backgroundImage.includes('https://i.ibb.co/s91K27m8/20251024-091953.png') : null;
          
        if (editMode) {
            if (infobox.type === 'category') {
                if (!isCategoryVisible) {
                    toggleCategoryBtn.click();
                }
            }
            charControls.style.display = 'block';
            if (infoboxName) {
              infoboxName.style.display = 'none';
              infoboxNameInput.value = infoboxName.textContent;
              infoboxNameInput.style.display = 'inline';
            }
            
            if (infoboxBio) {
              infoboxBio.style.display = 'none';
              infoboxBioInput.innerHTML = infoboxBio.innerHTML;
              infoboxBioInput.style.display = 'block';
            }
            if (presetBtn) {
                presetBtn.style.display = 'block';
            }
        } else {
            charControls.style.display = 'none';
            
            if (presetBtn) {
                presetBtn.style.display = 'none';
            }
            
            if (infoboxName) {
                infoboxNameInput.style.display = 'none';
                
                if (infoboxNameInput.value.trim()) {
                    infobox.name = infoboxNameInput.value;
                    infoboxName.textContent = infoboxNameInput.value;
                }
                
                infoboxName.style.display = 'block';
            }
            
            if (infoboxBio) {
                infoboxBioInput.style.display = 'none';
                
                if (infoboxBioInput.innerHTML.trim()) {
                    infobox.bio = infoboxBioInput.innerHTML;
                    infoboxBio.innerHTML = infoboxBioInput.innerHTML;
                }
                
                infoboxBio.style.display = 'block'
            }
        }
        
        if (infobox.type === 'table') {
            const rows = infobox.rows;
            const rowDelete2Wrapper = template.querySelector('.row2-wrapper');
            
            if (editMode) {
                rowDelete2Wrapper.style.display = 'table-row';
            } else {
                rowDelete2Wrapper.style.display = 'none';
            }
            
            rows.forEach(row => {
                const rowElement = document.querySelector(`tr[data-index="${row.id}"]`);
                editTableData(rowElement, row, editMode);
            });
        }
        
        if (presetBtn) {
            editSection(template, infobox, editMode);
        }
    });
}

function editTableData(rowElement, row, editMode) {
    const dataWrappers = rowElement.querySelectorAll('.data-wrapper');
    const rowDeleteBtns = rowElement.querySelectorAll('.row-delete-wrapper')
    const tableData = row.data;
    
    if (rowDeleteBtns) {
        rowDeleteBtns.forEach(btn => {
            if (editMode) {
                btn.style.display = 'table-cell';
            } else {
                btn.style.display = 'none';
            }
        });
    }
    
    if (dataWrappers) {
        dataWrappers.forEach(wrapper => {
            const infoTitle = wrapper.querySelector('.info-title');
            const inputWrapper = wrapper.querySelector('.cell-input-wrapper');
            const infoInput = wrapper.querySelector('.info-input');
            const index = wrapper.dataset.index;
            const currentData = tableData.find(el => el.id == index);
            
            
            if (editMode) {
                infoTitle.style.display = 'none';
                infoInput.innerHTML = infoTitle.innerHTML;
                inputWrapper.style.display = 'block';
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
                inputWrapper.style.display = 'none';
                infoTitle.style.display = 'block';
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
            const infoTitle = section.querySelector('.info-title');
            const valueCell = section.querySelector('.value-cell');
            const inputWrapper = section.querySelectorAll('.cell-input-wrapper');
            const textWrapper = section.querySelectorAll('.cell-text');
            const infoInput = section.querySelector('.info-input');
            const valueInput = section.querySelector('.value-input');
            const index = infoTitle.closest('.section-wrapper').getAttribute('data-index');
            let cell = sections.find(el => el.id == index);
            
            if (editMode) {
                textWrapper.forEach(text => {
                    text.style.display = 'none';
                });
                rowDeleteCell.style.display = 'block';
                rowCell1.style.width = '48%';
                valueInput.innerHTML = valueCell.innerHTML;
                infoInput.innerHTML = infoTitle.innerHTML;
                inputWrapper.forEach(input => {
                    input.style.display = 'block';
                });
            } else {
                cell.text1 = infoInput.innerHTML;
                cell.text2 = valueInput.innerHTML;
                if (!infoInput.textContent.trim() && !valueInput.textContent.trim()) {
                    const wrapper = infoInput.closest('.info-wrapper');
                    deleteElement(section, cell, sections, 'section');
                } else {
                    infoTitle.innerHTML = cell.text1;
                    valueCell.innerHTML = cell.text2;
                }
                rowDeleteCell.style.display = 'none';
                rowCell1.style.width = '50%';
                inputWrapper.forEach(input => {
                    input.style.display = 'none';
                });
                textWrapper.forEach(text => {
                    text.style.display = 'block';
                });
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
            const rowDeleteCell = info.querySelector('.row-delete-cell');
            const infoInput = info.querySelector('.info-input');
            const valueInput = info.querySelector('.value-input');
            const index = infoTitle.closest('.info-wrapper').getAttribute('data-index');
            const cell = cells.find(el => el.id == index);
            
            if (editMode) {
                textWrapper.forEach(text => {
                    text.style.display = 'none';
                });
                rowDeleteCell.style.display = 'table-cell';
                if (!cell3) {
                    valueInput.innerHTML = valueCell.innerHTML;
                }
                infoInput.innerHTML = infoTitle.innerHTML;
                inputWrapper.forEach(input => {
                    input.style.display = 'block';
                });
            } else {
                if (cell3) {
                    cell.text1 = infoInput.innerHTML;
                    if (!infoInput.textContent.trim()) {
                        const wrapper = infoInput.closest('.info-wrapper');
                        deleteElement(wrapper, cell, cells, 'cell');
                    } else {
                        cell3.style.backgroundColor = '#F1e7dd';
                        infoTitle.style.display = 'inline';
                        infoTitle.innerHTML = cell.text1;
                    }
                } else {
                    cell.text1 = infoInput.innerHTML;
                    cell.text2 = valueInput.innerHTML;
                    if (!infoInput.textContent.trim() && !valueInput.textContent.trim()) {
                        const wrapper = infoInput.closest('.info-wrapper');
                        deleteElement(wrapper, cell, cells, 'cell');
                    } else {
                        cell1.style.backgroundColor = '#F1e7dd';
                        cell2.style.backgroundColor = '#F1e7dd';
                        infoTitle.innerHTML = cell.text1;
                        valueCell.innerHTML = cell.text2;
                    }
                }
                rowDeleteCell.style.display = 'none';
                inputWrapper.forEach(input => {
                    input.style.display = 'none';
                });
                textWrapper.forEach(text => {
                    text.style.display = 'block';
                });
            }
        });
    }
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

function handleRowClick(event) {
    const target = event.target;
    const row = target.closest('.character-wrapper');
    const index = row ? row.dataset.index : null;
    const infobox = infoboxes.find(char => char.id == index);

    if (target.classList.contains('upload-img-btn')) {
        const imgBtn = row.querySelectorAll('.infobox-img-btn');
      
        imgBtn.forEach(button => {
            if (getComputedStyle(button).display.includes('none')) {
              button.style.display = 'inline-flex';
            } else {
              button.style.display = 'none';
            }
        });
    } else if (target.classList.contains('img-file-btn')) {
        row.querySelector('.upload-img').click();
    } else if (target.classList.contains('img-link-btn')) {
        loadImage(null, infobox);
    } else if (target.classList.contains('move-up-btn')) {
        moveInfobox(row, infobox, 'up');
    } else if (target.classList.contains('move-down-btn')) {
        moveInfobox(row, infobox, 'down');
    } else if (target.classList.contains('cell-up-btn')) {
        const section = target.closest('.section-wrapper');
        moveSection(section, infobox, 'up');
    } else if (target.classList.contains('cell-down-btn')) {
        const section = target.closest('.section-wrapper');
        moveSection(section, infobox, 'down');
    } else if (target.classList.contains('see-more-btn')) {
        toggleBio(row);
    } else if (target.classList.contains('delete-btn')) {
        deleteElement(row, infobox, infoboxes, 'infobox');
    } else if (target.classList.contains('add-section-btn')) {
        generateSection(row, infobox, null);
    } else if (target.classList.contains('generate-preset-btn')) {
        presetGenerateSection(row, infobox);
    } else if (target.classList.contains('toggle-category-btn')) {
        toggleCategory(row, infobox);
    } else if (target.classList.contains('add-infobox-btn2')) {
        generateRow(row, infobox, 'infobox');
    } else if (target.classList.contains('add-text-btn2')) {
        generateRow(row, infobox, 'text');
    } else if (target.classList.contains('add-table-btn2')) {
        generateRow(row, infobox, 'table');
    }else if (target.classList.contains('add-row-btn')) {
        generateMiniRow(row, infobox);
    } else if (target.classList.contains('add-data-btn')) {
        generateTableData(row, infobox);
    } else if (target.classList.contains('section-delete-btn')) {
        const sectionNode = target.closest('.section-wrapper');
        const sections = infobox.sections;
        const index = sectionNode.dataset.index;
        const section = sections.find(a => a.id == index);
        deleteElement(sectionNode, section, sections, 'section');
    } else if (target.classList.contains('row-delete-btn')) {
        const rowElement = target.closest('.row-wrapper');
        const rows = infobox.rows;
        const index = rowElement.dataset.index;
        const miniRow = rows.find(r => r.id == index);
        deleteElement(rowElement, miniRow, rows, 'mini row');
    } else if (target.classList.contains('row-delete2-btn')) {
        if (confirm('Are you sure you want to delete these cells?')) {
            deleteElement(target, infobox, null, 'table data');
        }
    } else if (target.classList.contains('row-up-btn')) {
        const rowElement = target.closest('.row-wrapper');
        moveMiniRow(rowElement, infobox, 'up');
    } else if (target.classList.contains('row-down-btn')) {
        const rowElement = target.closest('.row-wrapper');
        moveMiniRow(rowElement, infobox, 'down');
    } else if (target.classList.contains('row-left-btn')) {
        const rowDelete2Btn = target.parentNode.querySelector('.row-delete2-btn');
        const index = rowDelete2Btn.dataset.index;
        moveTableData(index, infobox, 'left');
    } else if (target.classList.contains('row-right-btn')) {
        const rowDelete2Btn = target.parentNode.querySelector('.row-delete2-btn');
        const index = rowDelete2Btn.dataset.index;
        moveTableData(index, infobox, 'right');
    } else if (target.classList.contains('toggle-add-btn2')) {
        const addBtn = row.querySelectorAll('.row-add-btn2');
        
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
    const infoboxTemplate = document.querySelectorAll('.character-wrapper');
    let previousPosition = -1;
          
    infoboxTemplate.forEach(template => {
        const index = template.getAttribute('data-index');
        const infobox = infoboxes.find(box => box.id == index);
        
        infobox.position = previousPosition + 1;
        previousPosition = infobox.position;
    });
}

function handleRowChange(event) {
    const target = event.target;
    const row = target.closest('.character-wrapper');
    const index = row ? row.dataset.index : null;
    const infobox = infoboxes.find(char => char.id == index);

    if (target.classList.contains('upload-img')) {
        const type = target.getAttribute('data-type');
        loadImage(event, infobox);
    }
}

function toggleCategory(row, category) {
    let id = category.id;
    let toggleButton = row.querySelector('.toggle-category-btn');
    let isVisible = getComputedStyle(toggleButton).backgroundImage.includes('https://i.ibb.co/s91K27m8/20251024-091953.png');
    const infoboxTemplate = document.querySelectorAll('.character-wrapper');
    
    infoboxTemplate.forEach(template => {
        const index = template.getAttribute('data-index');
        const infobox = infoboxes.find(box => box.id == index);
        
        if (infobox.category === id) {
            if (isVisible) {
                template.style.display = 'none';
            } else {
                template.style.display = 'block';
                allignCategory(row, category);
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
function generateRow(catTemplate, category, type) {
    const template = document.getElementById(`${type}-template`).content.cloneNode(true);
    const newId = Date.now();
    let newPosition = null;
    let firstRow;
    if (category) {
        newPosition = category.position + 1;
          
        infoboxes.forEach((infobox, index) => {
            if (infobox.position >= newPosition) {
                firstRow = firstRow ? firstRow : document.querySelector(`.character-wrapper[data-index="${infobox.id}"]`);
                infobox.position = index + 1;
            }
        });
    } else {
        newPosition = 0;
        
        if (infoboxes.length) {
            infoboxes.forEach((infobox, index) =>
                infobox.position = index + 1);
            
            firstRow = document.querySelector(`.character-wrapper[data-index="${infoboxes[0].id}"]`);
        }
    }
    const oldRows = JSON.parse(JSON.stringify(infoboxes));
    
    let newInfobox;
    if (type === 'category') {
        newInfobox = {
            id: newId,
            name: 'Category No.' + (infoboxes.length ? infoboxes.length + 1 : 1),
            type: 'category',
            position: newPosition
        };
        infoboxes.push(newInfobox);
        updateCategory(template, newInfobox);
    } else if (type === 'infobox') {
        newInfobox = {
            id: newId,
            name: 'Infobox No.' + (infoboxes.length ? infoboxes.length + 1 : 1),
            bio: 'Write description about the subject here...',
            imgSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/660px-No-Image-Placeholder.svg.png?20200912122019',
            type: 'infobox',
            category: category ? category.id : null,
            sections: [],
            position: newPosition
        };
        infoboxes.push(newInfobox);
        updateInfobox(template, newInfobox);
    } else if (type === 'text') {
        newInfobox = {
            id: newId,
            bio: 'Write description about the subject here...',
            type: 'text area',
            category: category ? category.id : null,
            position: newPosition
        };
        infoboxes.push(newInfobox);
        updateTextArea(template, newInfobox);
    } else if (type === 'table') {
        newInfobox = {
            id: newId,
            rows: [],
            type: 'table',
            category: null,
            position: newPosition
        };
        infoboxes.push(newInfobox);
        updateTable(template, newInfobox);
    }
    
    const element = template.querySelector('.character-wrapper');
    if (firstRow) {
        firstRow.parentNode.insertBefore(template, firstRow);
    } else {
        document.getElementById('row-list').appendChild(template);
    }
    infoboxes.sort((a, b) => a.position - b.position);
    actionManager(element, infoboxes, oldRows, 'element-change');
}

function updateCategory(row, category) {
    const editMode = editButton.template === '✔️';
    
    row.querySelector('.character-wrapper').setAttribute('data-index', category.id);
    if (editMode) {
        row.querySelector('.toggle-category-btn').style.backgroundImage = 'url(https://i.ibb.co/s91K27m8/20251024-091953.png)';
    }
    row.querySelector('.infobox-name').textContent = category.name;
}

function updateInfobox(row, infobox) {
    const editMode = editButton.textContent === '✔️';
    
    row.querySelector('.character-wrapper').setAttribute('data-index', infobox.id);
    if (editMode) {
        row.querySelector('.control-room').style.display = 'block';
    }
    row.querySelector('.infobox-name').textContent = infobox.name;
    const bioText = row.querySelector('.infobox-bio-text');
    bioText.innerHTML = infobox.bio;
    row.querySelector('.bio-input').addEventListener('input', (event) => {
      const element = event.target;
        const elementActions = undoList.filter(undo => undo.element === element);
        const lastText = elementActions.length ? elementActions[elementActions.length - 1].newData : bioText.innerHTML;
        
        actionManager(element, element.innerHTML, lastText, 'text-change');
    });
    row.querySelector('.infobox-img').src = infobox.imgSrc;
    const sections = infobox.sections;
    if (sections) {
        sections.sort((a, b) => a.position - b.position);
        sections.forEach(section => {
            const template = document.getElementById('section-template').content.cloneNode(true);
            updateSection(template, section);
            const rowDeleteCell = template.querySelector('.row-delete-cell');
            rowDeleteCell.style.display = 'none';
            row.querySelector('.section-lists').appendChild(template);
        });
    }
}

function updateTextArea(row, textArea) {
    row.querySelector('.character-wrapper').setAttribute('data-index', textArea.id);
    const bioText = row.querySelector('.infobox-bio-text');
    bioText.innerHTML = textArea.bio;
    row.querySelector('.bio-input').addEventListener('input', (event) => {
        const element = event.target;
        const elementActions = undoList.filter(undo => undo.element === element);
        const lastText = elementActions.length ? elementActions[elementActions.length - 1].newData : bioText.innerHTML;
        
        actionManager(element, element.innerHTML, lastText, 'text-change');
    });
}

function updateTable(element, table) {
    element.querySelector('.character-wrapper').setAttribute('data-index', table.id);
    const rowDelete2Template = document.getElementById('row2-template').content.cloneNode(true);
    const dataTemplate = document.getElementById('data-template').content.cloneNode(true);
    element.querySelector('.table-body').appendChild(rowDelete2Template);
    dataTemplate.querySelector('.data-wrapper').classList.toggle('writeble-element');
    element.querySelector('.row2-wrapper').appendChild(dataTemplate);
    const infoTitle = 
    element.querySelector('.row2-wrapper').querySelector('.info-title');
    infoTitle.textContent = '';
    const rows = table.rows;
    let firstRow = true;
    if (rows) {
        rows.sort((a, b) => a.position - b.position);
        rows.forEach(row => {
            const template = document.getElementById('row-template').content.cloneNode(true);
            updateMiniRow(template, row, true);
            element.querySelector('.table-body').appendChild(template);
            if (firstRow) {
                const rowDelete2Wrapper = element.querySelector('.row2-wrapper');
              
                const data = row.data;
                data.forEach(tableData => {
                    const rowDelete2Btn = document.getElementById('row-delete2-template').content.cloneNode(true);
                    rowDelete2Btn.querySelector('.row-delete2-btn').setAttribute('data-index', tableData.position);
                    rowDelete2Wrapper.appendChild(rowDelete2Btn);
                });
            }
            firstRow = false;
        });
    }
}

function generateMiniRow(row, infobox) {
    const rows = infobox.rows;
    const firstRow = rows.length ? false : true;
    let template;
    if (firstRow) {
        template = document.getElementById('row-template').content.cloneNode(true);
    } else {
        const previousRow = document.querySelector(`tr[data-index="${rows[rows.length - 1].id}"]`);
        template = document.createDocumentFragment();
        const clone = previousRow.cloneNode(true);
        template.appendChild(clone);
    }
    const newId = Date.now();
    const newPosition = rows.length ? rows[rows.length - 1].position + 1 : 0;
    const oldRows = JSON.parse(JSON.stringify(rows));

    const newRow = {
        id: newId,
        data: [],
        position: newPosition
    };
    rows.push(newRow);
    
    updateMiniRow(template, newRow, firstRow);
    const element = template.querySelector('.row-wrapper');
    row.querySelector('.table-body').appendChild(template);
    actionManager(element, rows, oldRows, 'element-change');
}

function updateMiniRow(rowElement, row, firstRow) {
    const template = document.getElementById('row-delete-template').content.cloneNode(true);
    if (firstRow) {
        rowElement.querySelector('.row-wrapper').setAttribute('data-index', row.id);
        rowElement.querySelector('.row-body').appendChild(template);
        
        const tableData = row.data;
        if (tableData) {
            tableData.sort((a, b) => a.position - b.position);
            tableData.forEach(data => {
                const template = document.getElementById('data-template').content.cloneNode(true);
                updateTableData(template, data, true);
                rowElement.querySelector('.row-body').appendChild(template);
            });
        }
    } else {
        rowElement.querySelector('.row-wrapper').setAttribute('data-index', row.id);
        
        const dataWrappers = rowElement.querySelectorAll('.data-wrapper');
        
        dataWrappers.forEach(wrapper => {
            const newId = Date.now();
            const tableData = row.data;
            tableData.sort((a, b) => a.position - b.position);
            const newPosition = tableData.length ? tableData[tableData.length - 1].position + 1 : 0;
          
            const newTableData = {
                id: newId + newPosition + 100,
                text: 'Write here',
                position: newPosition
            };
            row.data.push(newTableData);
            updateTableData(wrapper, newTableData, firstRow);
        });
    }
}

function generateTableData(tableElement, table) {
    const rows = table.rows;
    let previousPosition;
    
    rows.forEach(row => {
        const rowElement = document.querySelector(`tr[data-index="${row.id}"]`);
        const template = document.getElementById('data-template').content.cloneNode(true);
        const newId = Date.now();
        const tableData = row.data;
        const newPosition = tableData.length ? tableData[tableData.length - 1].position + 1 : 0;
      
        const newTableData = {
            id: newId,
            text: 'Write here',
            position: newPosition
        };
        row.data.push(newTableData);
        
        updateTableData(template, newTableData, true);
        const infoTitle = template.querySelector('.info-title');
        const inputWrapper = template.querySelector('.cell-input-wrapper');
        
        infoTitle.style.display = 'none';
        inputWrapper.style.display = 'block';
        rowElement.appendChild(template);
        previousPosition = newPosition;
    });
    const rowDelete2Btn = document.getElementById('row-delete2-template').content.cloneNode(true);
    const rowDelete2Wrapper = tableElement.querySelector('.row2-wrapper');
    rowDelete2Btn.querySelector('.row-delete2-btn').setAttribute('data-index', previousPosition)
    rowDelete2Wrapper.appendChild(rowDelete2Btn);
    saveState(12);
}

function updateTableData(template, tableData, firstRow) {
    if (firstRow) {
        template.querySelector('.data-wrapper').setAttribute('data-index', tableData.id);
    } else {
        template.setAttribute('data-index', tableData.id);
    }
    const infoTitle = template.querySelector('.info-title');
    const infoInput = template.querySelector('.info-input');
    infoTitle.innerHTML = tableData.text;
    infoInput.innerHTML = tableData.text;
    infoInput.addEventListener('input', (event) => {
        const element = event.target;
        const elementActions = undoList.filter(undo => undo.element === element);
        const lastText = elementActions.length ? elementActions[elementActions.length - 1].newData : infoTitle.innerHTML;
        
        actionManager(element, element.innerHTML, lastText, 'text-change');
    });
}

function loadImage(event, element) {
    if (event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            element.imgSrc = e.target.result;
            const row = document.querySelector(`.character-wrapper[data-index="${element.id}"]`);
            row.querySelector('.infobox-img').src = element.imgSrc;
        };
        reader.readAsDataURL(file);
    } else {
        element.imgSrc = prompt('Enter the URL', 'https://');
        const row = document.querySelector(`.character-wrapper[data-index="${element.id}"]`);
        row.querySelector('.infobox-img').src = element.imgSrc;
    }
}

// moves sections up and down inside infobox row
function moveSection(row, infobox, direction) {
    const previousRow = row.previousElementSibling;
    const nextRow = row.nextElementSibling;
    const index = row.getAttribute('data-index');
    const sections = infobox.sections;
    const currentSection = sections.find(sec => sec.id == index);
    const oldRows = JSON.parse(JSON.stringify(infoboxes));
    const rowList = document.getElementById('row-list');
    const oldData = rowList.innerHTML;
    
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
    actionManager(rowList, infoboxes, { oldRows, oldData }, 'element-change2');
}

// moves mini rows inside the table row
function moveMiniRow(row, table, direction) {
    const previousRowElement = row.previousElementSibling;
    const nextRowElement = row.nextElementSibling;
    const index = row.dataset.index;
    const rows = table.rows;
    const currentRow = rows.find(r => r.id == index);
    if (direction === 'up' && previousRowElement) {
        const previousIndex = Number(previousRowElement.dataset.index);
        const previousRow = rows.find(sec => sec.id === previousIndex);
        
        const currentPosition = currentRow.position;
        currentRow.position = previousRow.position;
        previousRow.position = currentPosition;
    
        row.parentNode.insertBefore(row, previousRowElement);
    } else if (direction === 'down' && nextRowElement) {
        const nextIndex = Number(nextRowElement.dataset.index);
        const nextRow = rows.find(sec => sec.id === nextIndex);
        
        const currentPosition = currentRow.position;
        currentRow.position = nextRow.position;
        nextRow.position = currentPosition;
    
        row.parentNode.insertBefore(nextRowElement, row);
    } else {
        let previousPosition = 0;
        
        rows.forEach(box => {
            box.position = previousPosition++;
        });
    }
    rows.sort((a, b) => a.position - b.position);
}

function moveTableData(position, table, direction) {
    const rows = table.rows;
    rows.forEach(row => {
        const tableData = row.data;
        const rowElement = document.querySelector(`.row-wrapper[data-index="${row.id}"]`);
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
}

function moveCell(row, currentCell, direction) {
    const previousRow = row.previousElementSibling;
    const nextRow = row.nextElementSibling;
    const oldRows = JSON.parse(JSON.stringify(cells));
    const oldData = row.parentNode.innerHTML;
    
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
    actionManager(row.parentNode, cells, { oldRows, oldData}, 'element-change2');
}

// moves infobox rows up and down
function moveInfobox(row, infobox, direction) {
    let previousInfobox;
    let nextInfobox;
    let previousRow;
    let nextRow;
    if (infobox.type === 'category') {
        const categories = infoboxes.filter(box => box.type == 'category');
        categories.sort((a, b) => a.position - b.position);
        previousInfobox = categories[categories.indexOf(infobox) - 1];
        nextInfobox = categories[categories.indexOf(infobox) + 1];
        previousRow = previousInfobox ? document.querySelector(`tr[data-index="${previousInfobox.id}"]`) : null;
        nextRow = nextInfobox ? document.querySelector(`tr[data-index="${nextInfobox.id}"]`) : null;
    } else {
        previousRow = row.previousElementSibling;
        nextRow = row.nextElementSibling;
        if (previousRow) {
            const previousIndex = Number(previousRow.dataset.index);
            previousInfobox = infoboxes.find(char => char.id === previousIndex);
        }
        if (nextRow) {
            const nextIndex = Number(nextRow.dataset.index);
            nextInfobox = infoboxes.find(char => char.id === nextIndex);
        }
    }
    const oldRows = JSON.parse(JSON.stringify(infoboxes));
    const oldData = row.parentNode.innerHTML;
    
    if (direction === 'up' && previousRow) {
        row.parentNode.insertBefore(row, previousRow);
        
        if (infobox.type === 'category') {
            allignCategory(row, infobox);
        } else {
            const currentPosition = infobox.position;
            infobox.position = previousInfobox.position;
            previousInfobox.position = currentPosition;
            
            console.log(infobox.position + ': ' + previousInfobox.position);
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
    infoboxes.sort((a, b) => a.position - b.position);
    actionManager(row.parentNode, infoboxes, { oldRows, oldData }, 'element-change2');
}

function allignCategory(row, category) {
    let id = category.id;
    const infoboxTemplate = document.querySelectorAll('.character-wrapper');
    const childsOfCat = infoboxes.filter(a => a.category === category.id);
    childsOfCat.sort((a, b) => a.position - b.position);
    let previousRow = row;
    
    if (childsOfCat.length) {
        childsOfCat.forEach(child => {
            const index = child.id;
            const childNode = document.querySelector(`.character-wrapper[data-index="${child.id}"]`);
            
            childNode.style.display = 'block';
            childNode.parentNode.insertBefore(childNode, previousRow.nextElementSibling);
            previousRow = childNode;
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
function generateSection(row, infobox, text) {
    const template = document.getElementById('section-template').content.cloneNode(true);
    const newId = Date.now();
    const sections = infobox.sections;
    const newPosition = sections.length ? sections[sections.length - 1].position + 1 : 0;
    const oldSections = JSON.parse(JSON.stringify(sections));

    const newSection = {
        id: newId,
        text1: text ? text : 'Write here',
        text2: 'Write here',
        position: newPosition
    };
    infobox.sections.push(newSection);
    
    updateSection(template, newSection);
    const textWrapper = template.querySelectorAll('.cell-text');
    const inputWrappers = template.querySelectorAll('.cell-input-wrapper');
    
    textWrapper.forEach(text => {
        text.style.display = 'none';
    })
    inputWrappers.forEach(input => {
        input.style.display = 'block';
    });
    const bioElement = row.querySelector('.infobox-bio');
    const element = template.querySelector('.section-wrapper');
    row.querySelector('.section-lists').appendChild(template);
    actionManager(element, sections, oldSections, 'element-change');
    bioElement.style.maxHeight = bioElement.scrollHeight + 'px';
}

function updateSection(template, section) {
    template.querySelector('.section-wrapper').setAttribute('data-index', section.id);
    template.querySelector('.info-title').innerHTML = section.text1;
    template.querySelector('.info-input').innerHTML = section.text1;
    template.querySelector('.value-cell').innerHTML = section.text2;
    template.querySelector('.value-input').innerHTML = section.text2;
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
    if (data.upperToolbar) {
        document.getElementById('upper-toolbar-btn').click();
    }
    if (data.infobox) {
        document.getElementById('infobox-toggle-btn').click();
    }
}

function loadState() {
    const transaction = db.transaction(['articles'], 'readonly');
    const articleStore = transaction.objectStore('articles');
    
    articleStore.get(currentArticleId).onsuccess = function(event) {
        const articleData = event.target.result;
        
        if (articleData) {
            data = articleData.data;
            infoboxes = articleData.characters;
            cells = articleData.cells;
            
            if (data.id) {
                updateData(data);
            } else {
                console.log("failed");
            }
            
            infoboxes.sort((a, b) => a.position - b.position);
            console.log(infoboxes);
            
            infoboxes.forEach(infobox => {
                let template;
                
                if (infobox.type === 'category') {
                  template = document.getElementById('category-template').content.cloneNode(true);
                  updateCategory(template, infobox);
                  const editorWrapper = template.querySelector('.infobox-name-controls');
                  const name = template.querySelector('.infobox-name');
                  const nameInput = template.querySelector('.name-input');
                  editorWrapper.style.display = 'none';
                  nameInput.style.display = 'none';
                  name.style.display = 'block';
                } else if (infobox.type === 'text area') {
                  template = document.getElementById('text-template').content.cloneNode(true);
                  updateTextArea(template, infobox);
                  const editorWrapper = template.querySelector('.infobox-name-controls');
                  const bio = template.querySelector('.infobox-bio-text');
                  const bioInput = template.querySelector('.bio-input');
                  editorWrapper.style.display = 'none';
                  bioInput.style.display = 'none';
                  bio.style.display = 'block';
                } else if (infobox.type === 'table') {
                  template = document.getElementById('table-template').content.cloneNode(true);
                  updateTable(template, infobox);
                  const editorWrapper = template.querySelector('.infobox-name-controls');
                  const rowDelete2Template = template.querySelector('.row2-wrapper');
                  const rowDeleteBtns = template.querySelectorAll('.row-delete-wrapper');
                  editorWrapper.style.display = 'none';
                  rowDeleteBtns.forEach(btn => {
                      btn.style.display = 'none';
                  });
                  rowDelete2Template.style.display = 'none';
                } else {
                  template = document.getElementById('infobox-template').content.cloneNode(true);
                  updateInfobox(template, infobox);
                  const editorWrapper = template.querySelector('.infobox-name-controls');
                  const name = template.querySelector('.infobox-name');
                  const bio = template.querySelector('.infobox-bio-text');
                  const nameInput = template.querySelector('.name-input');
                  const bioInput = template.querySelector('.bio-input');
                  editorWrapper.style.display = 'none';
                  nameInput.style.display = 'none';
                  bioInput.style.display = 'none';
                  name.style.display = 'block';
                  bio.style.display = 'block';
                }
                
                document.getElementById('row-list').appendChild(template);
            });
            
            cells.sort((a, b) => a.position - b.position);
            
            cells.forEach(cell => {
                let template;
                if (cell.text2) {
                    template = document.getElementById('info-template').content.cloneNode(true);
                } else {
                    template = document.getElementById('info-template2').content.cloneNode(true);
                }
                updateCell(template, cell, false);
                const rowDeleteCell = template.querySelector('.row-delete-cell');
                rowDeleteCell.style.display = 'none';
                document.getElementById('info-list').appendChild(template);
            });
            const writebleElements = document.querySelectorAll('.writeble-element');
            writebleElements.forEach(el => {
                el.style.backgroundColor = '#F1e7dd';
            });
        }
    };
}

function saveState(trigger) {
    const transaction = db.transaction(['articles'], 'readwrite');
    
    const articleStore = transaction.objectStore('articles');

    const articleData = {
        articleId: currentArticleId,
        data: data,
        characters: infoboxes,
        cells: cells,
    };
    articleStore.put(articleData);

    transaction.oncomplete = function() {
        console.log('Data saved to IndexedDB');
        console.log(trigger)
    };
}

function deleteElementFromArticle() {
    window.location.href = `index.html?articleId=${currentArticleId}`;
}

function deleteElement(row, element, array, type) {
    if (type !== 'table data') {
        if (confirm(`Are you sure you want to delete this ${type}?`)) {
            if (cells === array) {
                const oldArray = JSON.parse(JSON.stringify(array));
                actionManager(row, array, oldArray, 'element-change');
            } else {
                const oldArray = JSON.parse(JSON.stringify(infoboxes));
                actionManager(row, infoboxes, oldArray, 'element-change');
            }
            
            row.remove();
            array.splice(array.indexOf(element), 1);
        }
          
        array.forEach((el, index) => el.position = index);
    } else if (type === 'table data') {
        const target = row;
        const index = target.dataset.index;
        const parentRow = target.closest('.table-body');
        const oldData = parentRow.innerHTML;
        const rowDelete2Wrapper = target.closest('.row2-wrapper');
        target.parentNode.remove();
        const rowDelete2Btns = rowDelete2Wrapper.querySelectorAll('.row-delete2-btn');
        const rows = element.rows;
        const oldRows = JSON.parse(JSON.stringify(infoboxes));
        
        rowDelete2Btns.forEach((btn, i) => {
            btn.setAttribute('data-index', i);
        });
        
        rows.forEach(miniRow => {
            const tableData = miniRow.data;
            const cell = tableData.find(a => a.position == index);
            const rowElement = document.querySelector(`.data-wrapper[data-index="${cell.id}"]`);
            
            rowElement.remove();
            tableData.splice(miniRow.data.indexOf(cell), 1);
            
            tableData.forEach((cell, i) => cell.position = i);
        });
        actionManager(parentRow, infoboxes, { oldRows, oldData }, 'element-change2');
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
            generateSection(row, infobox, `<b>${cell.text}</b>`);
        }, index * 100);
    });
}