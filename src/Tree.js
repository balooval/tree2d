import { randomize, randomElement } from "./Math.js";

export const presets = {
    typeA: {
        maxLightDistance: 120,
        newBranchLength: 15,
        flexibility: 0.00002,
        uselessBeforePrune: 10,
        pumpQuantityToParent: 5,
        lightBeforeGrow: 10,
        directionConstrainFactor: 0.5,
        leaveCountMultiplier: 2,
        leaveSize: 3,
        leaveDispersion: 40,
        leaveColors: [
            'rgb(0, 255, 0)',
            'rgb(147, 237, 102)',
        ],
        trunkColors: [
            'rgb(107, 99, 85)',
            'rgb(117, 111, 100)',
        ],
    },
    typeB: {
        maxLightDistance: 100,
        newBranchLength: 10,
        flexibility: 0.00001,
        uselessBeforePrune: 10,
        pumpQuantityToParent: 5,
        lightBeforeGrow: 5,
        directionConstrainFactor: 0,
        leaveCountMultiplier: 3,
        leaveSize: 5,
        leaveDispersion: 20,
        leaveColors: [
            'rgb(22, 130, 23)',
            'rgb(75, 156, 59)',
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
        this.position = position;
        this.root = new Branch(null, preset, position, new Vector(position.x + 20, position.y + 100), 5);
        this.root.energy = 500;
        this.branchs = [this.root];
    }

    addAge() {
        this.getBranchs().forEach(branch => branch.addAge());
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

class Branch {
    constructor(parent, presetType, start, end) {
        this.presetType = presetType;
        this.start = start;
        this.end = end;
        this.direction = this.end.sub(this.start).normalizeSelf();
        this.preset = presets[this.presetType];
        this.maxLightDistance = this.preset.maxLightDistance;
        this.newBranchLength = this.preset.newBranchLength;
        this.flexibility = this.preset.flexibility;
        this.lightBeforeGrow = this.preset.lightBeforeGrow;
        this.pumpQuantityToParent = this.preset.pumpQuantityToParent;
        this.directionConstrainFactor = this.preset.directionConstrainFactor;
        this.trunkColor = randomElement(this.preset.trunkColors);
        this.attractors = [];
        this.childs = [];
        this.parent = parent;
        this.totalChildsCount = 0;
        this.energy = 0;
        this.uselessBeforePrune = 10;
        this.stepsWithUselesEnergy = 0;
        this.energyAsked = false;
    }

    bend() {
        if (this.totalChildsCount > 5 && this.totalChildsCount < 20 && this.parent !== null) {
            const myLength = this.end.distanceFrom(this.start);
            const localRigidity = myLength / this.totalChildsCount;
            const ground = new Vector(-1, 0);
            const bendForce = this.end.sub(this.start).normalizeSelf().dot(ground);
            const bendAngle = (bendForce * myLength * this.totalChildsCount) * (this.flexibility / localRigidity);
            const newEnd = this.end.sub(this.start);
            newEnd.rotateRadiansSelf(bendAngle);
            this.end = newEnd.add(this.start);

            for (let i = 0; i < this.childs.length; i ++) {
                this.childs[i].followParentBend(this.start, bendAngle);
            }
        }
        
        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].bend();
        }
    }

    followParentBend(start, bendAngle) {
        this.start = this.start.sub(start).rotateRadiansSelf(bendAngle).addSelf(start);
        this.end = this.end.sub(start).rotateRadiansSelf(bendAngle).addSelf(start);

        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].followParentBend(start, bendAngle);
        }
    }

    takeLight() {
        if (this.attractors.length === 0) {
            return;
        }
        
        let lightQuantity = 0;

        for (let i = 0; i < this.attractors.length; i ++) {
            const distance = this.attractors[i].position.distanceFrom(this.end);
            lightQuantity += (this.maxLightDistance - distance) / this.maxLightDistance;
        }

        if (this.energy < this.lightBeforeGrow) {
            if (this.parent !== null) {
                const pumpedEnergy = this.parent.pumpEnergy(this.pumpQuantityToParent);
                this.energy += pumpedEnergy;
            }
            return;
        }

        this.createChild(lightQuantity);
    }

    pumpEnergy(quantity) {
        this.energyAsked = true;
        this.stepsWithUselesEnergy = 0;
        // J'en ai assez, je te retourne ce dont tu a besoin
        let energyToGive;

        energyToGive = this.takeEnergy(quantity);

        if (energyToGive >= quantity) {
            return energyToGive;
        }

        if (this.parent === null) {
            // this.energy += 10;
            return energyToGive;
        }

        // Il m'en manque, je refais mon stock et te retourne ce que tu me demande
        const parentEnergy = this.parent.pumpEnergy(this.pumpQuantityToParent);
        this.energy += parentEnergy;

        energyToGive += this.takeEnergy(quantity - energyToGive);

        return energyToGive;
    }

    takeEnergy(quantity) {
        const energyToGive = Math.min(this.energy, quantity);
        this.energy -= energyToGive;
        return energyToGive;
    }

    addAge() {
        if (this.energyAsked === false) {
            this.stepsWithUselesEnergy ++;
        }
        this.energyAsked = false;

        if (this.parent === null) {
            this.energy = 1000;
        }
    }

    pruneIfNeeded() {
        if (this.stepsWithUselesEnergy > this.uselessBeforePrune && this.parent !== null) {
            this.parent.childs = this.parent.childs.filter(branch => branch !== this);
            return;
        }

        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].pruneIfNeeded();
        }
    }

    getWidth() {
        return Math.max(3, Math.atan(this.totalChildsCount * 0.005) * 50);
    }

    createChild(lengthFactor) {
        const childEnd = this.computeAverageAttraction(lengthFactor);
        const child = new Branch(this, this.presetType, this.end, childEnd);
        // child.newBranchLength = this.newBranchLength * 0.98;
        this.childs.push(child);
        this.addChildCount(1);
    }

    addChildCount(count) {
        this.totalChildsCount += count;
        if (this.parent === null) {
            return;
        }
        this.parent.addChildCount(count);
    }

    computeAverageAttraction(lengthFactor) {
        const newBranchEnd = new Vector(0, 0);
        // console.log('lengthFactor', lengthFactor);

        for (let i = 0; i < this.attractors.length; i ++) {
            const attractor = this.attractors[i];
            const vectorToAttractor = attractor.position.sub(this.end);
            const normalizedAttractorForce = (this.maxLightDistance - vectorToAttractor.length()) / this.maxLightDistance;
            const normalizedTranslation = vectorToAttractor.normalize().mulScalarSelf(normalizedAttractorForce);
            newBranchEnd.addSelf(normalizedTranslation);
        };

        newBranchEnd.addSelf(this.direction.mulScalar(this.directionConstrainFactor));

        newBranchEnd.normalizeSelf();
        newBranchEnd.mulScalarSelf(this.newBranchLength * lengthFactor);
        newBranchEnd.addSelf(this.end); 

        return newBranchEnd;
    }

    clearAttractors() {
        this.attractors = [];
    }

    addToList(branchs) {
        branchs.push(this);
        for (let i = 0; i < this.childs.length; i ++) {
            branchs = this.childs[i].addToList(branchs);
        }
        return branchs;
    }
}