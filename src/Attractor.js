import * as GlMatrix from "../vendor/gl-matrix/vec2.js";

export default class Attractor {
    constructor() {
        this.glPosition = GlMatrix.create();
        this.glOrientation = GlMatrix.create();

        this.nearestBranch = null;
        this.nearestDistance = 999999;
    }

    reset(glPosition, glOrientation) {
        GlMatrix.copy(this.glPosition, glPosition);
        GlMatrix.copy(this.glOrientation, glOrientation);

        this.nearestBranch = null;
        this.nearestDistance = 999999;
    }
    
    attachBranchIfNeeded(branch) {

        if (branch.buds.length === 0) {
            return;
        }

        const distance = GlMatrix.dist(branch.glEnd, this.glPosition);
        
        if (this.nearestDistance < distance) {
            return;
        }
    
        this.nearestDistance = distance;
        this.nearestBranch = branch;
    }
} 