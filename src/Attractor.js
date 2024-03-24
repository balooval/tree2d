
export default class Attractor {
    constructor(position, orientation) {
        this.position = position;
        this.orientation = orientation;
        this.nearestBranch = null;
        this.nearestDistance = 999999;
    }
    
    attachBranchIfNeeded(branch) {
        const distance = branch.end.distanceFrom(this.position);
        
        if (this.nearestDistance < distance) {
            return;
        }
    
        this.nearestDistance = distance;
        this.nearestBranch = branch;
    }
} 