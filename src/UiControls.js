
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
}

function addPresetParamsInputs() {
    addRangeControl('gravitropism', 0, 0.008, 0.0001);
    addRangeControl('flexibility', 0.00001, 0.002, 0.00001);
    addRangeControl('newBranchLength', 5, 50, 1);
    addRangeControl('uselessBeforePrune', 0, 50, 1);
    addRangeControl('angle', 5, 130, 1);
    addRangeControl('directionConstrainFactor', 0, 1, 0.01);
    addRangeControl('trunkScale', 0.2, 2, 0.1);
    addRangeControl('leafScale', 0.5, 1.5, 0.1);
    addRangeControl('leafHue', 50, 150, 1);
    addRangeControl('energyNeededToGrow', 1, 10, 1);
    addRangeControl('maxLightDistance', 50, 200, 1);
}

function addRangeControl(presetName, min, max, step) {
    const label = (presetName.match(/[A-Z]*[a-z]+/g) ?? [presetName]).join(' ');
    const inputId = `${presetName}-Control`;
    const presetControl = `<label for="${inputId}" class="form-label">${label} <span id="${presetName}-value">-</span></label>
    <input type="range" class="form-range" min="${min}" max="${max}" step="${step}" id="${inputId}" value="${currentPreset[presetName]}"></input>`;
    presetParamsContainer.insertAdjacentHTML('beforeend', presetControl);
    document.getElementById(`${presetName}-value`).innerText = currentPreset[presetName];
    document.getElementById(inputId).addEventListener('change', evt => {
        currentPreset[presetName] = evt.target.value;
        document.getElementById(`${presetName}-value`).innerText = evt.target.value;
        onChangeCallback();
    });
}