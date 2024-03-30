import {segmentIntersection, randomize} from './Math.js'
class Light {

    constructor(position, target) {
        this.position = position;
        this.target = target;
        const startToEnd = this.target.sub(this.position);
        this.length = startToEnd.length();
        this.direction = startToEnd.normalize();
        this.width = 2000;
        this.rayMargin = 50;
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

    emit(rbushBranchs) {
        const treesWidth = (rbushBranchs.data.maxX - rbushBranchs.data.minX) + 500;
        const widthMultiplier = Math.abs(Math.tan(this.angle + (Math.PI / 2))) + 1;
        this.width = treesWidth * Math.min(3, widthMultiplier);
        this.rays = this.#computeRays(rbushBranchs);
        this.photons = this.#createPhotons(this.rays);
    }

    getPhotons() {
        return this.photons;
    }

    #computeRays(rbushBranchs) {
        const rays = [];
        const stepLength = this.width / this.rayCount;
        const rayCount = Math.round(this.width / this.rayMargin);

        for (let i = 0; i < rayCount; i ++) {
            const distanceFromOrigin = (i - (rayCount / 2)) * this.rayMargin;
            const rayStart = this.direction.rotateDegrees(90).mulScalarSelf(distanceFromOrigin);
            rayStart.addSelf(this.position);

            let rayEnd = rayStart.add(this.direction.mulScalar(5000));
            rays.push(...this.#cutRayByBranchsMulti(rayStart, rayEnd, rbushBranchs));
            // rays.push(...this.#cutRayByBranchsSingle(rayStart, rayEnd, rbushBranchs));
        }

        return rays;
    }

    #cutRayByBranchsMulti(rayStart, rayEnd, rbushBranchs) {
        let currentEnd = rayEnd.clone();
        let currentLength = rayEnd.distanceFrom(rayStart);

        const intersectingBranchs = rbushBranchs.search({
            minX: Math.min(rayStart.x, rayEnd.x),
            minY: Math.min(rayStart.y, rayEnd.y),
            maxX: Math.max(rayStart.x, rayEnd.x),
            maxY: Math.max(rayStart.y, rayEnd.y),
        });

        const intersections = [{
            position: currentEnd,
            distance: currentLength,
            obstruction: 2,
        }];

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
            intersections.push({
                position: contactVector,
                distance: newLength,
                obstruction: branch.getLeavesObstruction(),
            });
        }

        let start = rayStart;
        let factor = 1;
        return intersections
        .sort((intA, intB) => Math.sign(intA.distance - intB.distance))
        .slice(0, 8)
        .map(int => {
            const ray = new Ray(start, int.position, factor);
            start = int.position;
            // factor *= 0.5;
            factor *= 1 / int.obstruction;
            return ray;
        });
    }

    #cutRayByBranchsSingle(rayStart, rayEnd, rbushBranchs) {
        let currentEnd = rayEnd.clone();
        let currentLength = rayEnd.distanceFrom(rayStart);

        const rayBbox = {
            minX: Math.min(rayStart.x, rayEnd.x),
            minY: Math.min(rayStart.y, rayEnd.y),
            maxX: Math.max(rayStart.x, rayEnd.x),
            maxY: Math.max(rayStart.y, rayEnd.y),
        };
        const intersectingBranchs = rbushBranchs.search(rayBbox);

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
        
        return [new Ray(rayStart, currentEnd, 1)];
    }

    #createPhotons(rays) {
        const photons = [];

        rays.forEach(ray => {
            const normalRay = ray.end.sub(ray.start).normalizeSelf()
            const stepDistance = 50 / ray.factor;
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
    constructor(start, end, factor) {
        this.start = start;
        this.end = end;
        this.factor = factor;
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