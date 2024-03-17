import BezierCurve from "./src/BezierCurve.js";
import LeafGroup from "./src/LeafGroup.js";
import Leaf from "./src/Leaf.js";
import * as MATH from "./src/Math.js";
import InputBezier from "./src/inputs/InputBezier.js";

const mainCanvas = document.getElementById('canvas');
const mainContext = mainCanvas.getContext('2d');

const leafCanvas = document.createElement('canvas');
leafCanvas.width = 400;
leafCanvas.height = 400;
const leafContext = leafCanvas.getContext('2d');

let branch = new BezierCurve([400, 600], [400, 200], -45, 200, 120, 100);

const preset = {
    "leafCount": 8.29,
    "totalRotation": 45.9,
    "localRotation": 148.94,
    "branchDistribution": 0.94,
    "sizeCurve": new BezierCurve(
        [
            0,
            0.21
        ],
        [
            0.95,
            0.1
        ],
        -10,
        0.2,
        135,
        0.2,
    ),
};

const leafPreset = {
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

function init() {
    addControls();
    draw();
}

function addControls() {
    const controls = [
        {
            id : 'leafCount',
            type : 'range',
            min : 1,
            max : 20,
        },
        {
            id : 'branchDistribution',
            type : 'range',
            min : 0,
            max : 1,
        },
        {
            id : 'totalRotation',
            type : 'range',
            min : 0,
            max : 360,
        },
        {
            id : 'localRotation',
            type : 'range',
            min : -180,
            max : 180,
        },
        {
            id : 'sizeCurve',
            type : 'curve',
        },
    ];

    const btnExport = document.getElementById('exportPreset');
    btnExport.addEventListener('click', () => console.log(JSON.stringify(preset)));
    const container = document.getElementById('settings');

    controls
    .filter(control => control.type === 'range')
    .forEach(control => {
        const input = `${control.id} <input type="range" min="${control.min}" max="${control.max}" step="0.01" id="${control.id}"><br>`;
        container.insertAdjacentHTML('beforeend', input);
        document.getElementById(control.id).value = preset[control.id];
        document.getElementById(control.id).addEventListener('input', evt => {
            const target = evt.target;
            preset[target.id] = parseFloat(target.value);
            draw();
        });
    });
    controls
    .filter(control => control.type === 'curve')
    .forEach(control => {
        const inputBezier = new InputBezier(control.id, control.id, preset[control.id]);
        const inputNode = inputBezier.getInput();
        container.append(inputNode);
        inputBezier.listener = draw;
    });

    branch = new BezierCurve([0, 0], [1, 0], -45, 0.2, 135, 0.2);
    const inputBezier = new InputBezier('branch', 'Branch', branch);
    const inputNode = inputBezier.getInput();
    container.append(inputNode);
    inputBezier.listener = draw;
}

function draw() {
    mainContext.fillStyle = '#000000';
    mainContext.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

    const leafImage = getLeafImage(leafPreset);

    // const branch = new BezierCurve([400, 600], [400, 200], -45, 200, 120, 100);
    const leafGroup = new LeafGroup(branch, preset);

    drawBezier(mainContext, branch, 10, '#ada990', 5);
    leafGroup.leafs.forEach(leaf => drawLeaf(mainContext, leaf, leafImage));
}

function getLeafImage(leafPreset) {
    const leafPosition = [200, 400];
    const leaf = new Leaf(leafPosition, leafPreset);

    leafContext.fillStyle = 'rgba(0,0,0,0)';
    leafContext.fillRect(0, 0, leafCanvas.width, leafCanvas.height);

    drawBezier(leafContext, leaf.midRib, 10);
    leaf.limbs.forEach(limb => fillBezier(leafContext, limb));
    leaf.veins.forEach(vein => drawBezier(leafContext, vein));
    return leafCanvas;
}

function fillBezier(context, bezierCurve) {
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

function drawLeaf(context, leaf, leafImage) {
    const size = 40 * leaf.scale;
    context.save();
    context.translate(leaf.position[0], leaf.position[1]);
    context.rotate(leaf.rotation);
    context.drawImage(leafImage, 0, 0, leafCanvas.width, leafCanvas.height, 0 - size / 2, 0 - size, size, size);
    context.restore();
}

function drawBezier(context, bezierCurve, width = 1, color = '#529410', segments = 20) {
    let points = bezierCurve.getPoints(segments);
    points = points.map(point => MATH.scalePoint([0, 0], point, 400));
    points = points.map(point => MATH.translatePoint(point, [100, 400]));

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

init();