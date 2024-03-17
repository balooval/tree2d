import InputBezier from "./src/inputs/InputBezier.js";
import Trunk from "./src/Trunk.js";
import Render3d from "./src/Render3d.js";
import * as THREE from './vendor/three.module.js';
import * as TextureLoader from './src/net/TextureLoader.js';
import InputRange from "./src/inputs/InputRange.js";
import InputMap from "./src/inputs/InputMap.js";
import Tree from "./src/Tree.js";
import TexturesToLoad from "./src/TexturesToLoad.js";
import * as Controls from "./src/Controls.js";
import GrassLayer from "./src/GrassLayer.js";

let treePercent = 0;
let attractorGeometry;
let attractorMaterial;
let attractorKilledMaterial;
let rangeGrowPercent;
let growPlaying = false;
let btnGrow;

const attractorsMeshes = [];

let trees = [];

const preset = {
    "gravityIsActive": true,
    "leavesIsActive": false,
    "attractorPercent": 1,
    "minStepFromRoot": 30,
    "minDistance": 30,
    "searchDistance": 140,
    "branchMinimumAttractors": 1,
    "branchDirectionFreedom": 1,
    "branchLength": 10,
    "branchWidth": 15,
    "branchLeaveCount": 20,
    "branchLeaveScale": 1,
    "pruneAge": 50,
    "gravity": 1.5,
    "barkRoughness": 0.1,
};

function init() {

    TextureLoader.loadBatch(TexturesToLoad, onRessourcesLoaded);
}

function onRessourcesLoaded() {
    Render3d.init('canvas3d')
    addControls();

    const attractorSize = 1;
    attractorGeometry = new THREE.BoxGeometry(attractorSize, attractorSize, attractorSize);
    attractorMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
    attractorKilledMaterial = new THREE.MeshBasicMaterial({color: 0x0000ff});

    const planeSize = 1000;
    const geometry = new THREE.PlaneGeometry(planeSize, planeSize);
    const material = new THREE.MeshStandardMaterial( {color: 0x82725f, transparent:true,alphaMap:TextureLoader.get('ground-alpha')} );
    const plane = new THREE.Mesh( geometry, material );
    plane.rotation.x = Math.PI / -2;
    plane.position.y = 0;
    // Render3d.add(plane);


    let baseSize = 120;
    let baseHeight = baseSize * 0.3;
    let baseGeometry = new THREE.CylinderGeometry(baseSize * 0.95, baseSize, baseHeight, 32);
    let baseMaterial = new THREE.MeshStandardMaterial( {color: 0x696462} );
    let baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.y = 0 - baseHeight / 2;
    Render3d.add(baseMesh);
    
    let position = 0 - baseHeight;
    baseSize *= 1.05;
    baseHeight = baseSize * 0.06;
    baseGeometry = new THREE.CylinderGeometry(baseSize, baseSize, baseHeight, 32);
    baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.y = position;
    Render3d.add(baseMesh);
    
    // let baseTopMaterial = new THREE.MeshStandardMaterial( {color: 0x44cc00} );
    // position = 0;
    // baseSize *= 0.85;
    // baseHeight = baseSize * 0.08;
    // baseGeometry = new THREE.CylinderGeometry(baseSize, baseSize, baseHeight, 32);
    // baseMesh = new THREE.Mesh(baseGeometry, baseTopMaterial);
    // baseMesh.position.y = 0;
    // Render3d.add(baseMesh);
    
    trees.push(new Tree([0, 0, 0], preset));
    // trees.forEach(tree => drawAttractors(tree.envelop.attractors));

    const grassLayer = new GrassLayer();

    update();
}

function update() {
    Render3d.update();
    requestAnimationFrame(update);
}

function addControls() {
    rangeGrowPercent = document.getElementById('range-grow-percent');

    const gravityState = document.getElementById('gravity-state');
    gravityState.addEventListener('change', () => preset.gravityIsActive = !preset.gravityIsActive);


    const leavesState = document.getElementById('leaves-state');
    leavesState.addEventListener('change', () => {
        preset.leavesIsActive = !preset.leavesIsActive;
        trees.forEach(tree => tree.switchLeaves());
    });

    const btnReset = document.getElementById('btn-reset');
    btnReset.addEventListener('click', () => {
        growPlaying = false;
        treePercent = 0;
        trees.forEach(tree => tree.reset());
    });

    btnGrow = document.getElementById('btn-grow');
    btnGrow.addEventListener('click', () => {
        growPlaying = !growPlaying;

        if (treePercent === 0) {
            trees.forEach(tree => tree.reset());
        }
        if (growPlaying) {
            btnGrow.value = "Pause";
            onGrowFrame();
        } else {
            btnGrow.value = "Grow";
        }
    });
    const container = document.getElementById('settings');

    Controls.attractorsControls.forEach(control => {
        new InputRange(container, control, preset[control.id], value => {
            preset[control.id] = value;
        });
    });

    Controls.treeControls
    .filter(control => control.type === 'range')
    .forEach(control => {
        new InputRange(container, control, preset[control.id], value => {
            preset[control.id] = value;
            trees.forEach(tree => tree.draw());
        });
    });
    Controls.treeControls
    .filter(control => control.type === 'curve')
    .forEach(control => {
        const inputBezier = new InputBezier(control.id, control.id, preset[control.id]);
        const inputNode = inputBezier.getInput();
        container.append(inputNode);
        inputBezier.listener = drawTree;
    });

    Controls.trunkMaps.forEach(mapDatas => {
        new InputMap(container, mapDatas, value => {
            trees.forEach(tree => tree.setBarkMap(value));
        });
    });

    Controls.leafMaps.forEach(mapDatas => {
        new InputMap(container, mapDatas, value => {
            trees.forEach(tree => tree.setLeafMap(value));
        });
    });

    
}

function onGrowFrame() {
    if (growPlaying === false) {
        return;
    }

    treeGrow();

    if (treePercent < 1) {
        requestAnimationFrame(onGrowFrame);
    } else {
        growPlaying = false;
        treePercent = 0;
        btnGrow.value = "Grow";
        clearMeshes(attractorsMeshes);
    }
}

function treeGrow() {
    treePercent += 0.01;
    rangeGrowPercent.value = treePercent;
    trees.forEach(tree => tree.grow(treePercent));
    trees.forEach(tree => tree.draw());
    // trees.forEach(tree => drawAttractors(tree.lightRays.attractors));
    // trees.forEach(tree => debugBranchs(tree.trunk.getFinalBranchs()));
    // trees.forEach(tree => debugSegments(tree));

    
}

function debugSegments(tree) {
    clearMeshes(attractorsMeshes);
    const segments = calcBranchsSegments(tree.trunk.branchs[0], [], []);
    segments.forEach(segment => {
        const first = segment[0];
        let cube = new THREE.Mesh(attractorGeometry, attractorMaterial);
        cube.position.x = first.end.x;
        cube.position.y = first.end.y;
        cube.position.z = first.end.z;
        Render3d.add(cube);
        attractorsMeshes.push(cube);

        const last = segment.pop();
        cube = new THREE.Mesh(attractorGeometry, attractorKilledMaterial);
        cube.position.x = last.end.x;
        cube.position.y = last.end.y + 1;
        cube.position.z = last.end.z;
        Render3d.add(cube);
        attractorsMeshes.push(cube);
    });
}

function calcBranchsSegments(curBranch, segments, segmentList) {
    segmentList.push(curBranch);
    
    if (curBranch.childs.length === 1) {
        curBranch = curBranch.childs[0];
        segments = calcBranchsSegments(curBranch, segments, segmentList);
        
    } else {
        segments.push(segmentList);

        for (let i = 0; i < curBranch.childs.length; i ++) {
            calcBranchsSegments(curBranch.childs[i], segments, []);
        }
    }
    return segments;
}


function debugBranchs(branchs) {
    clearMeshes(attractorsMeshes);
    branchs.forEach(branch => {
        debugBranch(branch);
    });
}

function debugBranch(branch) {
    let material = attractorMaterial;
    const cube = new THREE.Mesh(attractorGeometry, material);
    cube.position.x = branch.end.x;
    cube.position.y = branch.end.y;
    cube.position.z = branch.end.z;
    Render3d.add(cube);
    attractorsMeshes.push(cube);
}


function drawAttractors(attractors) {
    clearMeshes(attractorsMeshes);
    attractors.forEach(attractor => {
        drawAttractor(attractor);
    });
}

function drawAttractor(attractor) {
    let material = attractorMaterial;
    const cube = new THREE.Mesh(attractorGeometry, material);
    cube.position.x = attractor.position.x;
    cube.position.y = attractor.position.y;
    cube.position.z = attractor.position.z;
    Render3d.add(cube);
    attractorsMeshes.push(cube);
}

function clearMeshes(meshes) {
    meshes.forEach(mesh => Render3d.remove(mesh));
    meshes = [];
}


init();