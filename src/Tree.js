import {Branch, Seed } from './Branch.js';

export const presets = {
    typeA: {
        presetName: 'typeA',
        energyNeededToGrow: 2,
        heliotropism: 1,
        angle: 10,
        flexibility: 0.00005,
        maxLightDistance: 100,
        newBranchLength: 30,
        uselessBeforePrune: 30,
        directionConstrainFactor: 0.1,
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
        energyNeededToGrow: 2,
        heliotropism: 1,
        angle: 90,
        flexibility: 0.00005,
        maxLightDistance: 100,
        newBranchLength: 20,
        uselessBeforePrune: 2,
        directionConstrainFactor: 0.7,
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
        this.age = 1;
        this.tips = new Set();
        const seed = new Seed(position);
        this.root = new Branch(this, seed, position, new Vector(position.x + 0, position.y + this.preset.newBranchLength * 0.1), 1);
        this.branchs = [this.root];
        this.branchesEnergyNeed = new Map();
    }

    askEnergy(branch, lightQuantity) {
        this.branchesEnergyNeed.set(branch, lightQuantity);
    }

    distributeEnergy() {
        let totalEnergyAsked = 0;
        const totalEnergy = Math.min(300, Math.exp(this.age / 100));

        for (const [branch, lightQuantity] of this.branchesEnergyNeed) {
            totalEnergyAsked += lightQuantity;
        }


        const energyToGive = Math.min(totalEnergyAsked, totalEnergy);

        

        for (const [branch, lightQuantity] of this.branchesEnergyNeed) {
            const energyPercentForBranch = lightQuantity / totalEnergyAsked;
            const energyForBranch = energyToGive * energyPercentForBranch;
            // console.log('Get', energyForBranch, '/', lightQuantity, `(${Math.round(energyPercentForBranch * 100)}%)`);
            // console.log('Ask', lightQuantity, 'Get', (energyPercentForBranch * 100), '%', 'So get', energyForBranch, 'on', energyToGive);
            branch.addEnergy(energyForBranch);
        }
    }

    giveLightToBranches() {

    }

    startCycle() {
        this.age ++;
        this.branchesEnergyNeed = new Map();
        this.#resetTips();
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

    #resetTips() {
        this.tips = new Set();
    }
    
    addTip(branch) {
        this.tips.add(branch);
    }
    
    removeTip(branch) {
        this.tips.delete(branch);
    }

    getBranchs() {
        return this.root.addToList([]);
    }
}

