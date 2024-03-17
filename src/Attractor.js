
class Attractor {

    constructor(position) {
        this.position = position;
        this.closestBranch = null;
        this.distance = 99999;
        this.minX = this.position.x;
        this.minY = this.position.y;
        this.minZ = this.position.z;
        this.maxX = this.position.x;
        this.maxY = this.position.y;
        this.maxZ = this.position.z;
    }
}

export default Attractor;