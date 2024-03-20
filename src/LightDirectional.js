import {segmentIntersection, randomize} from './Math.js'
import Render from './renderer/Render.js'

class Light {

    constructor(position, target) {
        this.position = position;
        this.target = target;
        this.direction = this.target.sub(this.position);
        this.length = this.direction.length();
        this.rayCount = 160;
        this.width = 80;
        this.angle = this.position.radiansTo(this.target);

        this.rays = [];
        this.photons = [];
    }

    emit(branchs) {
        this.rays = this.#computeRays(branchs);
        this.photons = this.#createPhotons(branchs);
    }

    getPhotons() {
        return this.photons;
    }

    #computeRays(branchs) {
        const rays = [];
        const stepLength = this.width / this.rayCount;

        for (let i = 0; i < this.rayCount; i ++) {
            const distanceFromOrigin = (i - (this.rayCount / 2)) * stepLength;
            const rayStart = this.direction.rotateRadians(Math.PI * 0.5).normalizeSelf().mulScalarSelf(this.width * distanceFromOrigin);
            rayStart.addSelf(this.position);

            let rayVector = rayStart.add(this.direction);

            rayVector = this.#cutRayByBranchs(rayStart, rayVector, branchs);

            const ray = new Ray(rayStart, rayVector);
            rays.push(ray);
        }

        return rays;
    }

    #cutRayByBranchs(rayStart, rayEnd, branchs) {
        let currentEnd = rayEnd.clone();
        let currentLength = rayEnd.distanceFrom(rayStart);

        for (let i = 0; i < branchs.length; i ++) {
            const branch = branchs[i];
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
        
        // Render.drawCircle(currentEnd, 20, 'rgb(255, 0, 0)')
        return currentEnd;
    }

    #createPhotons(branchs) {
        const photons = [];

        this.rays.forEach(ray => {
            const normalRay = ray.end.sub(ray.start)
            normalRay.normalizeSelf();
            const stepDistance = 50;
            const stepCount = ray.length / stepDistance;
            
            for (let i = 1; i <= stepCount; i ++) {
                const photoRay = normalRay.mulScalar(i * stepDistance);
                photoRay.addSelf(ray.start);

                const photonIsIntoBranchZone = this.#photonIsIntoBranchZone(photoRay, branchs);

                if (photonIsIntoBranchZone === true) {
                    continue;
                }

                photoRay.x = randomize(photoRay.x, stepDistance * 0.4);
                photoRay.y = randomize(photoRay.y, stepDistance * 0.4);

                const photon = new Photon(photoRay, this.direction.normalize());
                photons.push(photon);
            }
        });

        return photons;
    }

    #photonIsIntoBranchZone(position, branchs) {
        return false;
        for (let i = 0; i < branchs.length; i ++) {
            const branch = branchs[i];
            const distance = position.distanceFrom(branch.end);
            if (distance < branch.newBranchLength) {
            // if (distance < 150) {
                return true;
            }
        }

        return false;
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