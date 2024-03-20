import { randomize, randomElement } from "./Math.js";

export const presets = {
    typeA: {
        heliotropism: 0,
        density: 20,
        auxinProduction: 10,
        maxLightDistance: 120,
        newBranchLength: 10,
        flexibility: 2,
        uselessBeforePrune: 2,
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
        heliotropism: 1,
        density: 1,
        auxinProduction: 1,
        maxLightDistance: 100,
        newBranchLength: 15,
        flexibility: 10,
        uselessBeforePrune: 3,
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

    constructor(position, presetType) {
        this.position = position;
        this.tips = new Set();
        this.root = new Branch(this, null, presetType, position, new Vector(position.x + 0, position.y + presets[presetType].newBranchLength), 5);
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

class Branch {
    constructor(tree, parent, presetType, start, end) {
        this.tree = tree;
        this.presetType = presetType;
        this.start = start;
        this.end = end;
        this.startToEndVector = this.end.sub(this.start);
        this.length = this.startToEndVector.length();
        this.direction = this.startToEndVector.normalize();
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
        this.uselessBeforePrune = 50;
        this.stepsWithUselesEnergy = 0;
        this.auxinProduction = this.preset.auxinProduction;
        this.auxinQuantity = 0;
        this.totalEnergyTransfered = 1;
        this.energyTransferedByCycle = 0;
        this.weight = 1;
        this.tickness = 1;
        this.density = this.preset.density;
        this.heliotropism = this.preset.heliotropism;

        this.tree.addTip(this);
    }

    startCycle() {
        this.energyTransferedByCycle = 0;
    }

    endCycle() {
        // this.tickness += (this.energyTransferedByCycle * this.weight) / (this.length * 100);
        this.tickness = Math.max(
            this.tickness,
            (this.energyTransferedByCycle * this.weight) / (this.length * 30)
        );

        if (this.parent === null) {
            // console.log('ROOT this.length', this.length);
        } else {
            // console.log('this.length', this.length);
        }

        this.totalEnergyTransfered += this.energyTransferedByCycle;

        if (this.energyTransferedByCycle === 0) {
            this.stepsWithUselesEnergy ++;
        }

        this.auxinQuantity *= 0.9;

        if (this.parent === null) {
            this.energy = 1000;
        }
    }

    bend() {
        const localFlexibility = 1 / (((this.tickness * this.density) * this.flexibility) * 90000);
        const ground = new Vector(-1, 0);
        const bendFactor = this.end.sub(this.start).normalizeSelf().dot(ground);
        const bendAngle = (bendFactor * this.length * this.weight) * localFlexibility;
        const newEnd = this.end.sub(this.start);
        newEnd.rotateRadiansSelf(bendAngle);
        this.end = newEnd.add(this.start);

        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].followParentBend(this.start, bendAngle);
        }
        
        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].bend();
        }
    }

    updateWeight(parentWeight) {
        this.weight = this.end.sub(this.start).length() + parentWeight;

        if (this.parent === null) {
            // console.log('this.weight', this.weight);
            return;
        }

        this.parent.updateWeight(this.weight);
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

        if (this.auxinQuantity > 1) {
            return;
        }
        
        let lightQuantity = 0;

        for (let i = 0; i < this.attractors.length; i ++) {
            const attractor = this.attractors[i];
            const distance = attractor.position.distanceFrom(this.end);

            const attractorLightPercent = this.getAttractorLightPercent(attractor);
            const attractorLight = ((this.maxLightDistance - distance) / this.maxLightDistance) * attractorLightPercent;
            lightQuantity += attractorLight;
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
        /*
        this.stepsWithUselesEnergy = 0;
        this.energyTransferedByCycle += quantity;

        if (this.parent === null) {
            return quantity;
        }

        return this.parent.pumpEnergy(quantity);
        */

        this.stepsWithUselesEnergy = 0;
        // J'en ai assez, je te retourne ce dont tu a besoin
        let energyToGive;

        energyToGive = this.takeEnergy(quantity);

        if (energyToGive >= quantity) {
            this.energyTransferedByCycle += energyToGive;
            return energyToGive;
        }
        
        if (this.parent === null) {
            this.energyTransferedByCycle += energyToGive;
            return energyToGive;
        }
        
        // Il m'en manque, je refais mon stock et te retourne ce que tu me demande
        const parentEnergy = this.parent.pumpEnergy(this.pumpQuantityToParent);
        this.energy += parentEnergy;
        
        energyToGive += this.takeEnergy(quantity - energyToGive);
        
        this.energyTransferedByCycle += energyToGive;
        return energyToGive;
    }

    takeEnergy(quantity) {
        const energyToGive = Math.min(this.energy, quantity);
        this.energy -= energyToGive;
        return energyToGive;
    }

    pruneIfNeeded() {
        if (this.stepsWithUselesEnergy > this.uselessBeforePrune && this.parent !== null) {
            this.parent.childs = this.parent.childs.filter(branch => branch !== this);
            if (this.childs.length > 0) {
                return;
            }
            this.tree.removeTip(this);
            if (this.parent.childs.length === 0) {
                this.tree.addTip(this.parent);
            }
            return;
        }

        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].pruneIfNeeded();
        }
    }

    getWidth() {
        return this.tickness;
        return 2 + this.totalEnergyTransfered * 0.1;
    }

    createChild(lightQuantity) {
        this.auxinQuantity += this.auxinProduction;

        const childEnd = this.computeAverageAttraction(lightQuantity);
        const child = new Branch(this.tree, this, this.presetType, this.end, childEnd);
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

    computeAverageAttraction(lightQuantity) {
        const newBranchEnd = new Vector(0, 0);

        for (let i = 0; i < this.attractors.length; i ++) {
            const attractor = this.attractors[i];
            const vectorToAttractor = attractor.position.sub(this.end);
            
            let normalizedAttractorForce = (this.maxLightDistance - vectorToAttractor.length()) / this.maxLightDistance;
            normalizedAttractorForce *= this.getAttractorLightPercent(attractor);

            const normalizedTranslation = vectorToAttractor.normalize().mulScalarSelf(normalizedAttractorForce);
            newBranchEnd.addSelf(normalizedTranslation);
        };

        newBranchEnd.addSelf(this.direction.mulScalar(this.directionConstrainFactor));

        newBranchEnd.normalizeSelf();
        // newBranchEnd.mulScalarSelf(this.newBranchLength);
        const lengthLightFactor = 1 / Math.max(1, lightQuantity * this.heliotropism);
        // console.log('lightQuantity', lightQuantity, lengthLightFactor);
        const finalLength = (this.newBranchLength * 0.2) + (lengthLightFactor * (this.newBranchLength * 2));
        newBranchEnd.mulScalarSelf(finalLength);
        // newBranchEnd.mulScalarSelf(this.newBranchLength  / Math.max(lightQuantity, 1)); // TODO: faire mieux qu'une soustraction

        newBranchEnd.addSelf(this.end); 

        return newBranchEnd;
    }

    getAttractorLightPercent(attractor) {
        return ((this.end.sub(attractor.position).normalizeSelf().dot(attractor.orientation)) + 1) / 2;
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