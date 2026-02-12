const filterContainer = document.querySelector('.filters');
const imageCanvas = document.querySelector("#image-canvas")
const imgInput = document.querySelector("#image-input")
const canvasCtx = imageCanvas.getContext("2d")

let file = null
let image = null

const filters = {
    brigntess: {
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


function createFilter(name,unit="%",value,min,max){
function createFilterElement(name,unit="%",value,min,max){
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

    input.addEventListener("input",(event)=>{
        filters[name].value = input.value
        console.log(name,filters[name]["value"]);
        
    })
    return div
}
}

Object.keys(filters).forEach(key=>{
    const filterElement = createFilterElement(key, filters[key].unit, filters[key].value, filters[key].min, filters[key].max);
    
    filterContainer.appendChild(filterElement);
})

imgInput.addEventListener("change",(event) =>{
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
        canvasCtx.drawImage(img,0,0)
    }
})

function applyBlur(){
    canvasCtx.filter = `blur(10px)})`
    canvasCtx.drawImage(image,0,0)
}