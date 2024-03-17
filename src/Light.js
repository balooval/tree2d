import {segmentIntersection} from './Math.js'
import Render from './renderer/Render.js'

class Light {

    constructor(position, target) {
        this.position = position;
        this.target = target;
        this.direction = this.target.sub(this.position);
        this.length = this.direction.length();
        this.emitAngle = 3;
        this.rayCount = 30;
        this.angle = this.position.radiansTo(this.target);

        this.rays = [];
        this.photons = [];
    }

    emit(branchs) {
        this.rays = this.#computeRays(branchs);
        this.photons = this.#createPhotons();
    }

    getPhotons() {
        return this.photons;
    }

    #computeRays(branchs) {
        const rays = [];
        const startAngle = 0 - (this.emitAngle * 0.5);
        const endAngle = 0 + (this.emitAngle * 0.5);
        const step = (endAngle - startAngle) / this.rayCount;

        for (let angle = startAngle; angle < endAngle; angle += step) {
            let rayVector = this.direction.rotateRadians(angle);
            rayVector.addSelf(this.position);

            rayVector = this.#cutRayByBranchs(this.position, rayVector, branchs);

            const ray = new Ray(this.position, rayVector);
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
        
        Render.drawCircle(currentEnd, 20, 'rgb(255, 0, 0)')
        return currentEnd;
    }

    #createPhotons() {
        const photons = [];

        this.rays.forEach(ray => {
            const normalRay = ray.end.sub(ray.start)
            normalRay.normalizeSelf();
            const stepDistance = 100;
            const stepCount = ray.length / stepDistance;
            
            for (let i = 1; i <= stepCount; i ++) {
                const photoRay = normalRay.mulScalar(i * stepDistance);
                photoRay.addSelf(this.position);
                const photon = new Photon(photoRay);
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
    constructor(position) {
        this.position = position;
    }
}

export default Light;