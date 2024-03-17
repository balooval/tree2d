import BezierCurve from "./src/BezierCurve.js";
import Leaf from "./src/Leaf.js";
import InputBezier from "./src/inputs/InputBezier.js";

let container;
let canvas;
let context;

const canvasSize = 400;

const preset = {
    "height": 400,
    "petiolePercent": 0.25,
    "startCtrlAngle": 101.77,
    "startCtrlLength": 224.28,
    "endCtrlAngle": 61.73,
    "endCtrlLength": 137.79,
    "limbCount": 12.94,
    "limbRotation": -19.91,
    "limbStartCtrlAngle": 63.55,
    "limbStartCtrlLength": 0.51,
    "limbEndCtrlLength": 0.32,
    "limbEndCtrlAngle": 126.27,
    "veinCtrlLength": 0.51,
    "veinStartCtrlAngle": -31.56,
    "veinEndCtrlAngle": 152.35
};

export function init(containerId) {
    container = document.getElementById(containerId);
    canvas = document.createElement('canvas');
    canvas.id = 'leafCanvas';
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    container.prepend(canvas);
    context = canvas.getContext('2d');

    addControls();
    draw();
}

function addControls() {
    const controls = [
        {
            id : 'height',
            min : 10,
            max : 600,
        },
        {
            id : 'petiolePercent',
            min : 0,
            max : 1,
        },
        {
            id : 'startCtrlAngle',
            min : -30,
            max : 180,
        },
        {
            id : 'startCtrlLength',
            min : 0,
            max : 500,
        },
        {
            id : 'endCtrlAngle',
            min : -30,
            max : 180,
        },
        {
            id : 'endCtrlLength',
            min : 0,
            max : 500,
        },
        {
            id : 'limbCount',
            min : 1,
            max : 20,
        },
        {
            id : 'limbRotation',
            min : -90,
            max : 90,
        },
        {
            id : 'limbStartCtrlLength',
            min : 0,
            max : 2,
        },
        {
            id : 'limbStartCtrlAngle',
            min : 0,
            max : 200,
        },
        {
            id : 'limbEndCtrlLength',
            min : 0,
            max : 2,
        },
        {
            id : 'limbEndCtrlAngle',
            min : 0,
            max : 200,
        },
        {
            id : 'veinCtrlLength',
            min : 0,
            max : 2,
        },
        {
            id : 'veinStartCtrlAngle',
            min : -90,
            max : 90,
        },
        {
            id : 'veinEndCtrlAngle',
            min : 90,
            max : 270,
        },
    ];

    document.getElementById('presets').addEventListener('change', evt => {
        const selectedPreset = evt.target.value;
        loadPreset(selectedPreset);
        draw();
    });

    const htmlBtnExport = '<input type="button" id="exportPreset" value="Export to console"></input>';
    container.insertAdjacentHTML('beforeend', htmlBtnExport);
    
    const htmlSettingContainer = '<div id="leafSettings" style="padding:8px;">';
    container.insertAdjacentHTML('beforeend', htmlSettingContainer);

    const btnExport = document.getElementById('exportPreset');
    btnExport.addEventListener('click', () => console.log(JSON.stringify(preset)));
    const settingContainer = document.getElementById('leafSettings');

    controls.forEach(control => {
        const input = `${control.id} <input type="range" min="${control.min}" max="${control.max}" step="0.01" id="${control.id}"><br>`;
        settingContainer.insertAdjacentHTML('beforeend', input);
        document.getElementById(control.id).value = preset[control.id];
        document.getElementById(control.id).addEventListener('input', evt => {
            const target = evt.target;
            preset[target.id] = parseFloat(target.value);
            draw();
        });
    });

    const inputCurve = new BezierCurve([0, 75], [200, 75], -80, 50, 100, 50);
    const inputBezier = new InputBezier('toto', 'Toto', inputCurve);
    const inputNode = inputBezier.getInput();
    settingContainer.append(inputNode);
}

function loadPreset(presetName) {
    const totoPreset = presets[presetName];
    for (const key in preset) {
        const input = document.getElementById(key);
        if (input.type === 'checkbox') {
            input.checked = preset[key];
        } else {
            document.getElementById(key).value = preset[key];
        }
    }
}

function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height)

    // context.fillStyle = '#000000';
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const leafPosition = [canvasSize / 2, canvasSize * 1];
    const leaf = new Leaf(leafPosition, preset);
    
    drawBezier(leaf.midRib, 10);
    leaf.limbs.forEach(limb => fillBezier(limb));
    leaf.veins.forEach(vein => drawBezier(vein));
}

function drawBezier(bezierCurve, width = 1, color = '#529410') {
    const points = bezierCurve.getPoints(20);
    const startPoint = points.shift();
    context.beginPath();
    context.moveTo(startPoint[0], startPoint[1]);
    context.strokeStyle = color;
    context.lineWidth = width;
    points.forEach(point => {
        context.lineTo(point[0], point[1]);
    });
    context.stroke();
}

function fillBezier(bezierCurve) {
    const points = bezierCurve.getPoints(20);
    const startPoint = points.shift();
    context.beginPath();
    context.moveTo(startPoint[0], startPoint[1]);
    points.forEach(point => {
        context.lineTo(point[0], point[1]);
    });
    context.closePath();
    context.fillStyle = '#73d115';
    context.fill();
}


const presets = {
    sativa : {
        "leadfCount": 7,
        "localAngle": 0,
        "totalAngle": 250,
        "height": 350,
        "startCtrlLength": 150,
        "endCtrlLength": 100,
        "startCtrlAngle": 30,
        "endCtrlAngle": 30,
        "tigeDistribution": 0,
        "nervuresStep": 1,
        "nervuresStart": 5,
        "nervuresBack": 3,
        "colorA": "#4db300",
        "colorB": "#77d411",
        "colorC": "#77ed2d",
        "tigeAltern": false,
        "scaleEndian": 0.3,
        "petiole": 0,
        "petioleWidth": 2,
        "nervuresPercent": 1.05
    },
    fern : {
        "leadfCount": 20,
        "localAngle": 34,
        "totalAngle": 46,
        "height": 103,
        "startCtrlLength": 23,
        "endCtrlLength": 17,
        "startCtrlAngle": 71,
        "endCtrlAngle": 29,
        "tigeDistribution": 375,
        "nervuresStep": 1,
        "nervuresStart": 6,
        "nervuresBack": 3,
        "colorA": "#18912c",
        "colorB": "#30b300",
        "colorC": "#0f3315",
        "tigeAltern": true,
        "scaleEndian": 1,
        "petiole": 0,
        "nervuresPercent": 1,
        "petioleWidth": 1,
    },
    trefle : {
        "leadfCount": 4,
        "localAngle": -12,
        "totalAngle": 250,
        "height": 224,
        "startCtrlLength": 121,
        "endCtrlLength": 133,
        "startCtrlAngle": 44,
        "endCtrlAngle": 104,
        "tigeDistribution": 0,
        "nervuresStep": 3,
        "nervuresStart": 11,
        "nervuresBack": 1,
        "colorA": "#228906",
        "colorB": "#242f18",
        "colorC": "#184e2d",
        "tigeAltern": false,
        "scaleEndian": 1,
        "petiole": 6,
        "nervuresPercent": 0.65,
        "petioleWidth": 2,
    },
    scindapsus : {
        "leadfCount": 4,
        "localAngle": 23,
        "totalAngle": 0,
        "height": 289,
        "startCtrlLength": 147,
        "endCtrlLength": 97,
        "startCtrlAngle": 81,
        "endCtrlAngle": 46,
        "tigeDistribution": 366,
        "nervuresStep": 5,
        "nervuresStart": 6,
        "nervuresBack": 5,
        "colorA": "#4db300",
        "colorB": "#77d411",
        "colorC": "#77ed2d",
        "tigeAltern": true,
        "scaleEndian": 0.81,
        "petiole": 59,
        "nervuresPercent": 0.8,
        "petioleWidth": 4,
    },
    eventail : {
        "leadfCount": 7,
        "localAngle": -34,
        "totalAngle": 165,
        "height": 314,
        "startCtrlLength": 110,
        "endCtrlLength": 118,
        "startCtrlAngle": 33,
        "endCtrlAngle": 120,
        "tigeDistribution": 0,
        "nervuresStep": 19,
        "nervuresStart": 1,
        "nervuresBack": 1,
        "colorA": "#4db300",
        "colorB": "#77d411",
        "colorC": "#77ed2d",
        "tigeAltern": false,
        "scaleEndian": 1,
        "petiole": 31,
        "nervuresPercent": 1,
        "petioleWidth": 2,
    },
    caoutchou : {
        "leadfCount": 3,
        "localAngle": -44,
        "totalAngle": 0,
        "height": 246,
        "startCtrlLength": 153,
        "endCtrlLength": 97,
        "startCtrlAngle": 79,
        "endCtrlAngle": 81,
        "tigeDistribution": 380,
        "nervuresStep": 5,
        "nervuresStart": 6,
        "nervuresBack": 5,
        "colorA": "#398500",
        "colorB": "#0a992e",
        "colorC": "#107028",
        "tigeAltern": true,
        "scaleEndian": 0.84,
        "petiole": 10,
        "nervuresPercent": 0.73,
        "petioleWidth": 7,
    },
    solo : {
        "leadfCount": 3,
        "localAngle": 23,
        "totalAngle": 78,
        "height": 248,
        "startCtrlLength": 96,
        "endCtrlLength": 171,
        "startCtrlAngle": 79,
        "endCtrlAngle": 57,
        "tigeDistribution": 0,
        "nervuresStep": 2,
        "nervuresStart": 10,
        "nervuresBack": 9,
        "colorA": "#008a10",
        "colorB": "#63d01b",
        "colorC": "#9fc785",
        "tigeAltern": false,
        "scaleEndian": 0.71,
        "petiole": 0,
        "nervuresPercent": 0.95,
        "petioleWidth": 2,
    },
    olivier : {
        "leadfCount": 11,
        "localAngle": 24,
        "totalAngle": 30,
        "height": 180,
        "startCtrlLength": 27,
        "endCtrlLength": 55,
        "startCtrlAngle": 0,
        "endCtrlAngle": 48,
        "tigeDistribution": 359,
        "nervuresStep": 6,
        "nervuresStart": 6,
        "nervuresBack": 5,
        "colorA": "#6ca244",
        "colorB": "#afe576",
        "colorC": "#aff782",
        "tigeAltern": true,
        "scaleEndian": 0.81,
        "petiole": 46,
        "nervuresPercent": 0,
        "petioleWidth": 2,
    },
};