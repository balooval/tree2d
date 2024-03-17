import Branch from "./Branch.js";
import * as MATH from "./Math.js";
import * as THREE from './../vendor/three.module.js';

class Trunk {

    constructor(rootPosition, preset, attractors) {
        this.searchBox = {
            minX: 0,
            minY: 0,
            minZ: 0,
            maxX: 0,
            maxY: 0,
            maxZ: 0,
        };
        
        this.preset = preset;
        this.attractors = attractors;
        this.time = 0;
        this.branchs = [];
        this.branchModifiers = [];
        this.indexedAttractors3d = new RBush3D.RBush3D();
        this.indexedAttractors3d.load(this.attractors);

        this.#addRoot(rootPosition);
    }

    addBranchModifier(modifier) {
        this.branchModifiers.push(modifier);
    }

    getFinalBranchs() {
        return this.branchs.filter(branch => branch.childs.length === 0);
    }
    
    update(attractors) {
        this.attractors = attractors;
        this.indexedAttractors3d = new RBush3D.RBush3D();
        this.indexedAttractors3d.load(this.attractors);
        this.#clearNearAttractors();
        this.#grow();
    }

    #grow() {
        let branchesAdded = 0;
        this.time ++;
        this.branchs.forEach(branch => branch.updateAge(this.time));
        let branchesCount = this.branchs.length;
        this.#buildBranchs();

        for (let m = 0; m < this.branchModifiers.length; m ++) {
            this.branchs = this.branchModifiers[m].apply(this.branchs);
        }

        let newBranchesCount = this.branchs.length;
        branchesAdded = newBranchesCount - branchesCount;

        return branchesAdded;
    }

    #buildBranchs() {
        const attractorsInfluencingBranchs = this.#getAttractorsInfluencingBranchs(this.branchs);
        const attractedBranchs = this.#getAttractedBranchs(attractorsInfluencingBranchs);
        this.#growAttractedBranchs(attractedBranchs);
    }

    #getAttractorsInfluencingBranchs(branchs) {
        const attractorsInfluencingBranchs = new Set();

        for (let b = 0; b < branchs.length; b ++) {
            
            const branch = branchs[b];
            branch.attractors = [];
            const viewedAttractors = this.#getViewedAttractors(branch);

            for (let a = 0; a < viewedAttractors.length; a ++) {
                const attractor = viewedAttractors[a];
                const distance = attractor.position.distanceTo(branch.end);

                if (attractor.distance < distance) {
                    continue;
                }

                attractor.distance = distance;
                attractor.closestBranch = branch;
                attractorsInfluencingBranchs.add(attractor);
            }
        }

        return attractorsInfluencingBranchs;
    }

    #getAttractedBranchs(attractorsInfluencingBranchs) {
        const attractedBranchs = new Set();

        for (let attractor of attractorsInfluencingBranchs) {
            const branch = attractor.closestBranch;
            branch.attractors.push(attractor);
            attractedBranchs.add(branch);
        }

        for (let branch of attractedBranchs) {
            if (branch.attractors.length < this.preset.branchMinimumAttractors) {
                attractedBranchs.delete(branch);
            }
        }
        
        return attractedBranchs; 
    }

    #growAttractedBranchs(attractedBranchs) {
        const stepVector = new THREE.Vector3();

        for (let branch of attractedBranchs) {
            const translationVector = new THREE.Vector3();

            for (let a = 0; a < branch.attractors.length; a ++) {
                const attractor = branch.attractors[a];
                stepVector.x = attractor.position.x - branch.end.x,
                stepVector.y = attractor.position.y - branch.end.y,
                stepVector.z = attractor.position.z - branch.end.z,
                translationVector.add(stepVector);
            }
            
            translationVector.normalize();
            this.#addBranch(branch, translationVector);
        }
    }

    #addBranch(branch, direction) {
        if (branch.childs.length > 0 && branch.stepsFromRoot < this.preset.minStepFromRoot) {
            return;
        }
        const limitedDirection = new THREE.Vector3(
            MATH.lerpFloat(branch.direction.x, direction.x, this.preset.branchDirectionFreedom),
            MATH.lerpFloat(branch.direction.y, direction.y, this.preset.branchDirectionFreedom),
            MATH.lerpFloat(branch.direction.z, direction.z, this.preset.branchDirectionFreedom),
        );

        const newBranch = branch.addChild(limitedDirection);
        this.branchs.push(newBranch);
        return newBranch;
    }

    #clearNearAttractors() {
        for (let b = 0; b < this.branchs.length; b ++) {
            const branch = this.branchs[b];
            const viewedAttractors = this.#getViewedAttractors(branch);

            for (let a = 0; a < viewedAttractors.length; a ++) {
                const attractor = viewedAttractors[a];
                const distance = attractor.position.distanceTo(branch.end);

                if (distance < branch.getGrowDistance()) {
                    this.indexedAttractors3d.remove(attractor);
                }
            }
        }
    }

    #getViewedAttractors(branch) {
        const searchRadius = branch.getSearchRadius();
        this.searchBox.minX = branch.end.x - searchRadius;
        this.searchBox.minY = branch.end.y - searchRadius;
        this.searchBox.minZ = branch.end.z - searchRadius;
        this.searchBox.maxX = branch.end.x + searchRadius;
        this.searchBox.maxY = branch.end.y + searchRadius;
        this.searchBox.maxZ = branch.end.z + searchRadius;
        return this.indexedAttractors3d.search(this.searchBox);
    }

    #addRoot(position) {
        let rootParent = {
            end : new THREE.Vector3(position[0], position[1], position[2]),
            time : 0,
            branchLength : this.preset.branchLength,
            stepsFromRoot : 0,
            myMinDistance : this.preset.minDistance,
            mySearchRadius : this.preset.searchDistance / 2,
        }

        let root = new Branch(rootParent, new THREE.Vector3(0, 1, 0));
        this.branchs.push(root);
    }
}




export default Trunk;