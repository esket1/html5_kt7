const localStorage = window.localStorage
const fileInput = document.getElementById('fileInput')

let files = loadFilesFromStorage()

fileInput.addEventListener('change', (event) => {
    const selectedFiles = event.target.files
    let i = 0
    while (i < selectedFiles.length) {
        saveFileToStorage(selectedFiles[i])
        i++
    }
})

function saveFileToStorage(file) {
    const reader = new FileReader()

    reader.onload = function (e) {
        const fileData = {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
            data: e.target.result,
            id: Date.now() + Math.random().toString(36).substr(2, 9)
        }

        let filesList = JSON.parse(localStorage.getItem('files') || '[]')
        filesList.push(fileData)
        localStorage.setItem('files', JSON.stringify(filesList))

        alert(`Файл "${file.name}" успешно сохранен!`)
        files = filesList
        showFiles()
    }

    reader.readAsDataURL(file)
}

function loadFilesFromStorage() {
    const filesData = localStorage.getItem('files')
    if (filesData) {
        return JSON.parse(filesData)
    }
    return []
}

function showFiles() {
    const filesContainer = document.getElementById('filesContainer')
    
    while (filesContainer.firstChild) {
        filesContainer.removeChild(filesContainer.firstChild)
    }

    if (files.length === 0) {
        const message = document.createElement('div')
        message.textContent = 'Нет сохраненных файлов'
        filesContainer.appendChild(message)
        return
    }

    const sizeFilterInput = document.getElementById('sizeFilter').value
    const sizeFilter = parseInt(sizeFilterInput) === 0 ? false : parseInt(sizeFilterInput)
    
    const typeFilterInput = document.getElementById('typeFilter').value
    const typeFilter = typeFilterInput === 'all' ? false : typeFilterInput

    let filteredCount = 0
    let i = 0
    while (i < files.length) {
        const file = files[i]
        
        if (typeFilter) {
            if (typeFilter === "other") {
                if (file.type.startsWith("image/") || 
                    file.type.startsWith("text/") || 
                    file.type.startsWith("application/")) {
                    i++
                    continue
                }
            } else if (!file.type.includes(typeFilter)) {
                i++
                continue
            }
        }

        if (sizeFilter && file.size > sizeFilter) {
            i++
            continue
        }

        const fileElement = document.createElement('div')
        fileElement.className = 'file-item'

        const fileNameElement = document.createElement('strong')
        fileNameElement.textContent = file.name

        const fileTypeElement = document.createElement('span')
        fileTypeElement.textContent = file.type

        const fileSizeElement = document.createElement('span')
        fileSizeElement.textContent = formatBytes(file.size)

        const fileShowButton = document.createElement('button')
        fileShowButton.textContent = 'Просмотр'
        fileShowButton.type = 'button'
        fileShowButton.addEventListener('click', function (event) {
            event.preventDefault()
            openFile(file)
        })

        const space1 = document.createTextNode(' (')
        const space2 = document.createTextNode(', ')
        const space3 = document.createTextNode(') ')
        const space4 = document.createTextNode(' ')

        fileElement.appendChild(fileNameElement)
        fileElement.appendChild(space1)
        fileElement.appendChild(fileTypeElement)
        fileElement.appendChild(space2)
        fileElement.appendChild(fileSizeElement)
        fileElement.appendChild(space3)
        fileElement.appendChild(fileShowButton)
        fileElement.appendChild(space4)

        filesContainer.appendChild(fileElement)
        filteredCount++
        i++
    }

    if (filteredCount === 0) {
        const message = document.createElement('div')
        message.textContent = 'Нет файлов, соответствующих фильтрам'
        filesContainer.appendChild(message)
    }
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

function openFile(file) {
    const byteString = atob(file.data.split(',')[1])
    const mimeString = file.data.split(',')[0].split(':')[1].split(';')[0]
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)

    let i = 0
    while (i < byteString.length) {
        ia[i] = byteString.charCodeAt(i)
        i++
    }

    const blob = new Blob([ab], { type: mimeString })
    const url = URL.createObjectURL(blob)

    if (file.type.startsWith('image/')) {
        window.open(url, '_blank')
    } else if (file.type.startsWith('text/')) {
        const reader = new FileReader()
        reader.onload = function (e) {
            alert(e.target.result.substring(0, 1000) + (e.target.result.length > 1000 ? '...' : ''))
        }
        reader.readAsText(blob)
    } else {
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
    }

    setTimeout(() => URL.revokeObjectURL(url), 10000)
}

function deleteFile(fileId) {
    if (confirm('Вы уверены, что хотите удалить этот файл?')) {
        files = files.filter(file => file.id !== fileId)
        localStorage.setItem('files', JSON.stringify(files))
        showFiles()
    }
}

document.getElementById('typeFilter').addEventListener('change', showFiles)
document.getElementById('sizeFilter').addEventListener('input', showFiles)

const dropArea = document.getElementById('dropArea')

dropArea.addEventListener('dragover', (e) => {
    e.preventDefault()
})

dropArea.addEventListener('drop', (e) => {
    e.preventDefault()
    dropArea.style.backgroundColor = ''

    const droppedFiles = e.dataTransfer.files
    let i = 0
    while (i < droppedFiles.length) {
        saveFileToStorage(droppedFiles[i])
        i++
    }
})

showFiles()