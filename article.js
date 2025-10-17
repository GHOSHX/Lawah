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
let articleName;
let currentArticleId;
let currentTextArea;
let toggleSynopsisBtn;
let toggleInfoboxBtn;
let editSynopsisBtn;
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
    console.log(articleName);
    console.log(currentArticleId);
    
    const inputPoster = document.getElementById('poster-input');
    toggleSynopsisBtn = document.getElementById('toggle-synopsis-btn');
    toggleInfoboxBtn = document.getElementById('toggle-infobox-btn');
    editButton = document.getElementById('edit-infobox');
    fileUploadBtn = document.getElementById('file-upload-btn');
    downloadBtn = document.getElementById('download-btn');
    settingsBtn = document.getElementById('settings-btn');
    editSynopsisBtn = document.getElementById('edit-synopsis-btn');
    addRow1Btn = document.getElementById('add-infobox-btn');
    addRow2Btn = document.getElementById('add-category-btn');
    addRow3Btn = document.getElementById('add-text-btn');
    addCell1Btn = document.getElementById('add-info-btn1');
    addCell2Btn = document.getElementById('add-info-btn2');
    addCell1Btn.addEventListener('click', () => generateCell('info-template', null));
    addCell2Btn.addEventListener('click', () => generateCell('info-template2', null));
    addRow1Btn.addEventListener('click', () => generateInfobox(null, null));
    document.getElementById('add-table-btn').addEventListener('click', () => generateTable(null, null));
    addRow2Btn.addEventListener('click', generateCategory);
    addRow3Btn.addEventListener('click', () => generateTextArea(null, null));
    toggleSynopsisBtn.addEventListener('click', () => toggleTable('table1', toggleSynopsisBtn));
    toggleInfoboxBtn.addEventListener('click', () => toggleTable('table2', toggleInfoboxBtn));
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
        saveState();
    });
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
          document.getElementById('table-body').innerHTML = '';
          document.getElementById('info-list').innerHTML = '';
          saveState(); // persist back to IndexedDB
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
        saveState();
      }
      
      reader.readAsDataURL(this.files[0]);
    });
    document.getElementById('info-list').addEventListener('click', handleCellClick);
    document.getElementById('info-list').addEventListener('change', handleCellChange);
    document.getElementById('table-body').addEventListener('click', handleRowClick);
    document.getElementById('table-body').addEventListener('change', handleRowChange);
});

function toggleTable(tableId, button) {
    let isVisible = button.textContent === '⛔️';
    var table = document.getElementById(tableId);
    const infoboxTemplate = document.querySelectorAll('.character-wrapper');
    
    if (!isVisible) {
        table.style.display = 'table';
        button.textContent = '⛔️';
        let toggleCategoryBtn;
        
        infoboxTemplate.forEach(template => {
            const index = template.getAttribute('data-index');
            const infobox = infoboxes.find(char => char.id == index);
            
            if (infobox.type !== 'category') {
                if (toggleCategoryBtn === '👁') {
                    template.style.display = 'none';
                }
            } else {
              toggleCategoryBtn = template.querySelector('.toggle-category-btn').textContent;
            }
        });
    } else {
        table.style.display = 'none';
        button.textContent = '👁';
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
    const textWrapper = template.querySelectorAll('.cell-text');
    const inputWrappers = template.querySelectorAll('.cell-input-wrapper');
    
    textWrapper.forEach(text => {
        text.style.display = 'none';
    })
    inputWrappers.forEach(input => {
        input.style.display = 'block';
    });
    if (newCell.text2) {
        template.querySelector('.cell1').style.backgroundColor = 'white';
        template.querySelector('.cell2').style.backgroundColor = 'white';
    } else {
        template.querySelector('.cell3').style.backgroundColor = 'white';
    }
    document.getElementById('info-list').appendChild(template);
    saveState();
}

function updateCell(template, cell) {
    template.querySelector('.info-wrapper').setAttribute('data-index', cell.id);
    template.querySelector('.info-title').innerHTML = cell.text1;
    template.querySelector('.info-input').innerHTML = cell.text1;
    const infoInput = template.querySelector('.info-input');
    infoInput.addEventListener('focus', function(event) {
        currentTextArea = event.target;
    });
    if (cell.text2) {
        const valueInput = template.querySelector('.value-input');
        template.querySelector('.value-cell').innerHTML = cell.text2;
        template.querySelector('.value-input').innerHTML = cell.text2;
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
    const editMode = editButton.textContent === '✏️';
    
    if (db) {
        if (editMode) {
            if (toggleSynopsisBtn.textContent === '👁') {
                toggleSynopsisBtn.click();
            }
            if (toggleInfoboxBtn.textContent === '👁') {
                toggleInfoboxBtn.click();
            }
            controlRoom.forEach(room => {
                room.style.display = 'block';
            });
            if (data.upperToolbar) {
                introWrapper.classList.
                toggle('intro-wrapper1');
                introWrapper.classList.toggle('intro-wrapper2');
            }
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
        } else {
            controlRoom.forEach(room => {
                room.style.display = 'none';
            });
            if (data.upperToolbar) {
                introWrapper.classList.toggle('intro-wrapper1');
                introWrapper.classList.toggle('intro-wrapper2');
            }
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
        }
        
        editInfobox(editMode);
        editMainInfobox(editMode);
    }
}

function assignCategoriesToInfoboxes() {
  let currentCategoryId = null;

  infoboxes.sort((a, b) => a.position - b.position);

  infoboxes.forEach(infobox => {
    if (infobox.type === "category") {
      currentCategoryId = infobox.id;
    } else {
      infobox.category = currentCategoryId; // assign nearest category above
    }
  });
}

function editInfobox(editMode) {
    const infoboxTemplate = document.querySelectorAll('.character-wrapper');
    
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
        const isCategoryVisible = toggleCategoryBtn ? toggleCategoryBtn.textContent === '⛔️' : null;
          
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
            
            rows.forEach(row => {
                const rowElement = document.querySelector(`tr[data-index="${row.id}"]`);
                editTableData(rowElement, row, editMode);
            })
        }
        
        if (presetBtn) {
            editSection(template, infobox, editMode);
        }
    });
}

function editTableData(rowElement, row, editMode) {
    const dataWrappers = rowElement.querySelectorAll('.data-wrapper');
    const tableData = row.data;
    
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
    const sections = infobox.sections;
    
    if (sectionWrappers) {
        sectionWrappers.forEach(section => {
            const infoTitle = section.querySelector('.info-title');
            const valueCell = section.querySelector('.value-cell');
            const inputWrapper = section.querySelectorAll('.cell-input-wrapper');
            const textWrapper = section.querySelectorAll('.cell-text');
            const infoInput = section.querySelector('.info-input');
            const valueInput = section.querySelector('.value-input');
            const index = infoTitle.closest('.section-wrapper').getAttribute('data-index');
            const cell = sections.find(el => el.id == index);
            
            if (editMode) {
                textWrapper.forEach(text => {
                    text.style.display = 'none';
                });
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
                    deleteElement(section, cell, 'section');
                } else {
                    infoTitle.innerHTML = cell.text1;
                    valueCell.innerHTML = cell.text2;
                }
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
            const infoInput = info.querySelector('.info-input');
            const valueInput = info.querySelector('.value-input');
            const index = infoTitle.closest('.info-wrapper').getAttribute('data-index');
            const cell = cells.find(el => el.id == index);
            
            if (editMode) {
                textWrapper.forEach(text => {
                    text.style.display = 'none';
                });
                if (cell3) {
                    cell3.style.backgroundColor = 'white';
                } else {
                    cell1.style.backgroundColor = "white";
                    cell2.style.backgroundColor = 'white';
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
                        deleteElement(wrapper, cell, 'cell');
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
                        deleteElement(wrapper, cell, 'cell');
                    } else {
                        cell1.style.backgroundColor = '#F1e7dd';
                        cell2.style.backgroundColor = '#F1e7dd';
                        infoTitle.innerHTML = cell.text1;
                        valueCell.innerHTML = cell.text2;
                    }
                }
                inputWrapper.forEach(input => {
                    input.style.display = 'none';
                });
                textWrapper.forEach(text => {
                    text.style.display = 'block';
                });
            }
        });
        saveState();
    }
}

function handleCellClick(event) {
    const target = event.target;
    const row = target.closest('tr');
    const index = row ? row.dataset.index : null;
    const cell = cells.find(el => el.id == index);
    
    if (target.classList.contains('cell-up-btn')) {
        moveCell(row, cell, 'up');
    } else if (target.classList.contains('cell-down-btn')) {
        moveCell(row, cell, 'down');
    }
}

function handleCellChange(event) {
    const target = event.target;
    const index = target.closest('.info-wrapper').getAttribute('data-index');
    const cell = cells.find(el => el.id == index);

    if (target.classList.contains('info-input')) {
        cell.text1 = target.value;
        target.closest('.info-wrapper').querySelector('.info-cell').innerHTML = target.value;
    } else if (target.classList.contains('value-input')) {
        cell.text2 = target.value;
        target.closest('.value-wrapper').querySelector('.value-cell').innerHTML = target.value;
    }
    saveState();
}

function updateImage(template, imageElement) {
    const img = template.querySelector('img');
    img.setAttribute('data-index', imageElement.id);
    img.src = imageElement.imgSrc;
}

function handleRowClick(event) {
    const target = event.target;
    const row = target.closest('tr');
    const index = row ? row.dataset.index : null;
    const infobox = infoboxes.find(char => char.id == index);

    if (target.classList.contains('upload-img-btn')) {
        const imgBtn = row.querySelectorAll('.infobox-img-btn');
      
        imgBtn.forEach(button => {
            if (button.style.display === 'none'||button.style.display === '') {
              button.style.display = 'inline-block';
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
        deleteElement(row, infobox, 'infobox');
    } else if (target.classList.contains('add-section-btn')) {
        generateSection(row, infobox, null);
    } else if (target.classList.contains('generate-preset-btn')) {
        presetGenerateSection(row, infobox);
    } else if (target.classList.contains('toggle-category-btn')) {
        toggleCategory(row, infobox);
    } else if (target.classList.contains('add-infobox-btn2')) {
        generateInfobox(row, infobox);
    } else if (target.classList.contains('add-text-btn2')) {
        generateTextArea(row, infobox);
    } else if (target.classList.contains('add-table-btn2')) {
        generateTable(row, infobox);
    }else if (target.classList.contains('add-row-btn')) {
        generateRow(row, infobox);
    } else if (target.classList.contains('add-data-btn')) {
        generateTableData(row, infobox);
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
    saveState();
}

function toggleCategory(row, category) {
    let id = category.id;
    let toggleButton = row.querySelector('.toggle-category-btn');
    let isVisible = toggleButton.textContent === '⛔️';
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
        toggleButton.textContent = '️👁';
    } else {
        toggleButton.textContent = '⛔️';
    }
    saveState();
}

// generates category rows
function generateCategory() {
    const template = document.getElementById('category-template').content.cloneNode(true);
    const newId = Date.now();
    const newPosition = infoboxes.length ? infoboxes[infoboxes.length - 1].position + 1 : 0;

    const newInfobox = {
        id: newId,
        name: 'Category No.' + (newPosition + 1),
        type: 'category',
        position: newPosition
    };
    infoboxes.push(newInfobox);

    updateCategory(template, newInfobox);
    template.querySelector('.toggle-category-btn').textContent = '⛔️';
    
    document.getElementById('table-body').appendChild(template);
    saveState();
}

function updateCategory(row, category) {
    row.querySelector('.character-wrapper').setAttribute('data-index', category.id);
    row.querySelector('.infobox-name').textContent = category.name;
}

// generates Infobox rows
function generateInfobox(catTemplate, category) {
    const template = document.getElementById('infobox-template').content.cloneNode(true);
    const newId = Date.now();
    let newPosition = null;
    if (category) {
        let previousPosition = category.position + 1;
        newPosition = previousPosition;
          
        infoboxes.forEach(infobox => {
            if (infobox.position > category.position) {
              infobox.position = previousPosition + 1;
              previousPosition = infobox.position;
            }
        });
    } else {
        infoboxes.sort((a, b) => a.position - b.position);
        newPosition = infoboxes.length ? infoboxes[infoboxes.length - 1].position + 1 : 0;
    }

    const newInfobox = {
        id: newId,
        name: 'Infobox No.' + (newPosition + 1),
        bio: 'Write description about the subject here...',
        imgSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/660px-No-Image-Placeholder.svg.png?20200912122019',
        type: 'infobox',
        category: category ? category.id : null,
        sections: [],
        position: newPosition
    };
    infoboxes.push(newInfobox);
    
    updateInfobox(template, newInfobox);
    if (category) {
        infoboxes.sort((a, b) => a.position - b.position);
        catTemplate.parentNode.insertBefore(template, catTemplate.nextElementSibling);
    } else {
        document.getElementById('table-body').appendChild(template);
    }
    saveState();
}

function updateInfobox(row, infobox) {
    row.querySelector('.character-wrapper').setAttribute('data-index', infobox.id);
    row.querySelector('.infobox-name').textContent = infobox.name;
    row.querySelector('.infobox-bio-text').innerHTML = infobox.bio;
    row.querySelector('.infobox-img').src = infobox.imgSrc;
    const sections = infobox.sections;
    if (sections) {
        sections.sort((a, b) => a.position - b.position);
        sections.forEach(section => {
            const template = document.getElementById('section-template').content.cloneNode(true);
            updateSection(template, section);
            row.querySelector('.section-lists').appendChild(template);
        });
    }
}

function generateTextArea(catTemplate, category) {
    const template = document.getElementById('text-template').content.cloneNode(true);
    const newId = Date.now();
    let newPosition = null;
    if (category) {
        let previousPosition = category.position + 1;
          
        infoboxes.forEach(infobox => {
            if (infobox.position > category.position) {
              infobox.position = previousPosition + 1;
              previousPosition = infobox.position;
            }
        });
    } else {
        newPosition = infoboxes.length ? infoboxes[infoboxes.length - 1].position + 1 : 0;
    }

    const newInfobox = {
        id: newId,
        bio: 'Write description about the subject here...',
        type: 'text area',
        category: category ? category.id : null,
        position: category ? category.position + 1 : newPosition
    };
    infoboxes.push(newInfobox);

    updateTextArea(template, newInfobox);
    if (category) {
        infoboxes.sort((a, b) => a.position - b.position);
        catTemplate.parentNode.insertBefore(template, catTemplate.nextElementSibling);
    } else {
        document.getElementById('table-body').appendChild(template);
    }
    saveState();
}

function updateTextArea(row, textArea) {
    row.querySelector('.character-wrapper').setAttribute('data-index', textArea.id);
    row.querySelector('.infobox-bio-text').innerHTML = textArea.bio;
}

// generates table rows
function generateTable(catTemplate, category) {
    const template = document.getElementById('table-template').content.cloneNode(true);
    const newId = Date.now();
    let newPosition = null;
    
    if (category) {
        let previousPosition = category.position + 1;
          
        infoboxes.forEach(infobox => {
            if (infobox.position > category.position) {
              infobox.position = previousPosition + 1;
              previousPosition = infobox.position;
            }
        });
    } else {
        newPosition = infoboxes.length ? infoboxes[infoboxes.length - 1].position + 1 : 0;
    }

    const newInfobox = {
        id: newId,
        rows: [],
        type: 'table',
        category: null,
        position: category ? category.position + 1 : newPosition
    };
    infoboxes.push(newInfobox);

    updateTable(template, newInfobox);
    if (category) {
        infoboxes.sort((a, b) => a.position - b.position);
        catTemplate.parentNode.insertBefore(template, catTemplate.nextElementSibling);
    } else {
        document.getElementById('table-body').appendChild(template);
    }
    saveState();
}

function updateTable(element, table) {
    element.querySelector('.character-wrapper').setAttribute('data-index', table.id);
    const rows = table.rows;
    if (rows) {
        rows.sort((a, b) => a.position - b.position);
        rows.forEach(row => {
            const template = document.getElementById('row-template').content.cloneNode(true);
            updateRow(template, row, true);
            element.querySelector('.table-body').appendChild(template);
        });
    }
}

function generateRow(row, infobox) {
    const rows = infobox.rows;
    const firstRow = rows.length ? false : true;
    let template;
    if (firstRow) {
        template = document.getElementById('row-template').content.cloneNode(true);
    } else {
        const previousRow = document.querySelector(`tr[data-index="${rows[rows.length - 1].id}"]`);
        template = previousRow.cloneNode(true);
        console.log(template);
    }
    const newId = Date.now();
    const newPosition = rows.length ? rows[rows.length - 1].position + 1 : 0;

    const newRow = {
        id: newId,
        data: [],
        position: newPosition
    };
    infobox.rows.push(newRow);
    
    updateRow(template, newRow, firstRow);
    row.querySelector('.table-body').appendChild(template);
    saveState();
}

function updateRow(rowElement, row, firstRow) {
    if (firstRow) {
        rowElement.querySelector('.row-wrapper').setAttribute('data-index', row.id);
        
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
        rowElement.setAttribute('data-index', row.id);
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
    });
    saveState();
}

function updateTableData(template, tableData, firstRow) {
    if (firstRow) {
        template.querySelector('.data-wrapper').setAttribute('data-index', tableData.id);
    } else {
        template.setAttribute('data-index', tableData.id);
    }
    template.querySelector('.info-title').innerHTML = tableData.text;
    template.querySelector('.info-input').innerHTML = tableData.text;
}

function loadImage(event, element) {
    if (event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            element.imgSrc = e.target.result;
            const row = document.querySelector(`tr[data-index="${element.id}"]`);
            row.querySelector('.infobox-img').src = element.imgSrc;
        };
        reader.readAsDataURL(file);
    } else {
        element.imgSrc = prompt('Enter the URL', 'https://');
        const row = document.querySelector(`tr[data-index="${element.id}"]`);
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
    saveState();
}

function moveCell(row, currentCell, direction) {
    const previousRow = row.previousElementSibling;
    const nextRow = row.nextElementSibling;
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
    saveState();
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
    saveState();
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
            const childNode = document.querySelector(`tr[data-index="${child.id}"]`);
            
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
    row.querySelector('.section-lists').appendChild(template);
    bioElement.style.maxHeight = bioElement.scrollHeight + 'px';
    saveState();
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
                  editorWrapper.style.display = 'none';
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
                
                document.getElementById('table-body').appendChild(template);
            });
            
            cells.sort((a, b) => a.position - b.position);
            
            cells.forEach(cell => {
                let template;
                if (cell.text2) {
                    template = document.getElementById('info-template').content.cloneNode(true);
                } else {
                    template = document.getElementById('info-template2').content.cloneNode(true);
                }
                updateCell(template, cell);
                
                document.getElementById('info-list').appendChild(template);
            });
        }
    };
}

function saveState() {
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
    };
}

function deleteElementFromArticle() {
    window.location.href = `index.html?articleId=${currentArticleId}`;
}

function deleteElement(row, element, type) {
    if (type === 'infobox') {
        if (confirm('Are you sure you want to delete this infobox?')) {
            row.remove();
            infoboxes.splice(infoboxes.indexOf(element), 1);
        }
        
        let previousPosition = -1;
          
        infoboxes.forEach(infobox => {
            infobox.position = previousPosition + 1;
            previousPosition = infobox.position;
        });
    } else if (type === 'cell') {
        if (confirm('Are you sure you want to delete this cell?')) {
            row.remove();
            cells.splice(cells.indexOf(element), 1);
        }
        
        let previousPosition = -1;
          
        cells.forEach(cell => {
            cell.position = previousPosition + 1;
            previousPosition = cell.position;
        });
    } else if (type === 'section') {
        if (confirm('Are you sure you want to delete this cell?')) {
            const index = row.closest('.character-wrapper').getAttribute('data-index');
            const infobox = infoboxes.find(char => char.id == index);
            const sections = infobox.sections;
            row.remove();
            sections.splice(sections.indexOf(element), 1);
            
            let previousPosition = -1;
          
            sections.forEach(cell => {
                cell.position = previousPosition + 1;
                previousPosition = cell.position;
            });
        }
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