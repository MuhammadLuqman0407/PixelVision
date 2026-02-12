const filterContainer = document.querySelector('.filters');
const imageCanvas = document.querySelector("#image-canvas")
const imgInput = document.querySelector("#image-input")
const canvasCtx = imageCanvas.getContext("2d")
const resetButton = document.querySelector("#reset-btn") 
const downloadButton = document.querySelector("#download-btn")
let file = null
let image = null


const filters = {
    brightness: {
        value: 100,
        min: 0,
        max: 200,
        unit:"%",
    },
    contrast: {
        value: 100,
        min: 0,
        max: 200,
        unit:"%",
    },
    exposure: {
        value: 100,
        min: 0,
        max: 200, 
        unit:"%",
    },
    saturation: {
        value: 100,
        min: 0,
        max: 200,
        unit:"%",
    },
    hueRotation: {
        value: 0,
        min: 0,
        max: 360,
        unit:"deg",
    },
    blur: {
        value: 0,
        min: 0,
        max: 20,
        unit:"px",
    },
    grayscale: {
        value: 0,
        min: 0,
        max: 100,
        unit:"%",
    },
    sepia: {
        value:0,
        min: 0,
        max: 100,
        unit:"%",
    },
    opacity: {
        value: 100,
        min: 0,
        max: 100,
        unit:"%",
    },
    invert: {
        value: 0,
        min: 0,
        max: 100,
        unit:"%",
    }
}


function createFilterElement(name, unit="%", value, min, max){
    const div = document.createElement("div")
    div.classList.add("filter")

    const input = document.createElement("input")
    input.type = "range"
    input.min = min
    input.max = max
    input.value = value
    input.id = name

    const p = document.createElement("p")
    p.innerText = name

    div.appendChild(p)
    div.appendChild(input)

    input.addEventListener("input", (event)=>{
        filters[name].value = input.value
        console.log(name, filters[name].value);
        applyFilter() // ✅ Apply filter when slider changes
    })
    return div
}

function createFilters(){
    Object.keys(filters).forEach(key=>{
        const filterElement = createFilterElement(key, filters[key].unit, filters[key].value, filters[key].min, filters[key].max);
        filterContainer.appendChild(filterElement);
    })
}

createFilters()

imgInput.addEventListener("change", (event) =>{
    const file = event.target.files[0]
    const imagePlaceholder = document.querySelector('.placeholder')
    imageCanvas.style.display = "block" 
    imagePlaceholder.style.display = "none"

    const img = new Image()
    img.src = URL.createObjectURL(file)

    img.onload = () =>{
        image = img
        imageCanvas.width = img.width
        imageCanvas.height = img.height
        canvasCtx.drawImage(img, 0, 0)
        applyFilter() // ✅ Apply filters after image loads
    }
})

function applyFilter(){
    // ✅ FIX: Check if image exists before applying filters
    if(!image) return
    
    canvasCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height)
    
    // ✅ Build filter string properly with spaces between filters
    canvasCtx.filter = `
        brightness(${filters.brightness.value}${filters.brightness.unit})
        contrast(${filters.contrast.value}${filters.contrast.unit})
        saturate(${filters.saturation.value}${filters.saturation.unit})
        hue-rotate(${filters.hueRotation.value}${filters.hueRotation.unit})
        blur(${filters.blur.value}${filters.blur.unit})
        grayscale(${filters.grayscale.value}${filters.grayscale.unit})
        sepia(${filters.sepia.value}${filters.sepia.unit})
        opacity(${filters.opacity.value}${filters.opacity.unit})
        invert(${filters.invert.value}${filters.invert.unit})
    `
    
    canvasCtx.drawImage(image, 0, 0)
}


resetButton.addEventListener("click", ()=>{
    // ✅ Reset all filter values to default
    filters.brightness.value = 100
    filters.contrast.value = 100
    filters.exposure.value = 100
    filters.saturation.value = 100
    filters.hueRotation.value = 0
    filters.blur.value = 0
    filters.grayscale.value = 0
    filters.sepia.value = 0
    filters.opacity.value = 100
    filters.invert.value = 0
    
    applyFilter() // ✅ Redraw with default values
    
    // ✅ Update all slider inputs to reflect reset
    Object.keys(filters).forEach(key => {
        const input = document.querySelector(`#${key}`)
        if(input) input.value = filters[key].value
    })
})

downloadButton.addEventListener("click", ()=>{
    if(!image) {
        alert("Please load an image first!")
        return
    }
    const link = document.createElement("a")
    link.download = "edited-image.png"
    link.href = imageCanvas.toDataURL()
    link.click()
})