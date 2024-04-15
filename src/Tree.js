import {Branch, Seed } from './Branch.js';
import * as GlMatrix from "../vendor/gl-matrix/vec2.js";

export const presets = {
    typeA: {
        presetName: 'typeA',
        energyNeededToGrow: 1,
        heliotropism: 1,
        gravitropism: 0.004,
        angle: 10,
        trunkScale: 0.4,
        flexibility: 0.0004,
        maxLightDistance: 100,
        newBranchLength: 20,
        uselessBeforePrune: 30,
        directionConstrainFactor: 0.1,
        // leavesPreset: 'standard',
        leavesPreset: 'tige',
        // leavesPreset: 'spike',
        trunkColors: [
            'rgb(107, 99, 85)',
            'rgb(117, 111, 100)',
        ],
        trunkHSL: [
            {
                h: 38,
                s: 11,
                l: 38,
            },
            {
                h: 39,
                s: 8,
                l: 43,
            },
        ],

        trunkNoiseSmall: 0.093,
        trunkNoiseMid: 0.006,
        trunkNoiseBig: 0.031,
        minLightForLeaf: 0.5,
    },
    typeB: {
        presetName: 'typeB',
        energyNeededToGrow: 2,
        heliotropism: 1,
        gravitropism: 0,
        angle: 58,
        trunkScale: 0.4,
        flexibility: 0.00008,
        maxLightDistance: 100,
        newBranchLength: 10,
        uselessBeforePrune: 30,
        directionConstrainFactor: 0.04,
        leavesPreset: 'spike',
        trunkColors: [
            'rgb(71, 58, 37)',
            'rgb(82, 62, 29)',
            'rgb(61, 37, 16)',
        ],
        trunkHSL: [
            {
                h: 37,
                s: 31,
                l: 21,
            },
            {
                h: 37,
                s: 48,
                l: 22,
            },
            {
                h: 28,
                s: 58,
                l: 15,
            },
        ],
        trunkNoiseSmall: 0.01,
        trunkNoiseMid: 0.07,
        trunkNoiseBig: 0.1,
        minLightForLeaf: 0.5,
    },
};

export class Tree {

    constructor(positionX, positionY, preset) {
        this.preset = preset;
        this.position = GlMatrix.fromValues(positionX, positionY - 30);
        this.age = 1;
        const seed = new Seed(this, this.position[0], this.position[1]);
        this.root = new Branch(this, seed, this.position[0], this.position[1], this.position[0] + 0, this.position[1] + this.preset.newBranchLength * 0.1, 1);
        this.branchs = [this.root];
        this.branchesEnergyNeed = new Map();
        this.cycle = 0;
    }

    askEnergy(branch, lightQuantity) {
        this.branchesEnergyNeed.set(branch, lightQuantity);
    }

    liftBranches() {
        this.root.liftIfNeeded();
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
        this.branchesEnergyNeed.clear();
    }

    endCycle() {
        this.getBranchs().forEach(branch => branch.endCycle());
        this.cycle ++;
    }

    bendBranches() {
        this.root.bend();
    }

    prune() {
        this.root.pruneIfNeeded();
    }

    getBranchs() {
        return this.root.addToList([]);
    }
}

