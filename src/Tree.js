import Branch from './Branch.js';

export const presets = {
    typeA: {
        presetName: 'typeA',
        heliotropism: 0,
        density: 20,
        auxinProduction: 10,
        maxLightDistance: 120,
        newBranchLength: 10,
        rigidity: 2,
        uselessBeforePrune: 2,
        pumpQuantityToParent: 5,
        lightBeforeGrow: 2,
        directionConstrainFactor: 0.5,
        leaveSize: 4,
        leaveDispersion: 30,
        leaveColors: [
            {h: 70, s: 70, l: 20},
            {h: 30, s: 70, l: 20},
            {h: 65, s: 100, l: 15},
        ],
        trunkColors: [
            'rgb(107, 99, 85)',
            'rgb(117, 111, 100)',
        ],
    },
    typeB: {
        presetName: 'typeB',
        heliotropism: 1,
        density: 1,
        auxinProduction: 1,
        maxLightDistance: 100,
        newBranchLength: 15,
        rigidity: 10,
        uselessBeforePrune: 3,
        pumpQuantityToParent: 5,
        lightBeforeGrow: 8,
        directionConstrainFactor: 0,
        leaveSize: 5,
        leaveDispersion: 20,
        leaveColors: [
            {h: 70, s: 70, l: 20},
            {h: 30, s: 70, l: 20},
            {h: 65, s: 100, l: 15},
        ],
        trunkColors: [
            'rgb(71, 58, 37)',
            'rgb(82, 62, 29)',
            'rgb(61, 37, 16)',
        ],
    },
};

export class Tree {

    constructor(position, preset) {
        this.preset = preset;
        this.position = position;
        this.tips = new Set();
        this.root = new Branch(this, null, position, new Vector(position.x + 0, position.y + this.preset.newBranchLength), 5);
        this.root.energy = 500;
        this.branchs = [this.root];
    }

    endCycle() {
        this.getBranchs().forEach(branch => branch.endCycle());
    }

    bendBranches() {
        this.root.bend();
    }

    prune() {
        this.root.pruneIfNeeded();
    }

    resetTips() {
        this.tips = new Set();
    }
    
    addTip(branch) {
        this.tips.add(branch);
    }
    
    removeTip(branch) {
        this.tips.delete(branch);
    }

    updateFromTips() {
        for (let branch of this.tips) {
            branch.updateWeight(0);
        }
    }

    getBranchs() {
        return this.root.addToList([]);
    }
}

