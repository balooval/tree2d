import {segmentIntersection, randomize} from './Math.js'
class Light {

    constructor(position, target) {
        this.position = position;
        this.target = target;
        const startToEnd = this.target.sub(this.position);
        this.length = startToEnd.length();
        this.direction = startToEnd.normalize();
        this.rayCount = 160;
        this.width = 80;
        this.angle = this.position.radiansTo(this.target);
        this.rays = [];
        this.photons = [];
    }

    reset(position) {
        this.position = position;
        const startToEnd = this.target.sub(this.position);
        this.length = startToEnd.length();
        this.direction = startToEnd.normalize();
        this.angle = this.position.radiansTo(this.target);
        this.rays = [];
        this.photons = [];
    }

    emit(branchs, rbushBranchs) {
        this.rays = this.#computeRays(branchs, rbushBranchs);
        this.photons = this.#createPhotons();
    }

    getPhotons() {
        return this.photons;
    }

    #computeRays(branchs, rbushBranchs) {
        const rays = [];
        const stepLength = this.width / this.rayCount;

        for (let i = 0; i < this.rayCount; i ++) {
            const distanceFromOrigin = (i - (this.rayCount / 2)) * stepLength;
            const rayStart = this.direction.rotateRadians(Math.PI * 0.5).mulScalarSelf(this.width * distanceFromOrigin);
            rayStart.addSelf(this.position);

            let rayEnd = rayStart.add(this.direction.mulScalar(5000));

            rayEnd = this.#cutRayByBranchs(rayStart, rayEnd, rbushBranchs);

            const ray = new Ray(rayStart, rayEnd);
            rays.push(ray);
        }

        return rays;
    }

    #cutRayByBranchs(rayStart, rayEnd, rbushBranchs) {
        let currentEnd = rayEnd.clone();
        let currentLength = rayEnd.distanceFrom(rayStart);

        const intersectingBranchs = rbushBranchs.search({
            minX: Math.min(rayStart.x, rayEnd.x),
            minY: Math.min(rayStart.y, rayEnd.y),
            maxX: Math.max(rayStart.x, rayEnd.x),
            maxY: Math.max(rayStart.y, rayEnd.y),
        });

        for (let i = 0; i < intersectingBranchs.length; i ++) {
            const branch = intersectingBranchs[i].branch;
            const contact = segmentIntersection(
                rayStart.x, rayStart.y,
                currentEnd.x, currentEnd.y,
                branch.start.x, branch.start.y,
                branch.end.x, branch.end.y,
            );
            if (contact === null) {
                continue;
            }
            const contactVector = new Vector(contact[0], contact[1]);
            const newLength = contactVector.distanceFrom(rayStart);
            if (newLength < currentLength) {
                currentLength = newLength;
                currentEnd = contactVector;
            }
        }
        
        return currentEnd;
    }

    #createPhotons() {
        const photons = [];

        this.rays.forEach(ray => {
            const normalRay = ray.end.sub(ray.start)
            normalRay.normalizeSelf();
            const stepDistance = 50;
            const stepCount = ray.length / stepDistance;
            
            for (let i = 1; i <= stepCount; i ++) {
                const photoRay = normalRay.mulScalar(i * stepDistance);
                photoRay.addSelf(ray.start);

                photoRay.x = randomize(photoRay.x, stepDistance * 0.4);
                photoRay.y = randomize(photoRay.y, stepDistance * 0.4);

                const photon = new Photon(photoRay, this.direction);
                photons.push(photon);
            }
        });

        return photons;
    }

}

class Ray {
    constructor(start, end) {
        this.start = start;
        this.end = end;
        this.length = this.end.clone().subSelf(this.start).length();
    }
}

class Photon {
    constructor(position, orientation) {
        this.position = position;
        this.orientation = orientation;
    }
}

export default Light;