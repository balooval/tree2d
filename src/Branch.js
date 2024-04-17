import { randomElement, radians } from "./Math.js";
import * as GlMatrix from "../vendor/gl-matrix/vec2.js";

const glOrigin = GlMatrix.fromValues(0, 0);
const glGround = GlMatrix.fromValues(1, 0);
const glOutput = GlMatrix.fromValues(0, 0);

let ID = 0;
export class Branch {
    constructor(tree, parent, startX, startY, endX, endY, mainStrenght) {
        this.id = ID ++;
        this.tree = tree;
        this.preset = this.tree.preset;
        this.maxLightDistance = this.preset.maxLightDistance;
        this.newBranchLength = this.preset.newBranchLength;
        this.directionConstrainFactor = this.preset.directionConstrainFactor;
        this.trunkColor = randomElement(this.preset.trunkColors);
        this.trunkHSL = randomElement(this.preset.trunkHSL);
        this.attractors = [];
        this.childs = [];
        this.parent = parent;
        this.weight = 1;
        
        this.age = 1;
        this.width = 1;
        this.cyclesWithoutEnergy = 0;

        this.leavesHealth = 1;
        this.leavesSize = 0;
        
        this.glNewBranchEnd = GlMatrix.create();
        this.attractorLightPercentVector = GlMatrix.create();
        this.glNormalizedTranslation = GlMatrix.create();
        this.budOrientationVector = GlMatrix.create();
        this.budConstrainVector = GlMatrix.create();
        this.glVectorToAttractor = GlMatrix.create();

        this.glStart = GlMatrix.fromValues(startX, startY);
        this.glEnd = GlMatrix.fromValues(endX, endY);

        this.glDirection = GlMatrix.create();
        GlMatrix.sub(this.glDirection, this.glEnd, this.glStart)
        GlMatrix.normalize(this.glDirection, this.glDirection);
        this.length = GlMatrix.dist(this.glEnd, this.glStart);

        this.uvs = [
            this.glStart[0], this.glStart[1],
            this.glStart[0] + this.width, this.glStart[1] + this.length,
        ];

        this.mainStrenght = mainStrenght;
        this.budsLight = 0;
        this.buds = this.createBuds();
        this.scar = false;

        this.cycleWidthCount = 0;
    }

    createBuds() {
        const angle = this.preset.angle;
        const angleRadian = radians(angle);
        const lateralStrenght = Math.min(1, this.tree.age / 50);

        return [
            {
                active: true,
                light: 0,
                energy: 0,
                relativeAngle: 0,
                strenght: this.mainStrenght,
                glOrientation: GlMatrix.clone(this.glDirection),
            },
            {
                active: true,
                light: 0,
                energy: 0,
                relativeAngle: angle,
                strenght: this.mainStrenght * lateralStrenght,
                glOrientation: GlMatrix.rotate(this.budOrientationVector, this.glDirection, glOrigin, angleRadian),
            },
            {
                active: true,
                light: 0,
                energy: 0,
                relativeAngle: angle * -1,
                strenght: this.mainStrenght * lateralStrenght,
                glOrientation: GlMatrix.rotate(this.budOrientationVector, this.glDirection, glOrigin, angleRadian * -1),
            },
        ];
    }

    startCycle() {
        this.cyclesWithoutEnergy ++;
        this.cycleWidthCount = 0;
    }

    endCycle() {
        this.age ++;

    }

    takeLight() {
        if (this.buds.length === 0) {
            return;
        }

        this.budsLight = 0;

        for (let i = 0; i < this.buds.length; i ++) {
            this.buds[i].light = this.#computeBudLight(this.buds[i]);
            this.budsLight += this.buds[i].light;
        }

        this.tree.askEnergy(this, this.budsLight);
    }

    addEnergy(quantity) {
        this.diffuseEnergy(quantity);
        this.addWidth(quantity * 0.02);
    }

    liftIfNeeded() {
        if (this.cycleWidthCount === 0) {
            return;
        }

        this.flexToSky(this.cycleWidthCount);

        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].liftIfNeeded();
        }
    }
    
    diffuseEnergy(quantity) {
        for (let i = 0; i < this.buds.length; i ++) {
            const percent = this.buds[i].light / this.budsLight;
            const budEnergy = percent * quantity;
            this.buds[i].energy += budEnergy;
            
            if (this.buds[i].energy >= this.preset.energyNeededToGrow) {
                this.buds[i].active = false;
                this.#createChild(this.buds[i]);
            }
        }

        this.buds = this.buds.filter(bud => bud.active);
    }

    #computeBudLight(bud) {
        let lightQuantity = 0;

        for (let i = 0; i < this.attractors.length; i ++) {
            const attractor = this.attractors[i];

            const vectorToAttractorLength = GlMatrix.length(GlMatrix.sub(glOutput, attractor.glPosition, this.glEnd));
            let normalizedAttractorForce = (this.maxLightDistance - vectorToAttractorLength) / this.maxLightDistance;
            let lightPercentByOrientation = (GlMatrix.dot(GlMatrix.negate(glOutput, bud.glOrientation), attractor.glOrientation) + 1) / 2;
            let lightPercentByPosition = (GlMatrix.dot(bud.glOrientation, GlMatrix.normalize(glOutput, GlMatrix.sub(glOutput, attractor.glPosition, this.glEnd))) + 1) / 2;

            normalizedAttractorForce *= lightPercentByOrientation;
            normalizedAttractorForce *= lightPercentByPosition;
            lightQuantity += normalizedAttractorForce;
        };

        return lightQuantity * bud.strenght;
    }

    addWidth(quantity) {
        this.width += quantity;
        this.cycleWidthCount ++;
        this.cyclesWithoutEnergy = 0;
        this.parent.addWidth(quantity);
    }

    flexToSky(factor) {
        if (this.width > 20) {
            return;
        }
        const localFlexibility = this.preset.gravitropism / this.width;
        if (localFlexibility < 0.0001) {
            return;
        }

        const bendFactor = GlMatrix.dot(this.glDirection, glGround);
        const bendAngle = (bendFactor * localFlexibility) * factor;
        GlMatrix.rotate(this.glEnd, this.glEnd, this.glStart, bendAngle);
        GlMatrix.normalize(this.glDirection, GlMatrix.sub(glOutput, this.glEnd, this.glStart));

        this.width += Math.abs(bendAngle) * 50;

        for (let i = 0; i < this.buds.length; i ++) {
            GlMatrix.rotate(this.buds[i].glOrientation, this.glDirection, glOrigin, radians(this.buds[i].relativeAngle));
        }

        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].followParentBend(bendAngle, this.glStart);
        }
    }

    #createChild(bud) {        
        const childEnd = this.#computeAverageAttraction(bud);
        const child = new Branch(this.tree, this, this.glEnd[0], this.glEnd[1], childEnd[0], childEnd[1], bud.strenght);
        this.childs.push(child);
    }

    #computeAverageAttraction(bud) {
        const glLightAttraction = GlMatrix.fromValues(0, 0);
        
        for (let i = 0; i < this.attractors.length; i ++) {
            const attractor = this.attractors[i];
            
            GlMatrix.sub(this.glVectorToAttractor, attractor.glPosition, this.glEnd);            
            let glNormalizedAttractorForce = (this.maxLightDistance - GlMatrix.length(this.glVectorToAttractor)) / this.maxLightDistance;
            glNormalizedAttractorForce *= this.getAttractorLightPercent(attractor);
            
            GlMatrix.scale(this.glNormalizedTranslation, GlMatrix.normalize(this.glNormalizedTranslation, this.glVectorToAttractor), glNormalizedAttractorForce);
            
            GlMatrix.add(glLightAttraction, glLightAttraction, this.glNormalizedTranslation);
        };
        

        GlMatrix.normalize(glLightAttraction, glLightAttraction);

        GlMatrix.scale(this.budConstrainVector, bud.glOrientation, this.directionConstrainFactor);
        GlMatrix.scale(this.glNewBranchEnd, glLightAttraction, 1 - this.directionConstrainFactor);
        GlMatrix.add(this.glNewBranchEnd, this.glNewBranchEnd, this.budConstrainVector);
        GlMatrix.normalize(this.glNewBranchEnd, this.glNewBranchEnd);
        GlMatrix.scale(this.glNewBranchEnd, this.glNewBranchEnd, this.newBranchLength);
        GlMatrix.add(this.glNewBranchEnd, this.glNewBranchEnd, this.glEnd);

        return this.glNewBranchEnd;
    }

    pruneIfNeeded() {
        if (this.cyclesWithoutEnergy > this.preset.uselessBeforePrune && this.parent !== null) {
            this.remove();
        }

        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].pruneIfNeeded();
        }
    }

    applyGravity() {
        const localFlexibility = this.preset.flexibility / this.width;

        const ground = GlMatrix.fromValues(-1, 0);
        const bendFactor = GlMatrix.dot(this.glDirection, ground);
        const bendAngle = (bendFactor * this.length * this.weight) * localFlexibility;

        this.rotate(bendAngle);
        
        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].applyGravity();
        }
    }

    softRotate(angle, curDepth, maxDepth) {
        this.rotate(angle);

        if (curDepth < maxDepth) {
            for (let i = 0; i < this.childs.length; i ++) {11
                this.childs[i].softRotate(angle * 0.8, curDepth + 1, maxDepth);
            }
        }
    }

    rotate(angle) {
        GlMatrix.rotate(this.glEnd, this.glEnd, this.glStart, angle);
        GlMatrix.normalize(this.glDirection, GlMatrix.sub(glOutput, this.glEnd, this.glStart));
        this.length = GlMatrix.dist(this.glEnd, this.glStart)

        for (let i = 0; i < this.buds.length; i ++) {
            GlMatrix.rotate(this.buds[i].glOrientation, this.glDirection, glOrigin, radians(this.buds[i].relativeAngle));
        }

        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].followParentBend(angle, this.glStart);
        }
    }

    followParentBend(bendAngle, glBendStart) {
        GlMatrix.rotate(this.glStart, this.glStart, glBendStart, bendAngle);
        GlMatrix.rotate(this.glEnd, this.glEnd, glBendStart, bendAngle);
        GlMatrix.normalize(this.glDirection, GlMatrix.sub(glOutput, this.glEnd, this.glStart));
        this.length = GlMatrix.dist(this.glEnd, this.glStart)
        

        for (let i = 0; i < this.childs.length; i ++) {
            this.childs[i].followParentBend(bendAngle, glBendStart);
        }
    }

    getAttractorLightPercent(attractor) {
        GlMatrix.sub(this.attractorLightPercentVector, this.glEnd, attractor.glPosition);
        GlMatrix.normalize(this.attractorLightPercentVector, this.attractorLightPercentVector);
        const percent = GlMatrix.dot(this.attractorLightPercentVector,attractor.glOrientation);

        return (percent + 1) / 2;
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

    getWidth() {
        return Math.max(1, this.width * this.preset.trunkScale);
    }

    getLeaves() {
        const minLight = this.preset.minLightForLeaf;
        return this.buds.filter(bud => bud.light > minLight);
    }

    getLeavesObstruction() {
        return this.childs.length + this.buds.length;
    }

    remove() {
        this.parent.removeChild(this);
        
        if (this.childs.length > 0) {
            return;
        }

        this.childs = [];
    }

    removeChild(childBranch) {
        this.childs = this.childs.filter(branch => branch !== childBranch);
        this.buds.push(...this.createBuds());
        this.scar = true;
    }
}

export class Seed {
    constructor (tree, positionX, positionY) {
        this.tree = tree;
        this.childs = [];
        this.preset = this.tree.preset;
        this.trunkHSL = randomElement(this.preset.trunkHSL);
        this.trunkColor = randomElement(this.preset.trunkColors);
        this.width = 10;

        this.glEnd = GlMatrix.fromValues(positionX, positionY);
        this.glStart = GlMatrix.sub(GlMatrix.create(), this.glEnd, GlMatrix.fromValues(0, -1));
        
        this.glDirection = GlMatrix.create();
        GlMatrix.sub(this.glDirection, this.glEnd, this.glStart)
        GlMatrix.normalize(this.glDirection, this.glDirection);
        
        this.length = GlMatrix.dist(this.glEnd, this.glStart)
    }

    getWidth() {
        return Math.max(2, this.width * 2);
    }

    addWidth(quantity) {
        this.width += quantity;
    }

    remove() {

    }

    removeChild() {

    }
}