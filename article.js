let db;

function openDB() {
    const request = indexedDB.open('gameData', 7);

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
let rows = [];
let cells = [];
let undoList = [];
let redoList = [];
let previousSaves = [];
let articleName;
let currentArticleId;
let currentTextArea;
let toggleSynopsisBtn;
let toggleInfoboxBtn;
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
let toggleSidebarBtn;
let content;
let cursorMoved;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentArticleId = Number(urlParams.get('articleId'));
    articleName = decodeURIComponent(urlParams.get('articleTitle'));
    
    openDB();
    
    const inputPoster = document.getElementById('poster-input');
    toggleSynopsisBtn = document.getElementById('see-more-btn');
    toggleInfoboxBtn = document.getElementById('toggle-infobox-btn');
    toggleSidebarBtn = document.getElementById('sidebar-toggle-btn');
    editButton = document.getElementById('edit-article-btn');
    fileUploadBtn = document.getElementById('file-upload-btn');
    downloadBtn = document.getElementById('download-btn');
    settingsBtn = document.getElementById('settings-btn');
    toggleAddBtn = document.getElementById('toggle-add-btn');
    addRow1Btn = document.getElementById('add-infobox-btn');
    addRow2Btn = document.getElementById('add-category-btn');
    addRow3Btn = document.getElementById('add-text-btn');
    addCell1Btn = document.getElementById('add-info-btn1');
    addCell2Btn = document.getElementById('add-info-btn2');
    content = document.getElementById('content');
    content.style.display = 'none';
    toggleSynopsisBtn.addEventListener('click', toggleSynopsisBio);
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
    addRow1Btn.addEventListener('click', () => generateRow(null, null, rows, document.getElementById('row-list'), 'infobox'));
    document.getElementById('add-table-btn').addEventListener('click', () => generateRow(null, null, rows, document.getElementById('row-list'), 'table'));
    addRow2Btn.addEventListener('click', () => generateRow(null, null, rows, document.getElementById('row-list'), 'category'));
    addRow3Btn.addEventListener('click', () => generateRow(null, null, rows, document.getElementById('row-list'), 'text-area'));
    toggleInfoboxBtn.addEventListener('click', toggleRowList);
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
    document.getElementById('show-code-btn').addEventListener('click', function () {
        const codeBlock = document.getElementById('show-code');
        
        if (codeBlock.style.display !== 'block') {
            codeBlock.style.display = 'block';
            
            const clone = content.cloneNode(true);
        
            clone.querySelectorAll('img').forEach(img => img.setAttribute('src', '[REDACTED]'));
            
            codeBlock.value = clone.innerHTML;
            this.innerHTML = `<b>Hide Code</b>`;
        } else {
            codeBlock.style.display = 'none';
            this.innerHTML = `<b>Show Code</b>`;
        }
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
    toggleSidebarBtn.addEventListener('click', function () {
        const sidebar = document.getElementById('sidebar');
        
        sidebar.classList.toggle('show');
        
        if (sidebar.classList.contains('show')) {
            this.innerHTML = '◀';
        } else {
            this.innerHTML = '▶';
        }
    });
    fileUploadBtn.addEventListener('click', () => {
      document.getElementById('upload-input').click();
    });
    document.getElementById('upload-input').addEventListener('change', uploadFile);
    downloadBtn.addEventListener('click', downloadFile);
    document.getElementById('upload-img-btn').addEventListener('click', function () {
      const imgBtn = this.parentNode.querySelectorAll('.infobox-img-btn');
      let buttonDisplay;
      if (getComputedStyle(imgBtn[0]).display.includes('none')) {
          this.textContent = '❌️';
          buttonDisplay = 'inline-flex';
      } else {
          this.textContent = '📷';
          buttonDisplay = 'none';
      }
    
      imgBtn.forEach(button => {
          button.style.display = buttonDisplay;
      });
    });
    document.getElementById('img-file-btn2').addEventListener('click', () => {
      inputPoster.click();
    });
    document.getElementById('img-link-btn2').addEventListener('click', () => {
      const url = prompt('Enter the URL', 'https://');
      if (!url || url === 'https://') return;
      const oldPoster = data.poster;
      data.poster = url;
      const poster = document.getElementById('poster');
      poster.src = data.poster;
      actionManager(poster, null, data.poster, oldPoster, 'image-change');
    });
    inputPoster.addEventListener('change', function () {
      const reader = new FileReader();
      reader.onload = function(e) {
        const oldPoster = data.poster;
        data.poster = e.target.result;
        const poster = document.getElementById('poster');
        poster.src = data.poster;
        actionManager(poster, null, data.poster, oldPoster, 'image-change');
      }
      
      reader.readAsDataURL(this.files[0]);
    });
    document.getElementById('main-page-btn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    document.getElementById('articles-toggle-btn').addEventListener('click', toggleList);
    document.getElementById('toggle-saves-btn').addEventListener('click', toggleList);
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
    document.getElementById('synopsis-text-input').addEventListener('input', handleTextInput);
    document.getElementById('synopsis-text-input').addEventListener('click', handleTextClick);
});

function handleTextClick(event) {
    const element = event.target;
    const selectedText = textBeforeCursor(element);
    const elementActions = undoList.filter(action => action.element == element);
    const lastText = elementActions.length ? elementActions[elementActions.length - 1].tempText.selectedText : null;
    if (lastText && lastText.length !== selectedText.length) {
        cursorMoved = true;
    }
}

function handleTextInput(event) {
    const element = event.target;
    const elementActions = undoList.filter(undo => undo.element === element);
    const lastText = elementActions.length ? elementActions[elementActions.length - 1].newData : data.intro + '<br>' + data.synopsis;
    
    actionManager(element, null, element.innerHTML, lastText, 'text-change');
}

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
    const introWrapper = document.getElementById('intro-wrapper');
    const presetBtn1 = document.getElementById('enable-preset1');
    const presetBtn2 = document.getElementById('enable-preset2');
    
    if (data.infobox) {
        mainInfobox.style.display = 'table';
        presetBtn1.style.display = 'inline';
        presetBtn2.style.display = 'inline';
        introWrapper.style.width = '';
        infoboxToggleBtn.innerHTML = `<b>Main Infobox: Show</b>`;
    } else {
        mainInfobox.style.display = 'none';
        presetBtn1.style.display = 'none';
        presetBtn2.style.display = 'none';
        introWrapper.style.width = '100%';
        infoboxToggleBtn.innerHTML = `<b>Main Infobox: Hide</b>`;
    }
}

function toggleList(event) {
    const parentNode = event.target.closest('.section-list-wrapper');
    const nodeList = parentNode.querySelector('.node-list');
    const toggleBtnImg = parentNode.querySelector('.toggle-btn-img');
    
    if (nodeList.style.display !== 'block') {
        nodeList.style.display = 'block';
        toggleBtnImg.src = 'https://i.ibb.co/s91K27m8/20251024-091953.png';
    } else {
        nodeList.style.display = 'none';
        toggleBtnImg.src = 'https://i.ibb.co/6q919Xb/20251024-055350.png';
    }
}

function actionManager(element, object, newData, oldData, type) {
    let newAction = {};
    if (type === 'text-change') {
        const selectedText = textBeforeCursor(element);
        const elementActions = undoList.filter(undo => undo.element === element);
        const previousAction = elementActions[elementActions.length - 1];
        if (elementActions.length) {
            if (selectedText.endsWith('\u00A0') || previousAction.tempText.selectedText.length > selectedText.length || cursorMoved) {
                previousAction.newData = previousAction.tempText.newData;
                cursorMoved = false;
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
    } else if (type === 'image-change') {
        newAction = {
          newData,
          oldData,
          type,
          element
        };
    } else if (type === 'element-delete') {
        newAction = {
          object,
          type
        }
    } else if (type === 'element-move') {
        if (newData[0].position === oldData[0].position && newData[0].parentArray === oldData[0].parentArray) return;
        newAction = {
          object,
          newData,
          oldData,
          type
        }
    }
    undoList.push(newAction);
    
    redoList = [];
}

function textBeforeCursor(element) {
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
        if (previousAction.oldData.replace(/&nbsp;/g, '') === previousAction.newData.replace(/&nbsp;/g, '')) {
            undoManager();
            return;
        }
        
        element.innerHTML = previousAction.oldData;
    } else if (type === 'image-change') {
        element.src = previousAction.oldData;
    } else if (type === 'element-delete') {
        reAlignRows(previousAction.object, null);
        previousAction.object.reverse();
    } else if (type === 'element-move') {
        reAlignRows(previousAction.object, previousAction.oldData);
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
    } else if (type === 'image-change') {
        element.src = previousAction.newData;
    } else if (type === 'element-delete') {
        reAlignRows(previousAction.object, null);
        previousAction.object.reverse();
    } else if (type === 'element-move') {
        reAlignRows(previousAction.object, previousAction.newData);
    }
    undoList.push(previousAction);
}

function reAlignRows(objects, savedObjects) {
    objects.forEach((object, i) => {
        if (savedObjects) {
            const savedObject = savedObjects[i];
            if (object.parentArray !== savedObject.parentArray) {
              object.parentArray.splice(object.parentArray.indexOf(object), 1);
              object.parentArray.forEach((obj, index) => {
                obj.position = index;
              });
            }
            object.parentArray = savedObject.parentArray;
            object.parentNode = savedObject.parentNode;
            object.position = savedObject.position;
        }
        
        const parentArray = object.parentArray;
        const node = object.node;
        const parentNode = object.parentNode;
        
        if (!node.isConnected || savedObjects) {
            if (parentArray.includes(object)) {
                parentArray.splice(parentArray.indexOf(object), 1);
            }

            parentArray.splice(object.position, 0, object);
            const nextNode = parentArray[object.position + 1]?.node;
            if (nextNode) {
                parentNode.insertBefore(node, nextNode);
            } else {
                parentNode.appendChild(node);
            }
        } else {
            node.remove();
            parentArray.splice(parentArray.indexOf(object), 1);
        }
        parentArray.forEach((obj, index) => {
          obj.position = index;
        });
        console.log(rows.map(row => row.type), rows.flatMap(row => row.categoryRows ?? []).map(row => row.type))
        if (node.classList.contains('data-wrapper')) {
            updateRowDelete2Btn(parentNode.closest('.table-body'), parentArray);
        }
    });
}

function toggleSynopsisBio(event) {
    const synopsisElement = document.getElementById('synopsis-wrapper');
    const btnElement = event.target;

    if (synopsisElement.style.maxHeight) {
        synopsisElement.style.maxHeight = '';
        btnElement.textContent = 'show more';
    } else {
        synopsisElement.style.maxHeight = synopsisElement.scrollHeight + 'px';
        btnElement.textContent = 'show less';
    }
}

function toggleRowList(event) {
    const button = event.target;
    const isVisible = getComputedStyle(button).backgroundImage.includes('https://i.ibb.co/s91K27m8/20251024-091953.png');
    const table = document.getElementById('row-list');
    const rowNodes = document.querySelectorAll('.category-wrapper');
  
    if (!isVisible) {
        table.style.display = 'block';
        button.style.backgroundImage = 'url(https://i.ibb.co/s91K27m8/20251024-091953.png)';
        
        rowNodes.forEach(node => {
            const toggleCategoryBtn = getComputedStyle(node.querySelector('.toggle-category-btn')).backgroundImage;
            
            if (toggleCategoryBtn && toggleCategoryBtn.includes('https://i.ibb.co/6q919Xb/20251024-055350.png')) {
                node.querySelector('.category-row-list').style.display = 'none';
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
    asignProperties(newCell, element, cells)
    actionManager(null, [newCell], null, null, 'element-delete');
}

function updateCell(template, cell) {
    const cellNode = template.querySelector('.info-wrapper') || template;
    cellNode.setAttribute('data-index', cell.id);
    cellNode.querySelector('.info-title').innerHTML = cell.text1;
    cellNode.querySelector('.info-input').innerHTML = cell.text1;
    const infoInput = cellNode.querySelector('.info-input');
    infoInput.addEventListener('focus', function(event) {
        currentTextArea = event.target;
    });
    if (cell.text2) {
        cellNode.querySelector('.value-cell').innerHTML = cell.text2;
        cellNode.querySelector('.value-input').innerHTML = cell.text2;
        const valueInput = cellNode.querySelector('.value-input');
        valueInput.addEventListener('focus', function(event) {
            currentTextArea = event.target;
        });
    }
}

function editArticle() {
    const controlRoom = document.querySelectorAll('.control-room');
    const toolbar = document.getElementById('toolbar');
    const mainInfobox = document.getElementById('infobox');
    const title = document.getElementById('title');
    const introText = document.getElementById('intro');
    const introWrapper = document.getElementById('intro-wrapper');
    const synopsisText = document.getElementById('synopsis-text');
    const titleInput = document.getElementById('title-input');
    const poster = document.getElementById('poster');
    const articleTitle = document.querySelector(`.article-section[data-id="${currentArticleId}"]`).querySelector('.article-title');
    const synopsisInput = document.getElementById('synopsis-text-input');
    const container = document.getElementById('container');
    const rowList = document.getElementById('row-list');
    document.getElementById('poster-wrapper').classList.toggle('row-edit-mode');
    const editMode = editButton.textContent === '✏️';
    
    if (db) {
        editRow(editMode);
        editMainInfobox(editMode);
        if (editMode) {
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
            synopsisInput.innerHTML = data.intro + '<br>' + data.synopsis;
            synopsisInput.style.display = 'block';
            if (toggleSynopsisBtn.textContent === 'show more') {
                toggleSynopsisBtn.click();
            }
            introWrapper.style.display = 'none';
            synopsisText.style.display = 'none';
            editButton.textContent = '✔️';
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
            data.poster = poster.src;
            title.textContent = data.title;
            synopsisText.innerHTML = synopsisInput.innerHTML;
            let outputText = synopsisText.innerHTML.split('<br>')[0];
            if (getComputedStyle(toggleSidebarBtn).display.includes('none')) {
                data.intro = outputText;
                data.synopsis = synopsisText.innerHTML.replace(outputText, '');
            } else {
                data.intro = outputText;
                introText.innerHTML = data.intro;
                data.synopsis = synopsisText.innerHTML.replace(outputText + '<br>', '');
                synopsisText.innerHTML = data.synopsis;
            }
            synopsisInput.style.display = 'none';
            introWrapper.style.display = 'block';
            synopsisText.style.display = 'block';
            toolbar.style.display = 'none';
            editButton.textContent = '✏️';
            assignCategoriesToRows();
            saveState(6);
        }
    }
}

function assignCategoriesToRows() {
  let previousParentNode = null;
  let currentSubCategoryId = null;
  rows.sort((a, b) => a.position - b.position);

  rows.flatMap(row => row.categoryRows ?? []).forEach(row => {
      const rowNode = row.node;
      if (row.type === "sub-category") {
          currentSubCategoryId = row.id;
      } else if (previousParentNode === rowNode.parentNode) {
          row.subCategory = currentSubCategoryId;
          rowNode.dataset.subCategory = currentSubCategoryId;
      } else {
          currentSubCategoryId = null;
          row.subCategory = currentSubCategoryId;
          rowNode.dataset.subCategory = currentSubCategoryId;
      }
      console.log(row?.subCategory);
      previousParentNode = rowNode.parentNode;
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
        const index = node.getAttribute('data-index');
        const row = [...rows, ...rows.flatMap(row => row.categoryRows ?? [])].find(row => row.id == index);
        const toggleCategoryBtn = node.querySelector('.toggle-category-btn');
        const isCategoryVisible = toggleCategoryBtn ? getComputedStyle(toggleCategoryBtn).backgroundImage.includes('https://i.ibb.co/s91K27m8/20251024-091953.png') : null;
          
        if (editMode) {
            if (row.type === 'category') {
                if (!isCategoryVisible) {
                    toggleCategoryBtn.click();
                }
            }
            node.classList.toggle('row-edit-mode');
            if (row.type === 'infobox' || row.type === 'sub-category' || row.type === 'category') {
                nameInput.value = nameText.textContent;
            }
            
            if (row.type === 'infobox' || row.type === 'text-area') {
                bioInput.innerHTML = bioText.innerHTML;
            }
            if (row.type === 'infobox') {
                editSection(node, row, editMode);
            }
        } else {
            node.classList.toggle('row-edit-mode');
            if (row.type === 'infobox' || row.type === 'sub-category' || row.type === 'category') {
                if (nameInput.value.trim()) {
                    row.name = nameInput.value;
                    nameText.textContent = nameInput.value;
                }
            }
            
            if (row.type === 'infobox') {
                row.imgSrc = infoboxImg.src;
            }
            
            if (row.type === 'infobox' || row.type === 'text-area') {
                if (bioInput.innerHTML.trim()) {
                    row.bio = bioInput.innerHTML;
                    bioText.innerHTML = bioInput.innerHTML;
                }
            }
            if (row.type === 'infobox') {
                editSection(node, row, editMode);
            }
        }
        
        if (row.type === 'table') {
            const miniRows = row.miniRows;
            
            miniRows.forEach(miniRow => {
                const miniRowNode = node.querySelector(`.mini-row-wrapper[data-index="${miniRow.id}"]`);
                editTableData(miniRowNode, miniRow, editMode);
            });
        }
    });
}

function editTableData(rowElement, row, editMode) {
    const dataWrappers = rowElement.querySelectorAll('.data-wrapper');
    const tableData = row.data;
    
    if (dataWrappers) {
        dataWrappers.forEach(wrapper => {
            const infoTitle = wrapper.querySelector('.info-title');
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
            const rowCell3 = section.querySelector('.infobox-cell3');
            const infoTitle = section.querySelector('.info-title');
            const valueCell = section.querySelector('.value-cell');
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
    
    if (editButton.textContent === '✔️') {
        editButton.click();
    }
    currentArticleId = Number(article.dataset.id);
    document.getElementById('article-list').innerHTML = '';
    document.getElementById('row-list').innerHTML = '';
    document.getElementById('info-list').innerHTML = '';
    document.getElementById('save-list').innerHTML = '';
    loadState();
}

function handleSaveClick(event) {
    const target = event.target;
    const section = target.closest('.save-state-section');
    const previousSave = previousSaves.find(save => save.id == section.dataset.id);
    
    data = JSON.parse(JSON.stringify(previousSave.data));
    rows = JSON.parse(JSON.stringify(previousSave.rows));
    cells = JSON.parse(JSON.stringify(previousSave.cells));
    document.getElementById('row-list').innerHTML = '';
    document.getElementById('info-list').innerHTML = '';
    loadState(true);
}

function handleCellClick(event) {
    const target = event.target;
    const cellNode = target.closest('.info-wrapper');
    const index = cellNode ? cellNode.dataset.index : null;
    const cell = cells.find(el => el.id == index);
    
    if (target.classList.contains('cell-up-btn')) {
        moveCell(cellNode, cell, 'up');
    } else if (target.classList.contains('cell-down-btn')) {
        moveCell(cellNode, cell, 'down');
    } else if (target.classList.contains('row-delete-btn')) {
        deleteElement(cellNode, cell, cells, 'cell');
    } else if (target.classList.contains('info-input') || target.classList.contains('value-input')) {
        handleTextClick(event);
    }
}

function handleCellInput(event) {
    const element = event.target;
    const cellNode = element.closest('.info-wrapper');
    
    if (element.classList.contains('info-input')) {
        const infoText = cellNode.querySelector('.info-title');
        const elementActions = undoList.filter(undo => undo.element === element);
        const lastText = elementActions.length ? elementActions[elementActions.length - 1].newData : infoText.innerHTML;
        
        actionManager(element, null, element.innerHTML, lastText, 'text-change');
    } else if (element.classList.contains('value-input')) {
        const valueText = cellNode.querySelector('.value-cell');
        const elementActions = undoList.filter(undo => undo.element === element);
        const lastText = elementActions.length ? elementActions[elementActions.length - 1].newData : valueText.innerHTML;
        
        actionManager(element, null, element.innerHTML, lastText, 'text-change');
    }
}

function handleRowClick(event) {
    const target = event.target;
    const rowNode = target.closest('.row-wrapper');
    const row = [...rows, ...rows.flatMap(row => row.categoryRows ?? [])].find(char => char.node === rowNode);

    if (target.classList.contains('upload-img-btn')) {
        const imgBtn = rowNode.querySelectorAll('.infobox-img-btn');
        let buttonDisplay;
        if (getComputedStyle(imgBtn[0]).display.includes('none')) {
            target.textContent = '❌️';
            buttonDisplay = 'inline-flex';
        } else {
            target.textContent = '📷';
            buttonDisplay = 'none';
        }
      
        imgBtn.forEach(button => {
            button.style.display = buttonDisplay;
        });
    } else if (target.classList.contains('img-file-btn')) {
        rowNode.querySelector('.upload-img').click();
    } else if (target.classList.contains('img-link-btn')) {
        loadImage(null, row);
    } else if (target.classList.contains('move-up-btn')) {
        moveRow(rowNode, row, 'up');
    } else if (target.classList.contains('move-down-btn')) {
        moveRow(rowNode, row, 'down');
    } else if (target.classList.contains('cell-up-btn')) {
        const section = target.closest('.section-wrapper');
        moveSection(section, row, 'up');
    } else if (target.classList.contains('cell-down-btn')) {
        const section = target.closest('.section-wrapper');
        moveSection(section, row, 'down');
    } else if (target.classList.contains('see-more-btn')) {
        toggleBio(rowNode, target);
    } else if (target.classList.contains('copy-row-btn')) {
        generateRow(rowNode, row, row.parentArray, rowNode.parentNode, 'copy');
    } else if (target.classList.contains('delete-btn')) {
        const className = rowNode.classList[0];
        const type = className.replace('-wrapper', '');
        deleteElement(rowNode, row, row.parentArray, type);
    } else if (target.classList.contains('add-section-btn')) {
        generateSection('section-template', rowNode, row, null);
    } else if (target.classList.contains('add-section-btn2')) {
        generateSection('section-template2', rowNode, row, null);
    } else if (target.classList.contains('generate-preset-btn')) {
        presetGenerateSection(rowNode, row);
    } else if (target.classList.contains('toggle-category-btn')) {
        toggleCategory(rowNode);
    } else if (target.classList.contains('add-sub-cat-btn')) {
        const rowList = rowNode.querySelector('.category-row-list');
        const rowArray = row.categoryRows;
        generateRow(rowNode, row, rowArray, rowList, 'sub-category');
    } else if (target.classList.contains('add-infobox-btn2')) {
        const rowList = row.type === 'category' ? rowNode.querySelector('.category-row-list') : rowNode.parentNode;
        const rowArray = row.type === 'category' ? row.categoryRows : row.parentArray;
        generateRow(rowNode, row, rowArray, rowList, 'infobox');
    } else if (target.classList.contains('add-text-btn2')) {
        const rowList = row.type === 'category' ? rowNode.querySelector('.category-row-list') : rowNode.parentNode;
        const rowArray = row.type === 'category' ? row.categoryRows : row.parentArray;
        generateRow(rowNode, row, rowArray, rowList, 'text-area');
    } else if (target.classList.contains('add-table-btn2')) {
        const rowList = row.type === 'category' ? rowNode.querySelector('.category-row-list') : rowNode.parentNode;
        const rowArray = row.type === 'category' ? row.categoryRows : row.parentArray;
        generateRow(rowNode, row, rowArray, rowList, 'table');
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
        moveTableData(row, index, 'left');
    } else if (target.classList.contains('row-right-btn')) {
        const rowDelete2Btn = target.parentNode.querySelector('.row-delete2-btn');
        const index = rowDelete2Btn.dataset.index;
        moveTableData(row, index, 'right');
    } else if (target.classList.contains('toggle-add-btn2')) {
        console.log(rowNode.children[0].classList)
        const addBtn = rowNode.children[0].querySelectorAll('.row-add-btn2');
        
        addBtn.forEach(button => {
            if (getComputedStyle(button).display.includes('none')) {
                button.style.display = 'inline-flex';
            } else {
                button.style.display = 'none';
            }
        });
    } else if (target.classList.contains('bio-input') || target.classList.contains('info-input') || target.classList.contains('value-input')) {
        handleTextClick(event);
    }
}

function alignRows(rowNodes, array) {
    rowNodes.forEach((node, i) => {
        const row = array.find(row => row.node == node);
        row.position = i;
    });
    array.sort((a, b) => a.position - b.position);
}

function handleRowInput(event) {
    const element = event.target;
    
    if (element.classList.contains('bio-input')) {
        const bio = element.parentNode.querySelector('.infobox-bio-text');
        const elementActions = undoList.filter(undo => undo.element === element);
        const lastText = elementActions.length ? elementActions[elementActions.length - 1].newData : bio.innerHTML;
        
        actionManager(element, null, element.innerHTML, lastText, 'text-change');
    } else if (element.classList.contains('info-input')) {
        const infoText = element.parentNode.parentNode.querySelector('.info-title');
        const elementActions = undoList.filter(undo => undo.element === element);
        const lastText = elementActions.length ? elementActions[elementActions.length - 1].newData : infoText.innerHTML;
        
        actionManager(element, null, element.innerHTML, lastText, 'text-change');
    } else if (element.classList.contains('value-input')) {
        const valueText = element.parentNode.parentNode.querySelector('.value-cell');
        const elementActions = undoList.filter(undo => undo.element === element);
        const lastText = elementActions.length ? elementActions[elementActions.length - 1].newData : valueText.innerHTML;
        
        actionManager(element, null, element.innerHTML, lastText, 'text-change');
    }
}

function handleRowChange(event) {
    const target = event.target;
    const rowNode = target.closest('.row-wrapper');
    const row = [...rows, ...rows.flatMap(row => row.categoryRows ?? [])].find(row => row.node === rowNode);

    if (target.classList.contains('upload-img')) {
        loadImage(event, row);
    }
}

function toggleCategory(catNode) {
    let toggleButton = catNode.querySelector('.toggle-category-btn');
    let isVisible = getComputedStyle(toggleButton).backgroundImage.includes('https://i.ibb.co/s91K27m8/20251024-091953.png');
    const rowList = catNode.querySelector('.category-row-list');
    
    if (isVisible) {
        toggleButton.style.backgroundImage = 'url(https://i.ibb.co/6q919Xb/20251024-055350.png)';
        rowList.style.display = 'none';
    } else {
        toggleButton.style.backgroundImage = 'url(https://i.ibb.co/s91K27m8/20251024-091953.png)';
        rowList.style.display = 'block';
    }
}

// generates rows
function generateRow(elementNode, element, rowArray, rowList, type) {
    let template;
    let isClone;
    let firstRow;
    let objects = [];
    const newId = Date.now();
    if (type === 'copy') {
        type = element.type;
        isClone = true;
        template = document.getElementById(`${type}-template`).content.cloneNode(true);
        
        const clone = JSON.parse(JSON.stringify(element));
        clone.id = newId;
        objects.push(updateRow(template, clone, element.parentArray, element.parentNode, type, isClone));
        const rowElement = template.querySelector('.row-wrapper');
        if (type === 'category' || type === 'sub-category') {
            let childRowNodes;
            if (type === 'category') {
                rowList.insertBefore(clone.node, elementNode.nextElementSibling);
            } else {
                childRows = rowArray.filter(row => row.subCategory === element.id);
                childRowNodes = elementNode.closest('.category-wrapper').querySelectorAll(`.row-wrapper[data-sub-category="${element.id}"]`);
                firstRow = childRowNodes.length ? childRowNodes[childRowNodes.length - 1] : elementNode;
                rowList.insertBefore(template, firstRow.nextElementSibling);
                firstRow = rowElement;
                childRows.forEach((row, i) => {
                    const cloneTemplate = document.getElementById(`${row.type}-template`).content.cloneNode(true);
                    const object = JSON.parse(JSON.stringify(row));
                    const cloneNode = cloneTemplate.querySelector('.row-wrapper');
                    object.id = newId + i + 1;
                    object.subCategory = newId;
                    
                    objects.push(updateRow(cloneNode, object, rowArray, rowList, object.type, true));
                    rowList.insertBefore(cloneNode, firstRow.nextElementSibling);
                    firstRow = cloneNode;
                });
            }
        } else {
            rowList.insertBefore(template, elementNode.nextElementSibling);
        }
    } else {
        template = document.getElementById(`${type}-template`).content.cloneNode(true);
        
        isClone = false;
        objects.push(updateRow(template, element, rowArray, rowList, type, isClone));
        element?.type === 'sub-category' ? rowList.insertBefore(template, elementNode.nextElementSibling) : rowList.prepend(template);
    }
    alignRows([...rowList.children], rowArray);
    actionManager(null, objects, null, null, 'element-delete');
} 

function updateRow(template, row, parentArray, parentNode, type, isClone) {
    const newId = Date.now();
    let newRow;
    let categoryId = null;
    let subCategoryId = null;
    if (row?.type === 'category') {
        categoryId = row.id;
    } else if (row?.type === 'sub-category') {
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
        parentArray.push(newRow);
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
        parentArray.push(newRow);
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
                subCategory: subCategoryId,
                sections: [],
                position: 0
            };
        }
        parentArray.push(newRow);
        updateInfobox(template, newRow);
    } else if (type === 'text-area') {
        if (isClone) {
            newRow = row;
        } else {
            newRow = {
                id: newId,
                bio: 'Write description about the subject here...',
                type: 'text-area',
                subCategory: subCategoryId,
                position: 0
            };
        }
        parentArray.push(newRow);
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
                subCategory: subCategoryId,
                miniRows: [],
                position: 0
            };
        }
        parentArray.push(newRow);
        updateTable(template, newRow);
    }
    Object.defineProperties(newRow, {
        parentArray: {
            value: parentArray ?? rows,
            enumerable: false,
            writable: true,
            configurable: true
        },
        parentNode: {
            value: parentNode,
            enumerable: false,
            writable: true,
            configurable: true
        },
        node: {
            value: template.querySelector('.row-wrapper') ?? template,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
    return newRow;
}

function updateCategory(row, category) {
    const editMode = editButton.textContent === '✔️';
    const categoryNode = row.querySelector('.row-wrapper') || row;
    
    row.querySelector('.row-wrapper').dataset.index = category.id;
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
    
    category.categoryRows = category.categoryRows ? category.categoryRows : rows.filter(miniRow => miniRow.category === category.id);
    const categoryRows = category.categoryRows;
    
    categoryRows.forEach((miniRow, i) => {
        if (!miniRow.type) {
            miniRow.type = 'infobox';
        }
        if (miniRow.category) {
            delete miniRow.category;
        }
        if (rows.includes(miniRow)) {
            rows.splice(rows.indexOf(miniRow), 1);
        }
        miniRow.position = i;
        
        const template = document.getElementById(`${miniRow.type}-template`).content.cloneNode(true);
        const childNode = template.children[0];
        if (miniRow.type === 'sub-category') {
          updateSubCategory(template, miniRow);
        } else if (miniRow.type === 'text-area' || miniRow.type === 'text') {
          updateTextArea(template, miniRow);
        } else if (miniRow.type === 'table') {
          updateTable(template, miniRow);
        } else if (miniRow.type === 'infobox') {
          updateInfobox(template, miniRow);
        }
        
        row.querySelector('.category-row-list').appendChild(template);
        asignProperties(miniRow, childNode, categoryRows);
    });
}

function updateSubCategory(row, subCategory) {
    const editMode = editButton.textContent === '✔️';
    const subCatNode = row.querySelector('.row-wrapper') || row;
    
    subCatNode.dataset.index = subCategory.id;
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

function updateInfobox(row, infobox) {
    const infoboxNode = row.querySelector('.row-wrapper') || row;
    
    infoboxNode.dataset.index = infobox.id;
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
    
    const sections = infobox.sections;
    if (sections) {
        sections.sort((a, b) => a.position - b.position);
        sections.forEach(section => {
            let template;
            if (section.text2) {
                template = document.getElementById('section-template').content.cloneNode(true);
            } else {
                template = document.getElementById('section-template2').content.cloneNode(true);
            }
            updateSection(template, section);
            const sectionNode = template.querySelector('.section-wrapper');
            row.querySelector('.section-lists').appendChild(template);
            asignProperties(section, sectionNode, sections);
        });
    }
}

function updateTextArea(row, textArea) {
    const editMode = editButton.textContent === '✔️';
    const textAreaNode = row.querySelector('.row-wrapper') || row;
    
    textAreaNode.dataset.index = textArea.id;
    textAreaNode.dataset.subCategory = textArea.subCategory;
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

function updateTable(template, table) {
    const tableNode = template.querySelector('.row-wrapper') || template;
    
    tableNode.dataset.index = table.id;
    tableNode.dataset.subCategory = table.subCategory;
    
    const editMode = editButton.textContent === '✔️';
    
    if (editMode) {
        tableNode.classList.add('row-edit-mode');
    } else {
        tableNode.classList.remove('row-edit-mode');
    }
    const rowDelete2Template = document.getElementById('row2-template').content.cloneNode(true);
    tableNode.querySelector('.table-body').appendChild(rowDelete2Template);
    
    const miniRows = table.miniRows;
    if (miniRows) {
        miniRows.sort((a, b) => a.position - b.position);
        miniRows.forEach(row => {
            template = document.getElementById('row-template').content.cloneNode(true);
            updateMiniRow(template, row);
            const miniRowNode = template.children[0];
            tableNode.querySelector('.table-body').appendChild(template);
            asignProperties(row, miniRowNode, miniRows);
        });
        if (miniRows[0]?.data?.length) {
            updateRowDelete2Btn(tableNode, miniRows[0].data);
        }
    }
}

function updateRowDelete2Btn(tableNode, dataCells) {
    const rowDelete2Wrapper = tableNode?.querySelector('.row2-wrapper');
    const rowDelete2Btns = rowDelete2Wrapper?.querySelectorAll('.row-delete2-wrapper');
    rowDelete2Btns?.forEach(btn => btn.remove());
    dataCells?.forEach(cell => {
        const rowDelete2Btn = document.getElementById('row-delete2-template').content.cloneNode(true);
        rowDelete2Btn.querySelector('.row-delete2-btn').dataset.index = cell.position;
        rowDelete2Wrapper.appendChild(rowDelete2Btn);
    });
}

function generateMiniRow(row, table) {
    const miniRows = table.miniRows;
    const isClone = miniRows.length ? true : false;
    const newId = Date.now();
    const newPosition = miniRows.length ? miniRows[miniRows.length - 1].position + 1 : 0;
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
        newRow.position = newPosition;
    }
    miniRows.push(newRow);
    
    updateMiniRow(template, newRow);
    const element = template.querySelector('.mini-row-wrapper') || template;
    row.querySelector('.table-body').appendChild(template);
    asignProperties(newRow, element, miniRows);
    actionManager(null, [newRow], null, null, 'element-delete');
}

function updateMiniRow(template, row) {
    const rowElement = template.querySelector('.mini-row-wrapper') || template;
    
    rowElement.dataset.index = row.id;
    rowElement.dataset.parentId = row.parentId;
    const tableData = row.data;
    if (tableData) {
        tableData.sort((a, b) => a.position - b.position);
        tableData.forEach(cell => {
            const template = document.getElementById('data-template').content.cloneNode(true);
            updateTableData(template, cell);
            const dataElement = template.children[0];
            rowElement.appendChild(template);
            asignProperties(cell, dataElement, tableData);
        });
    }
}

function generateTableData(tableElement, table) {
    const miniRows = table.miniRows;
    let previousPosition;
    let generatedObjs = [];
    
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

        asignProperties(newTableData, element, row.data);
        generatedObjs.push(newTableData);
    });
    actionManager(null, generatedObjs, null, null, 'element-delete');
    const rowDelete2Btn = document.getElementById('row-delete2-template').content.cloneNode(true);
    const rowDelete2Wrapper = tableElement.querySelector('.row2-wrapper');
    rowDelete2Btn.querySelector('.row-delete2-btn').dataset.index = previousPosition;
    rowDelete2Wrapper.appendChild(rowDelete2Btn);
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
        const infoboxImg = document.querySelector(`.row-wrapper[data-index="${element.id}"]`).querySelector('.infobox-img');
        element.imgSrc = src;
        infoboxImg.src = src;
        actionManager(infoboxImg, null, src, oldSrc, 'image-change');
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
    const oldSections = [reAsignProperties(JSON.parse(JSON.stringify(currentSection)), currentSection)];
    
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
    actionManager(null, [currentSection], [reAsignProperties(JSON.parse(JSON.stringify(currentSection)), currentSection)], oldSections, 'element-move');
}

// moves mini rows inside the table row
function moveMiniRow(row, table, direction) {
    const previousRowElement = row.previousElementSibling;
    const nextRowElement = row.nextElementSibling;
    const index = row.dataset.index;
    const miniRows = table.miniRows;
    const currentRow = miniRows.find(r => r.id == index);
    const oldRows = [reAsignProperties(JSON.parse(JSON.stringify(currentRow)), currentRow)];
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
    actionManager(null, [currentRow], [reAsignProperties(JSON.parse(JSON.stringify(currentRow)), currentRow)], oldRows, 'element-move');
}

function moveTableData(table, position, direction) {
    const miniRows = table.miniRows;
    let oldCells = [];
    let newCells = [];
    miniRows.forEach(row => {
        const tableData = row.data;
        
        tableData.forEach(cell => {
            if (cell.position == position) {
                const dataElement = cell.node;
                const previousCell = dataElement.previousElementSibling;
                const nextCell = dataElement.nextElementSibling;

                const oldCell = JSON.parse(JSON.stringify(cell));
                oldCells.push(reAsignProperties(oldCell, cell));
                
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
                
                newCells.push(cell);
            }
            tableData.sort((a, b) => a.position - b.position);
        });
    });
    if (oldCells[0].position !== newCells[0].position) {
        actionManager(null, newCells, newCells.map(cell => reAsignProperties(JSON.parse(JSON.stringify(cell)), cell)), oldCells, 'element-move');
    }
}

function moveCell(row, currentCell, direction) {
    const previousRow = row.previousElementSibling;
    const nextRow = row.nextElementSibling;
    const oldCells = [reAsignProperties(JSON.parse(JSON.stringify(currentCell)), currentCell)];
    
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
    actionManager(null, [currentCell], [reAsignProperties(JSON.parse(JSON.stringify(currentCell)), currentCell)], oldCells, 'element-move');
}

// moves rows up and down
function moveRow(row, infobox, direction) {
    const sibling = findSiblingNodes(row, infobox);
    let previousInfobox = sibling.previousInfobox;
    let nextInfobox = sibling.nextInfobox;
    let previousRow = sibling.previousRow;
    let nextRow = sibling.nextRow;
    let previousParentArray = sibling.previousParentArray;
    let nextParentArray = sibling.nextParentArray;
    let previousParentNode = sibling.previousParentNode;
    let nextParentNode = sibling.nextParentNode;
    
    const oldRows = [reAsignProperties(JSON.parse(JSON.stringify(infobox)), infobox)];
    
    if (direction === 'up' && previousRow || direction === 'up' && previousParentNode) {
        previousParentNode ? previousParentNode.appendChild(row) : previousRow.parentNode.insertBefore(row, previousRow);
            
        if (infobox.parentArray === previousParentArray) {
            const currentPosition = infobox.position;
            infobox.position = previousInfobox.position;
            previousInfobox.position = currentPosition;
        } else {
            infobox.parentArray.splice(infobox.parentArray.indexOf(infobox), 1);
            previousInfobox ? previousParentArray.splice(previousParentArray.indexOf(previousInfobox), 0, infobox) : previousParentArray.push(infobox);
            if (infobox.subCategory) {
              delete infobox.subCategory
            }
            infobox.parentArray.forEach((rowObj, i) => {
              rowObj.position = i;
            });
            previousParentArray.forEach((rowObj, i) => {
              rowObj.position = i;
            });
            console.log(previousInfobox)
            infobox.parentArray.sort((a, b) => a.position - b.position);
            infobox.parentArray = previousParentArray;
        }
    } else if (direction === 'down' && nextRow || direction === 'down' && nextParentNode) {
        nextParentNode ? nextParentNode.prepend(row) : nextRow.parentNode.insertBefore(row, nextRow.nextElementSibling);
        if (infobox.parentArray === nextParentArray) {
            const currentPosition = infobox.position;
            infobox.position = nextInfobox.position;
            nextInfobox.position = currentPosition;
        } else {
            infobox.parentArray.splice(infobox.parentArray.indexOf(infobox), 1);
            nextInfobox ? nextParentArray.splice(nextParentArray.indexOf(nextInfobox) + 1, 0, infobox) : nextParentArray.unshift(infobox);
            if (infobox.subCategory) {
              delete infobox.subCategory
            }
            infobox.parentArray.forEach((rowObj, i) => {
              rowObj.position = i;
            });
            nextParentArray.forEach((rowObj, i) => {
              rowObj.position = i;
            });
            infobox.parentArray.sort((a, b) => a.position - b.position);
            infobox.parentArray = nextParentArray;
        }
    }
    infobox.parentNode = row.parentNode;
    infobox.parentArray.sort((a, b) => a.position - b.position);
    console.log(rows.map(row => row.type), rows.flatMap(row => row.categoryRows ?? []).map(row => row.type))
    actionManager(null, [infobox], [reAsignProperties(JSON.parse(JSON.stringify(infobox)), infobox)], oldRows, 'element-move');
}

function findSiblingNodes(row, infobox) {
    let previousInfobox;
    let nextInfobox;
    let previousRow;
    let nextRow;
    let previousParentArray;
    let nextParentArray;
    let previousParentNode;
    let nextParentNode;
    
    if (infobox.type === 'category' || infobox.type === 'sub-category') {
        previousRow = row.previousElementSibling;
        nextRow = row.nextElementSibling;
        if (previousRow) {
            const previousIndex = Number(previousRow.dataset.index);
            previousInfobox = infobox.parentArray.find(char => char.id === previousIndex);
            previousParentArray = previousInfobox.parentArray;
        }
        if (nextRow) {
            const nextIndex = Number(nextRow.dataset.index);
            nextInfobox = infobox.parentArray.find(char => char.id === nextIndex);
            nextParentArray = nextInfobox.parentArray;
        }
    } else {
        previousRow = row.previousElementSibling;
        nextRow = row.nextElementSibling;
        if (previousRow) {
            if (previousRow.classList.contains('category-wrapper')) {
                previousParentNode = previousRow.querySelector('.category-row-list');
                previousParentArray = rows.find(item => item.node === previousRow).categoryRows;
            } else {
                const previousIndex = Number(previousRow.dataset.index);
                previousInfobox = infobox.parentArray.find(char => char.id === previousIndex);
                previousParentArray = previousInfobox.parentArray;
            }
        } else if (row.closest('.category-wrapper')) {
            if (row.closest('.category-wrapper').previousElementSibling?.classList.contains('category-wrapper')) {
                previousRow = row.closest('.category-wrapper').previousElementSibling;
                previousParentNode = previousRow.querySelector('.category-row-list');
                previousParentArray = rows.find(obj => obj.node === previousRow).categoryRows;
            } else {
                previousRow = row.closest('.category-wrapper');
                previousInfobox = rows.find(obj => obj.node === previousRow);
                previousParentArray = previousInfobox.parentArray;
            }
        }
        if (nextRow) {
            if (nextRow.classList.contains('category-wrapper')) {
                nextParentNode = nextRow.querySelector('.category-row-list');
                nextParentArray = rows.find(item => item.node === nextRow).categoryRows;
            } else {
                const nextIndex = Number(nextRow.dataset.index);
                nextInfobox = infobox.parentArray.find(char => char.id === nextIndex);
                nextParentArray = nextInfobox.parentArray;
            }
        } else if (row.closest('.category-wrapper')) {
            if (row.closest('.category-wrapper').nextElementSibling?.classList.contains('category-wrapper')) {
                nextRow = row.closest('.category-wrapper').nextElementSibling;
                nextParentNode = nextRow.querySelector('.category-row-list');
                nextParentArray = rows.find(item => item.node === nextRow).categoryRows;
            } else if (row.closest('.category-wrapper').nextElementSibling) {
                nextRow = row.closest('.category-wrapper');
                nextInfobox = rows.find(obj => obj.node === nextRow);
                nextParentArray = nextInfobox.parentArray;
            }
        }
    }

    return {
        previousInfobox,
        nextInfobox,
        previousRow,
        nextRow,
        previousParentArray,
        nextParentArray,
        previousParentNode,
        nextParentNode
    };
}

function toggleBio(row, btnElement) {
    const bioElement = row.querySelector('.infobox-bio');

    if (bioElement.style.maxHeight) {
        bioElement.style.maxHeight = null;
        btnElement.textContent = 'show more';
    } else {
        bioElement.style.maxHeight = bioElement.scrollHeight + 'px';
        btnElement.textContent = 'show less';
    }
}

function asignProperties(object, node, parentArray) {
    Object.defineProperties(object, {
        parentArray: {
            value: parentArray,
            enumerable: false,
            writable: true,
            configurable: true
        },
        parentNode: {
            value: node.parentNode,
            enumerable: false,
            writable: true,
            configurable: true
        },
        node: {
            value: node,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
}

function reAsignProperties(newObject, oldObject) {
    Object.defineProperties(newObject, {
        parentArray: {
            value: oldObject.parentArray,
            enumerable: false,
            writable: true,
            configurable: true
        },
        parentNode: {
            value: oldObject.parentNode,
            enumerable: false,
            writable: true,
            configurable: true
        },
        node: {
            value: oldObject.node,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });

    return newObject;
}

// generates info cells for the infoboxes
function generateSection(templateId, row, infobox, text) {
    const template = document.getElementById(templateId).content.cloneNode(true);
    const newId = Date.now();
    const sections = infobox.sections;
    const newPosition = sections.length ? sections[sections.length - 1].position + 1 : 0;
    
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
    asignProperties(newSection, element, infobox.sections);
    actionManager(null, [newSection], null, null, 'element-delete');
    bioElement.style.maxHeight = bioElement.scrollHeight + 'px';
}

function updateSection(template, section) {
    const sectionNode = template.querySelector('.section-wrapper') || template;
    
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

function updateData(data) {
    document.getElementById('title').textContent = data.title;
    if (getComputedStyle(toggleSidebarBtn).display.includes('none')) {
        document.getElementById('synopsis-text').innerHTML = data.intro + data.synopsis;
    } else {
        document.getElementById('intro').innerHTML = data.intro;
        document.getElementById('synopsis-text').innerHTML = data.synopsis;
    }
    document.getElementById('synopsis-text-input').addEventListener('focus', function(event) {
        currentTextArea = event.target;
    });
    document.getElementById('poster').src = data.poster;
    toggleUpperToolbar();
    toggleMainInfobox();
}

function loadState(reload) {
    function loadElements() {
        if (!reload) {
            updateData(data);
        }
        undoList.length = 0;
        redoList.length = 0;
        
        rows.sort((a, b) => a.position - b.position);
            
        rows.forEach((row, i) => {
            if (!row.type) {
              row.type = 'infobox';
            }
            row.position = i;
            const template = document.getElementById(`${row.type}-template`).content.cloneNode(true);
            const rowNode = template.children[0];
            if (row.type === 'category') {
              updateCategory(template, row);
            } else if (row.type === 'sub-category') {
              updateSubCategory(template, row);
            } else if (row.type === 'text-area' || row.type === 'text') {
              updateTextArea(template, row);
            } else if (row.type === 'table') {
              updateTable(template, row);
            } else if (row.type === 'infobox') {
              updateInfobox(template, row);
            }
            
            document.getElementById('row-list').appendChild(template);
            asignProperties(row, rowNode, rows);
        });
        console.log(rows)
        
        cells.sort((a, b) => a.position - b.position);
        
        cells.forEach(cell => {
            let template;
            if (cell.text2) {
                template = template ? template : document.getElementById('info-template').content.cloneNode(true);
            } else {
                template = template ? template : document.getElementById('info-template2').content.cloneNode(true);
            }
            updateCell(template, cell);
            const cellNode = template.children[0];
            document.getElementById('info-list').appendChild(template);
            asignProperties(cell, cellNode, cells);
        });
    }
    
    if (reload) {
        loadElements();
    } else {
        const transaction = db.transaction(['articles'], 'readonly');
        const articleStore = transaction.objectStore('articles');
        
        articleStore.getAll().onsuccess = function (event) {
            const articles = event.target.result;
            articles.sort((a, b) => b.articleId - a.articleId);
            
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
                
                previousSaves.sort((a, b) => a.id - b.id);
                
                if (previousSaves) {
                    previousSaves.forEach((state, i) => {
                        const template = document.getElementById('save-state-template').content.cloneNode(true);
                        template.querySelector('.save-state-section').dataset.id = state.id;
                        template.querySelector('.state-title').textContent = state.name || 'File ' + ( i + 1 );
                        document.getElementById('save-list').prepend(template);
                    });
                }
                content.style.display = '';
                loadElements();
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
        loadState(true); // reload saved structures
  
        alert('File uploaded and data restored ✅');
      } catch (err) {
        alert('Invalid JSON file ❌');
        console.error(err);
      }
    };
    reader.readAsText(file);
}

async function downloadFile() {
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
}

function saveState(trigger) {
    const transaction = db.transaction(['articles'], 'readwrite');
    
    const articleStore = transaction.objectStore('articles');
    
    const newId = Date.now();
    const currentDate = new Date();
    
    if (trigger === 6) {
        const template = document.getElementById('save-state-template').content.cloneNode(true);
        
        const previousSave = {
            id: newId,
            name: currentDate.toLocaleString(),
            data: JSON.parse(JSON.stringify(data)),
            rows: JSON.parse(JSON.stringify(rows)),
            cells: JSON.parse(JSON.stringify(cells))
        };
        previousSaves.push(previousSave);
        
        template.querySelector('.save-state-section').dataset.id = previousSave.id;
        template.querySelector('.state-title').textContent = previousSave.name;
        document.getElementById('save-list').prepend(template);
        if (previousSaves.length > 6) {
            const removableSave = previousSaves.shift();
            document.querySelector(`.save-state-section[data-id="${removableSave.id}"]`).remove();
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
    let objects = [];
    if (type !== 'table data') {
        if (confirm(`Are you sure you want to delete this ${type}?`)) {
            if (type === 'sub-category') {
                const filteredRows = array.filter(arr => arr.subCategory === element.id);
                objects.push(...filteredRows);
                filteredRows.forEach(arr => {
                    const childNode = document.querySelector(`.row-wrapper[data-index="${arr.id}"]`);
                    childNode.remove();
                    array.splice(array.indexOf(arr), 1);
                });
            }
            
            row.remove();
            array.splice(array.indexOf(element), 1);
            alignRows([...element.parentNode.children], element.parentArray);
            console.log(objects)
            objects.unshift(element);
            
            actionManager(null, objects.reverse(), null, null, 'element-delete');
        }
    } else {
        const target = row;
        const index = target.dataset.index;
        const parentRow = target.closest('.table-body');
        const miniRows = element.miniRows;
        
        miniRows.forEach(miniRow => {
            const rowNode = parentRow.querySelector(`.mini-row-wrapper[data-index="${miniRow.id}"]`);
            const tableData = miniRow.data;
            const cell = tableData.find(a => a.position == index);
            const dataElement = rowNode.querySelector(`.data-wrapper[data-index="${cell.id}"]`);

            objects.push(cell);
            dataElement.remove();
            tableData.splice(miniRow.data.indexOf(cell), 1);
            tableData.forEach((cell, i) => cell.position = i);
        });
        actionManager(null, objects, null, null, 'element-delete');
        updateRowDelete2Btn(parentRow, miniRows[0]?.data);
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