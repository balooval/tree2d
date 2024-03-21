
let presetParamsContainer;
let inputViewLeaves;
let treeRender;
let currentPreset;

export function init(_treeRender) {
    treeRender = _treeRender;
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
    const leaveSizeControl = `<label for="presetLeafSize" class="form-label">Leaf size</label><input type="range" class="form-range" min="1" max="10" step="1" id="presetLeafSize" value="${currentPreset.leaveSize}"></input>`;
    presetParamsContainer.insertAdjacentHTML('beforeend', leaveSizeControl);
    document.getElementById('presetLeafSize').addEventListener('change', evt => currentPreset.leaveSize = evt.target.value);

    addRangeControl('uselessBeforePrune', 1, 10, 1);
    addRangeControl('maxLightDistance', 50, 200, 1);
    addRangeControl('lightBeforeGrow', 1, 10, 1);
    addRangeControl('newBranchLength', 5, 20, 1);
    addRangeControl('rigidity', 1, 20, 1);
    addRangeControl('density', 1, 30, 1);
    addRangeControl('directionConstrainFactor', 0, 2, 0.01);
    addRangeControl('heliotropism', 0, 5, 0.1);
}

function addRangeControl(presetName, min, max, step) {
    const inputId = `${presetName}-Control`;
    const presetControl = `<label for="${inputId}" class="form-label">${presetName} <span id="${presetName}-value">-</span></label>
    <input type="range" class="form-range" min="${min}" max="${max}" step="${step}" id="${inputId}" value="${currentPreset[presetName]}"></input>`;
    presetParamsContainer.insertAdjacentHTML('beforeend', presetControl);
    document.getElementById(`${presetName}-value`).innerText = currentPreset[presetName];
    document.getElementById(inputId).addEventListener('change', evt => {
        currentPreset[presetName] = evt.target.value;
        document.getElementById(`${presetName}-value`).innerText = evt.target.value;
    });
}