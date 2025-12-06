const fileInput = document.getElementById('fileInput')
const selectedFile = document.getElementById('selectedFile')
const dropArea = document.getElementById('dropArea')
const typeFilter = document.getElementById('typeFilter')
const sizeFilter = document.getElementById('sizeFilter')
const filesList = document.getElementById('filesList')

let files = []

document.addEventListener('DOMContentLoaded', () => {
    loadFilesFromStorage()
    updateFileList()
})

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFiles(e.target.files)
        selectedFile.textContent = e.target.files[0].name
        if (e.target.files.length > 1) {
            selectedFile.textContent = `Выбрано файлов: ${e.target.files.length}`
        }
        fileInput.value = ''
    }
})

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false)
    document.body.addEventListener(eventName, preventDefaults, false)
})

function preventDefaults(e) {
    e.preventDefault()
    e.stopPropagation()
}

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => {
        dropArea.classList.add('dragover')
    }, false)
})

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => {
        dropArea.classList.remove('dragover')
    }, false)
})

dropArea.addEventListener('drop', (e) => {
    const dt = e.dataTransfer
    const droppedFiles = dt.files

    if (droppedFiles.length) {
        handleFiles(droppedFiles)
        selectedFile.textContent = droppedFiles[0].name
        if (droppedFiles.length > 1) {
            selectedFile.textContent = `Добавлено файлов: ${droppedFiles.length}`
        }
    }
}, false)

typeFilter.addEventListener('change', updateFileList)
sizeFilter.addEventListener('input', updateFileList)

function handleFiles(fileList) {
    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        const reader = new FileReader()

        reader.onload = function (e) {
            const fileData = {
                id: Date.now() + i,
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result,
                date: new Date().toISOString()
            }

            files.push(fileData)
            saveFilesToStorage()
            updateFileList()
        }

        reader.readAsDataURL(file)
    }
}

function saveFilesToStorage() {
    try {
        localStorage.setItem('fileStorage', JSON.stringify(files))
    } catch (e) {
        alert('Ошибка при сохранении файлов. Возможно, превышен лимит localStorage.')
    }
}

function loadFilesFromStorage() {
    const storedFiles = localStorage.getItem('fileStorage')
    if (storedFiles) {
        try {
            files = JSON.parse(storedFiles)
        } catch (e) {
            console.error('Ошибка при загрузке файлов из localStorage:', e)
            files = []
        }
    }
}

function updateFileList() {
    let filteredFiles = [...files]

    const typeValue = typeFilter.value
    if (typeValue !== 'all') {
        filteredFiles = filteredFiles.filter(file => {
            if (typeValue === 'image') return file.type.startsWith('image/')
            if (typeValue === 'text') return file.type.startsWith('text/')
            if (typeValue === 'application') return file.type.startsWith('application/')
            if (typeValue === 'other') return !file.type.startsWith('image/') &&
                !file.type.startsWith('text/') &&
                !file.type.startsWith('application/')
            return true
        })
    }

    const sizeValue = sizeFilter.value
    if (sizeValue && !isNaN(sizeValue) && sizeValue > 0) {
        filteredFiles = filteredFiles.filter(file => file.size <= parseInt(sizeValue))
    }

    filesList.innerHTML = ''

    if (filteredFiles.length === 0) {
        const emptyState = document.createElement('div')
        emptyState.textContent = 'Нет файлов для отображения'
        filesList.appendChild(emptyState)
        return
    }

    filteredFiles.forEach(file => {
        const fileItem = document.createElement('div')

        fileItem.innerHTML = `
                    <span>${file.name} (${file.type || 'неизвестный тип'}, ${file.size} байт)</span>
                    <button data-id="${file.id}">Просмотр</button>
                `

        filesList.appendChild(fileItem)

        const viewBtn = fileItem.querySelector('button')
        viewBtn.addEventListener('click', () => {
            viewFile(file.id)
        })
    })
}

function viewFile(fileId) {
    const file = files.find(f => f.id === fileId)
    if (!file) return

    if (file.type.startsWith('image/')) {
        const newWindow = window.open()
        newWindow.document.write(`<img src="${file.data}" alt="${file.name}">`)
    } else if (file.type.startsWith('text/')) {
        const content = atob(file.data.split(',')[1])
        alert(`Содержимое файла "${file.name}":\n\n${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}`)
    } else {
        alert(`Файл: ${file.name}\nТип: ${file.type}\nРазмер: ${file.size} байт\n\nПросмотр содержимого недоступен для этого типа файлов.`)
    }
}