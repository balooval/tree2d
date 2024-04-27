import { leavesPresets } from "./renderer/LeavesDrawer3d.js";

let presetParamsContainer;
let inputViewLeaves;
let treeRender;
let currentPreset;
let onChangeCallback;

export function init(_treeRender, callback) {
    treeRender = _treeRender;
    onChangeCallback = callback;
    presetParamsContainer = document.getElementById('presetParams');
    inputViewLeaves = document.getElementById('viewLeaves');
    inputViewLeaves.addEventListener('change', onViewLeavesChanged);
}

export function setPreset(preset) {
    presetParamsContainer.innerHTML = '';
    currentPreset = preset;
    addPresetParamsInputs();
}

function onViewLeavesChanged() {
    treeRender.setViewLeaves(inputViewLeaves.checked);
    onChangeCallback();
}

function addPresetParamsInputs() {
    addTreeRangeControl('gravitropism', 0, 0.008, 0.0001);
    addTreeRangeControl('flexibility', 0.00001, 0.002, 0.00001);
    // addTreeRangeControl('newBranchLength', 5, 80, 1);
    addTreeRangeControl('uselessBeforePrune', 0, 50, 1);
    addTreeRangeControl('angle', 5, 130, 1);
    addTreeRangeControl('directionConstrainFactor', 0, 1, 0.01);
    addTreeRangeControl('trunkScale', 0.2, 2, 0.1);
    // addTreeRangeControl('energyNeededToGrow', 1, 10, 1);
    // addTreeRangeControl('maxLightDistance', 50, 200, 1);
    
    // addTreeRangeControl('minLightForLeaf', 0.01, 2, 0.01);
    
    // addTreeRangeControl('trunkNoiseSmall', 0.001, 0.1, 0.001);
    // addTreeRangeControl('trunkNoiseMid', 0.001, 0.1, 0.001);
    // addTreeRangeControl('trunkNoiseBig', 0.001, 0.1, 0.01);
    
    // addLeafRangeControl('distributionVariation', 0, 1, 0.01);
    // addLeafRangeControl('lengthDistribution', 0, 1, 0.01);
    // addLeafRangeControl('dispersionAngleStart', -3.2, 3.2, 0.1);
    // addLeafRangeControl('dispersionAngleVariation', 0, 3.2, 0.1);
    // addLeafRangeControl('orientationVariation', 0, 3.2, 0.1);
    // addLeafRangeControl('randomSkip', 0.8, 0.99, 0.01);
    // addLeafRangeControl('translationSpeed', 0, 5, 1);
    addLeafRangeControl('scale', 0.5, 4, 0.1);
    // addLeafRangeControl('formRatio', 0.2, 5, 0.1);
    addLeafRangeControl('hue', 50, 150, 1);
    addLeafRangeControl('saturation', 10, 100, 1);
}

function addTreeRangeControl(valueName, min, max, step) {
    createRangeControl(
        'Branch ',
        updateTreePreset,
        currentPreset,
        valueName,
        min,
        max,
        step
    );
}

function addLeafRangeControl(valueName, min, max, step) {
    createRangeControl(
        'Leaf ',
        updateLeafPreset,
        leavesPresets[currentPreset.leavesPreset],
        valueName,
        min,
        max,
        step
    );
}

function createRangeControl(prefix, callback, preset, valueName, min, max, step) {
    const label = prefix + (valueName.match(/[A-Z]*[a-z]+/g) ?? [valueName]).join(' ');
    const inputId = `${valueName}-Control`;
    const presetControl = `<label for="${inputId}" class="form-label">${label} <span id="${valueName}-value">-</span></label>
    <input type="range" class="form-range" min="${min}" max="${max}" step="${step}" id="${inputId}" value="${preset[valueName]}"></input>`;
    presetParamsContainer.insertAdjacentHTML('beforeend', presetControl);
    document.getElementById(`${valueName}-value`).innerText = preset[valueName];
    document.getElementById(inputId).addEventListener('change', evt => {
        // preset[valueName] = parseFloat(evt.target.value);
        callback(valueName, parseFloat(evt.target.value));
        document.getElementById(`${valueName}-value`).innerText = evt.target.value;
        onChangeCallback();
    });
}

function updateTreePreset(key, value) {
    currentPreset[key] = value;
}

function updateLeafPreset(key, value) {
    leavesPresets[currentPreset.leavesPreset][key] = value;
}