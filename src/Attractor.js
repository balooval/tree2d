import * as GlMatrix from "../vendor/gl-matrix/vec2.js";

export default class Attractor {
    constructor(glPosition, glOrientation) {
        this.glPosition = glPosition
        this.glOrientation = glOrientation

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