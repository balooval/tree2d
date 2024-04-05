import Attractor from './Attractor.js';
import RBush from '../vendor/rbush.js';
import RBushKnn from '../vendor/rbush-knn.js';
import { intCanvasToWorldPosition } from './renderer/BaseRender.js';
import * as UiMouse from './UiMouse.js';
import UiCut from './UiCut.js';

const rbushAttractors = new RBush();
const rbushBranchs = new RBush();
const illuminatedBranchs = new Set();
let attractors = [];

export function treeGrowUpdate(trees, lightSource, applyBend) {
    rbushAttractors.clear();
    rbushBranchs.clear();
    freeAttractors(attractors);

    const lightPosition = intCanvasToWorldPosition(UiMouse.mousePosition[0], UiMouse.mousePosition[1]);
    lightSource.reset(lightPosition[0], lightPosition[1]);

    const branchs = [];
    trees.forEach(tree => branchs.push(...tree.getBranchs()));
    indexBranchs(branchs);
    UiCut.setBranches(rbushBranchs);
    lightSource.emit(rbushBranchs);

    attractors = createAttractors(lightSource.getPhotons());

    branchs.forEach(branch => branch.clearAttractors());
    
    branchs.forEach(branch => attachBranchToAttractors(branch));
    attachAttractorsToBranch(attractors);
    
    trees.forEach(tree => tree.startCycle());
    branchs.forEach(branch => branch.startCycle());

    for (let branch of illuminatedBranchs) {
        branch.takeLight();
    }

    trees.forEach(tree => tree.distributeEnergy());
    trees.forEach(tree => tree.liftBranches());
    trees.forEach(tree => tree.prune());
    if (applyBend) {
        trees.forEach(tree => tree.bendBranches());
    }

    trees.forEach(tree => tree.endCycle());
}

function indexBranchs(branchs) {
    const items = [];

    for (let i = 0; i < branchs.length; i ++) {
        const branch = branchs[i];

        const branchBbox = {
            minX: Math.min(branch.glStart[0], branch.glEnd[0]),
            maxX: Math.max(branch.glStart[0], branch.glEnd[0]),
            minY: Math.min(branch.glStart[1], branch.glEnd[1]),
            maxY: Math.max(branch.glStart[1], branch.glEnd[1]),
            branch: branch,
        };

        items.push(branchBbox);
    }
    
    rbushBranchs.load(items);
}

function attachBranchToAttractors(branch) {
    const nearAttractors = RBushKnn(rbushAttractors, branch.glEnd[0], branch.glEnd[1], undefined, undefined, branch.maxLightDistance);
    nearAttractors.forEach(attractorItem => attractorItem.attractor.attachBranchIfNeeded(branch));
}

function attachAttractorsToBranch(attractors) {

    illuminatedBranchs.clear();

    for (let i = 0; i < attractors.length; i ++) {
        const attractor = attractors[i];
        const branch = attractor.nearestBranch;
        if (branch === null) {
            continue;
        }
        branch.attractors.push(attractor);
        illuminatedBranchs.add(branch);
    }
}

function createAttractors(photons) {

    const attractors = [];
    const items = [];

    for (let i = 0; i < photons.length; i ++) {
        const photon = photons[i];
        const attractor = getAttractor();
        attractor.reset(photon.glPosition, photon.glOrientation);
        attractors.push(attractor);

        items.push({
            minX: photon.glPosition[0],
            maxX: photon.glPosition[0],
            minY: photon.glPosition[1],
            maxY: photon.glPosition[1],
            attractor: attractor,
        });
    }
    
    rbushAttractors.load(items);


    return attractors;
}


const poolAttractors = [];
let poolMaxSize = 0;

function getAttractor() {
    let attractor = poolAttractors.pop();

    if (attractor !== undefined) {
        return attractor;
    }
    for (let i = 0; i < poolMaxSize; i ++) {
        poolAttractors.push(new Attractor());
    }

    return new Attractor();
}

function freeAttractors(attractors) {
    poolAttractors.push(...attractors);
    poolMaxSize = Math.max(poolMaxSize, poolAttractors.length);
}
