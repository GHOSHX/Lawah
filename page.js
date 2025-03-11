function changeSrc() {
    if (document.getElementById("poster1button").checked) {
        document.getElementById("poster").src = "https://i.ibb.co/2YzpY9v/20240530-193537.jpg";
    } else if (document.getElementById("poster2button").checked) {
        document.getElementById("poster").src = "https://i.ibb.co/zrJMsVY/20240530-194859.jpg";
    }
    saveState();
}

function toggleTable(tableId, button) {
    var table = document.getElementById(tableId);
    if (table.style.display === 'none') {
        table.style.display = 'table';
        button.textContent = '⛔️';
    } else {
        table.style.display = 'none';
        button.textContent = '👁';
    }
}

let db;

function openDB() {
    const request = indexedDB.open('gameData', 3);

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
let characters = [];
let synopses = [];
let cells = [];
let pageName;
let currentPageId;
let currentTextArea;
let toggleSynopsisBtn;
let toggleCharacterBtn;
let editSynopsisBtn;
let addRowBtn;
let addCell1Btn;
let editButton;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentPageId = Number(urlParams.get('pageId'));
    pageName = decodeURIComponent(urlParams.get('pageTitle'));
    
    openDB();
    console.log(pageName);
    console.log(currentPageId);
    
    const inputPoster = document.getElementById('poster-input');
    toggleSynopsisBtn = document.getElementById('toggle-synopsis-btn');
    toggleCharacterBtn = document.getElementById('toggle-character-btn');
    editButton = document.getElementById('edit-infobox');
    editSynopsisBtn = document.getElementById('edit-synopsis-btn');
    addRowBtn = document.getElementById('add-character-btn');
    addCell1Btn = document.getElementById('add-info-btn1');
    addCell2Btn = document.getElementById('add-info-btn2');
    addCell1Btn.addEventListener('click', () => generateInfoRow('info-template'));
    addCell2Btn.addEventListener('click', () => generateInfoRow('info-template2'));
    addRowBtn.addEventListener('click', generateRow);
    toggleSynopsisBtn.addEventListener('click', () => toggleTable('table1', toggleSynopsisBtn));
    toggleCharacterBtn.addEventListener('click', () => toggleTable('table2', toggleCharacterBtn));
    document.getElementById('delete-page-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this saved page?')) {
          deleteElementFromPage();
      }
    });
    document.getElementById('bold-text-btn').addEventListener('click', () => styleText('bold'));
    document.getElementById('italic-text-btn').addEventListener('click', () => styleText('italic'));
    document.getElementById('link-text-btn').addEventListener('click', () => styleText('link'));
    document.getElementById('img-text-btn').addEventListener('click', () => styleText('image'));
    document.getElementById('add-img-btn').addEventListener('click', generateImage);
    editButton.addEventListener('click', editPage);
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
    document.getElementById('table-body').addEventListener('click', handleTableClick);
    document.getElementById('table-body').addEventListener('change', handleTableChange);
});

function styleText(type) {
    const selection = window.getSelection();
    
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const parentNode = range.commonAncestorContainer.parentNode;
        const selectedText = range.toString();

        if (selectedText.length > 0) {
            let tag, openingTag, closingTag, href;

            if (type === 'bold') {
                tag = 'b';
            } else if (type === 'italic') {
                tag = 'i';
            } else if (type === 'link') {
                tag = 'a';
            } else if (type === 'image') {
                tag = 'img';
            }
            
            if (parentNode.nodeName.toLowerCase() === tag) {
                const tagElement = parentNode;
                while (tagElement.firstChild) {
                    tagElement.parentNode.insertBefore(tagElement.firstChild, tagElement);
                }
                tagElement.remove();
                return;
            } else {
                if (tag === 'a') {
                    href = prompt('Enter the URL', 'https://');
                    openingTag = `<${tag} href="${href}">`;
                    closingTag = `</${tag}>`;
                } else if (tag === 'img') {
                    href = prompt('Enter the URL', 'https://');
                    const imgSize = prompt('Enter the image size');
                    openingTag = `<img src="${href}" alt="${selectedText}" width="${imgSize}">`;
                } else {
                    openingTag = `<${tag}>`;
                    closingTag = `</${tag}>`;
                }
                const newText = closingTag ? openingTag + selectedText + closingTag : openingTag;
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

function generateInfoRow(templateId) {
    const template = document.getElementById(templateId).content.cloneNode(true);
    const newId = Date.now();
    const newPosition = cells.length ? cells[cells.length - 1].position + 1 : 0;

    const newCell = {
        id: newId,
        text1: 'Write here',
        text2: templateId === 'info-template' ? 'Write here' : null,
        pageId: currentPageId,
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

function editPage() {
    const controlRoom = document.querySelectorAll('.control-room');
    const toolbar = document.getElementById('toolbar');
    const title = document.getElementById('title');
    const introText = document.getElementById('intro');
    const synopsisText = document.getElementById('synopsis-text');
    const titleInput = document.getElementById('title-input');
    const introInput = document.getElementById('intro-input');
    const synopsisInput = document.getElementById('synopsis-text-input');
    const addImageBtn = document.getElementById('add-img-btn');
    const editMode = editButton.textContent === '✏️';
    
    if (db) {
        if (editMode) {
            if (toggleSynopsisBtn.textContent === '👁') {
                toggleSynopsisBtn.click();
            }
            if (toggleCharacterBtn.textContent === '👁') {
                toggleCharacterBtn.click();
            }
            controlRoom.forEach(room => {
                room.style.display = 'block';
            });
            toolbar.style.display = 'block';
            titleInput.value = title.textContent;
            introInput.innerHTML = introText.innerHTML;
            synopsisInput.innerHTML = synopsisText.innerHTML;
            titleInput.style.display = 'inline';
            introInput.style.display = 'block';
            synopsisInput.style.display = 'block';
            addImageBtn.style.display = 'block';
            title.style.display = 'none';
            introText.style.display = 'none';
            synopsisText.style.display = 'none';
            editButton.textContent = '✔️';
        } else {
            controlRoom.forEach(room => {
                room.style.display = 'none';
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
            addImageBtn.style.display = 'none';
            title.style.display = 'block';
            introText.style.display = 'block';
            synopsisText.style.display = 'block';
            toolbar.style.display = 'none';
            editButton.textContent = '✏️';
        }
        
        characterEdit(editMode);
        editInfoBox(editMode);
    }
}

function characterEdit(editMode) {
    const characterTemplate = document.querySelectorAll('.character-wrapper');
    
    characterTemplate.forEach(template => {
        let characterEditMode = template.querySelector('.character-name');
        let characterName = template.querySelector('.character-name');
        let characterBio = template.querySelector('.character-bio-text');
        let characterNameInput = template.querySelector('.name-input');
        let characterBioInput = template.querySelector('.bio-input');
        let charControls = template.querySelector('.character-name-controls');
        
        if (editMode) {
            characterName.style.display = 'none';
            characterBio.style.display = 'none';
            charControls.style.display = 'block';
            characterNameInput.value = characterName.textContent;
            characterBioInput.innerHTML = characterBio.innerHTML;
            characterNameInput.style.display = 'inline';
            characterBioInput.style.display = 'block';
        } else {
            const index = template.getAttribute('data-index');
            const character = characters.find(char => char.id == index);
            characterNameInput.style.display = 'none';
            characterBioInput.style.display = 'none';
            charControls.style.display = 'none';
            
            if (characterNameInput.value.trim()) {
                character.name = characterNameInput.value;
                characterName.textContent = characterNameInput.value;
            }
            
            if (characterBioInput.innerHTML.trim()) {
                character.bio = characterBioInput.innerHTML;
                characterBio.innerHTML = characterBioInput.innerHTML;
            }
            
            characterName.style.display = 'block';
            characterBio.style.display = 'block';
        }
    });
}

function editInfoBox(editMode) {
    const infoWrappers = document.querySelectorAll('.info-wrapper');
    
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

function generateImage() {
    const template = document.getElementById('synopsis-img-template').content.cloneNode(true);
    const newId = Date.now();

    const newImage = {
        id: newId,
        imgSrc: 'https://via.placeholder.com/100'
    };
    synopses.push(newImage);

    updateImage(template, newImage);
    document.getElementById('table1').appendChild(template);
    saveState();
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

function deleteImage(wrapper) {
    const imgElement = wrapper.querySelector('img');
    const index = imgElement.getAttribute('data-index')
    const image = synopses.find(img => img.id == index);
    
    wrapper.remove();
    
    synopses.splice(synopses.indexOf(image), 1);
    deleteElementFromDB(image.id, 'synopsis');
}

function handleTableClick(event) {
    const target = event.target;
    const row = target.closest('tr');
    const index = row ? row.dataset.index : null;
    const character = characters.find(char => char.id == index);

    if (target.classList.contains('upload-img1-btn')) {
        row.querySelector('.upload-img').setAttribute('data-type', 'character');
        row.querySelector('.upload-img').click();
    } else if (target.classList.contains('upload-img2-btn')) {
        row.querySelector('.upload-img').setAttribute('data-type', 'inspiration');
        row.querySelector('.upload-img').click();
    } else if (target.classList.contains('move-up-btn')) {
        moveRow(row, character, 'up');
    } else if (target.classList.contains('move-down-btn')) {
        moveRow(row, character, 'down');
    } else if (target.classList.contains('see-more-btn')) {
        toggleBio(row);
    } else if (target.classList.contains('delete-btn')) {
        deleteElement(row, character, 'character');
    }
}

function handleTableChange(event) {
    const target = event.target;
    const row = target.closest('tr');
    const index = row ? row.dataset.index : null;
    const character = characters.find(char => char.id == index);

    if (target.classList.contains('upload-img')) {
        const type = target.getAttribute('data-type');
        loadImage(event, character, type);
    } else if (target.classList.contains('role-select')) {
        character.role = target.value;
    } else if (target.classList.contains('playable-select')) {
        character.playable = target.value;
    }
    saveState();
}

function generateRow() {
    const template = document.getElementById('character-template').content.cloneNode(true);
    const newId = Date.now();
    const newPosition = characters.length ? characters[characters.length - 1].position + 1 : 0;

    const newCharacter = {
        id: newId,
        name: 'New Character ' + newPosition,
        bio: 'New character bio goes here...',
        imgSrc: 'https://via.placeholder.com/100',
        inspirationImgSrc: 'https://via.placeholder.com/100',
        role: 'Unknown',
        playable: 'Yes',
        position: newPosition,
    };
    characters.push(newCharacter);

    updateRow(template, newCharacter);
    document.getElementById('table-body').appendChild(template);
    saveState();
}

function updateRow(template, character) {
    template.querySelector('.character-wrapper').setAttribute('data-index', character.id);
    template.querySelector('.character-name').textContent = character.name;
    template.querySelector('.character-bio-text').innerHTML = character.bio;
    template.querySelector('.character-img').src = character.imgSrc;
    template.querySelector('.inspiration-img').src = character.inspirationImgSrc;
    template.querySelector('.role-select').value = character.role;
    template.querySelector('.playable-select').value = character.playable;
}

function loadImage(event, element, type) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        if (type === 'character') {
            element.imgSrc = e.target.result;
            const row = document.querySelector(`tr[data-index="${element.id}"]`);
            row.querySelector('.character-img').src = element.imgSrc;
        } else if (type === 'inspiration') {
            element.inspirationImgSrc = e.target.result;
            const row = document.querySelector(`tr[data-index="${element.id}"]`);
            row.querySelector('.inspiration-img').src = element.inspirationImgSrc;
        } else if (type === 'synopsis') {
            element.imgSrc = e.target.result;
            const imgElement = document.querySelector(`img[data-index="${element.id}"]`);
            imgElement.src = element.imgSrc;
        }
    };
    reader.readAsDataURL(file);
}

function moveCell(row, currentCell, type) {
    const previousRow = row.previousElementSibling;
    const nextRow = row.nextElementSibling;
    if (type === 'up' && previousRow) {
        const previousIndex = Number(previousRow.dataset.index);
        const previousCell = cells.find(el => el.id === previousIndex);
        
        const currentPosition = currentCell.position;
        currentCell.position = previousCell.position;
        previousCell.position = currentPosition;
    
        row.parentNode.insertBefore(row, previousRow);
    } else if (type === 'down' && nextRow) {
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

function moveRow(row, character, type) {
    const previousRow = row.previousElementSibling;
    const nextRow = row.nextElementSibling;
    if (type === 'up' && previousRow) {
        const previousIndex = Number(previousRow.dataset.index);
        const previousCharacter = characters.find(char => char.id === previousIndex);
        
        const currentPosition = character.position;
        character.position = previousCharacter.position;
        previousCharacter.position = currentPosition;
        console.log(character.position + ': ' + previousCharacter.position);
    
        row.parentNode.insertBefore(row, previousRow);
    } else if (type === 'down' && nextRow) {
        const nextIndex = Number(nextRow.dataset.index);
        const nextCharacter = characters.find(char => char.id === nextIndex);
        
        const currentPosition = character.position;
        character.position = nextCharacter.position;
        nextCharacter.position = currentPosition;
    
        row.parentNode.insertBefore(nextRow, row);
    }
    saveState();
}

function toggleBio(row) {
    const bioElement = row.querySelector('.character-bio');
    const btnElement = row.querySelector('.see-more-btn');

    if (bioElement.style.maxHeight) {
        bioElement.style.maxHeight = null;
        btnElement.textContent = 'show more';
    } else {
        bioElement.style.maxHeight = bioElement.scrollHeight + 'px';
        btnElement.textContent = 'show less';
    }
}

function generateData() {
    const newData = {
        id: currentPageId,
        title: pageName,
        intro: 'Write intro here...',
        synopsis: 'Write synopsis here...',
        poster: 'https://via.placeholder.com/100',
    };
    data = newData;
    updateData(newData);
    saveState();
    loadState();
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
    })
    document.getElementById('poster').src = data.poster;
}

function loadState() {
    const transaction = db.transaction(['pages'], 'readonly');
    const pageStore = transaction.objectStore('pages');
    
    pageStore.get(currentPageId).onsuccess = function(event) {
        const pageData = event.target.result;
        
        if (pageData) {
            data = pageData.data;
            characters = pageData.characters;
            cells = pageData.cells;
            synopses = pageData.synopses;
            
            if (data.id) {
                updateData(data);
            } else {
                generateData();
            }
            
            characters.sort((a, b) => a.position - b.position);
            
            characters.forEach(character => {
                const template = document.getElementById('character-template').content.cloneNode(true);
                updateRow(template, character);
                const editorWrapper = template.querySelector('.character-name-controls');
                const name = template.querySelector('.character-name');
                const bio = template.querySelector('.character-bio-text');
                const nameInput = template.querySelector('.name-input');
                const bioInput = template.querySelector('.bio-input');
                editorWrapper.style.display = 'none';
                nameInput.style.display = 'none';
                bioInput.style.display = 'none';
                name.style.display = 'block';
                bio.style.display = 'block';
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
            
            synopses.forEach(element => {
                const template = element.text ? document.getElementById('Synopsis-text-template').content.cloneNode(true) : document.getElementById('synopsis-img-template').content.cloneNode(true);
                if (element.text) {
                    updateText(template, element);
                    const synopsisWrapper = template.querySelector('.synopsis-wrapper');
                    synopsisWrapper.querySelector('.synopsis-text').style.display = 'block';
                    synopsisWrapper.querySelector('.synopsis-text-input').style.display = 'none';
                    document.getElementById('table1').appendChild(template);
                } else if (element.imgSrc) {
                    updateImage(template, element);
                    document.getElementById('table1').appendChild(template);
                }
            });
        }
    };
}

function saveState() {
    const transaction = db.transaction(['pages'], 'readwrite');
    
    const pageStore = transaction.objectStore('pages');

    const pageData = {
        pageId: currentPageId,
        data: data,
        characters: characters,
        cells: cells,
        synopses: synopses
    };
    pageStore.put(pageData);

    transaction.oncomplete = function() {
        console.log('Data saved to IndexedDB');
    };
}

function deletePage() {
    window.location.href = `index.html?pageId=${currentPageId}`;
}

function deleteElement(row, element, type) {
    if (type === 'character') {
        if (confirm('Are you sure you want to delete this character?')) {
            row.remove();
            characters.splice(characters.indexOf(element), 1);
        }
        
        let previousPosition = -1;
          
        characters.forEach(character => {
            character.position = previousPosition + 1;
            previousPosition = character.position;
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
    }
}