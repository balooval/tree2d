import {segmentIntersection, randomize, radians} from './Math.js'
import * as GlMatrix from "../vendor/gl-matrix/vec2.js";


class Light {

    constructor(positionX, positionY, targetX, targetY) {
        this.width = 2000;
        this.rayMargin = 50;
        
        this.glPosition = GlMatrix.fromValues(positionX, positionY);
        this.glTarget = GlMatrix.fromValues(targetX, targetY);
        this.length = GlMatrix.dist(this.glPosition, this.glTarget);
        this.glDirection = GlMatrix.create();
        GlMatrix.sub(this.glDirection, this.glTarget, this.glPosition);
        GlMatrix.normalize(this.glDirection, this.glDirection);
        
        this.glRayStart = GlMatrix.create();
        this.glRayEnd = GlMatrix.create();
        
        this.rays = [];
        this.photons = [];
    }

    reset(positionX, positionY) {
        GlMatrix.set(this.glPosition, positionX, positionY);
        this.length = GlMatrix.dist(this.glPosition, this.glTarget);
        GlMatrix.sub(this.glDirection, this.glTarget, this.glPosition);
        GlMatrix.normalize(this.glDirection, this.glDirection);
        
        freeRays(this.rays);
        freePhotons(this.photons);
        this.rays = [];
        this.photons = [];
    }

    emit(rbushBranchs) {
        const treesWidth = (rbushBranchs.data.maxX - rbushBranchs.data.minX) + 500;
        const treesHeight = (rbushBranchs.data.maxY - rbushBranchs.data.minY) * 2;
        this.width = Math.max(treesWidth, treesHeight + 300) * 1;
        this.rays = this.#computeRays(rbushBranchs);
        this.photons = this.#createPhotons(this.rays);
    }

    getPhotons() {
        return this.photons;
    }

    #computeRays(rbushBranchs) {
        const rays = [];
        const rayCount = Math.round(this.width / this.rayMargin);

        for (let i = 0; i < rayCount; i ++) {
            const distanceFromOrigin = (i - (rayCount / 2)) * this.rayMargin;
            
            GlMatrix.rotate(
                this.glRayStart,
                this.glDirection,
                GlMatrix.fromValues(0, 0),
                radians(90)
            );
            GlMatrix.scale(this.glRayStart, this.glRayStart, distanceFromOrigin);
            GlMatrix.add(this.glRayStart, this.glRayStart, this.glPosition);

            GlMatrix.scale(this.glRayEnd, this.glDirection, 5000);
            GlMatrix.add(this.glRayEnd, this.glRayEnd, this.glRayStart);

            const spliRays = this.#cutRayByBranchsMulti(this.glRayStart, this.glRayEnd, rbushBranchs);
            rays.push(...spliRays);
        }

        return rays;
    }

    #cutRayByBranchsMulti(glRayStart, glRayEnd, rbushBranchs) {
        let currentLength = GlMatrix.dist(glRayEnd, glRayStart);

        const intersectingBranchs = rbushBranchs.search({
            minX: Math.min(glRayStart[0], glRayEnd[0]),
            minY: Math.min(glRayStart[1], glRayEnd[1]),
            maxX: Math.max(glRayStart[0], glRayEnd[0]),
            maxY: Math.max(glRayStart[1], glRayEnd[1]),
        });

        const intersections = [{
            position: glRayEnd,
            distance: currentLength,
            obstruction: 2,
        }];

        for (let i = 0; i < intersectingBranchs.length; i ++) {
            const branch = intersectingBranchs[i].branch;
            const contact = segmentIntersection(
                glRayStart[0], glRayStart[1],
                glRayEnd[0], glRayEnd[1],
                branch.glStart[0], branch.glStart[1],
                branch.glEnd[0], branch.glEnd[1],
            );
            if (contact === null) {
                continue;
            }
            const contactVector = GlMatrix.fromValues(contact[0], contact[1]);
            const newLength = GlMatrix.dist(contactVector, glRayStart);
            intersections.push({
                position: contactVector,
                distance: newLength,
                obstruction: branch.getLeavesObstruction(),
            });
        }

        const start = glRayStart;
        let factor = 1;
        return intersections
        .sort((intA, intB) => Math.sign(intA.distance - intB.distance))
        .slice(0, 8)
        .map(int => {
            const ray = getRay();
            ray.reset(start, int.position, factor)
            GlMatrix.copy(start, int.position);
            factor *= 1 / int.obstruction;
            return ray;
        });
    }

    #createPhotons(rays) {
        const photons = [];

        rays.forEach(ray => {
            const stepDistance = 50 / ray.factor;
            const stepCount = ray.length / stepDistance;
            
            for (let i = 1; i <= stepCount; i ++) {
                const photon = getPhoton();

                GlMatrix.scale(photon.glPosition, ray.direction, i * stepDistance);
                GlMatrix.add(photon.glPosition, photon.glPosition, ray.glStart);

                GlMatrix.set(
                    photon.glPosition,
                    randomize(photon.glPosition[0], stepDistance * 0.4),
                    randomize(photon.glPosition[1], stepDistance * 0.4)
                );

                GlMatrix.copy(
                    photon.glOrientation,
                    this.glDirection,
                );

                photons.push(photon);
            }
        });

        return photons;
    }
}

class Ray {
    constructor() {
        this.factor = 1;
        this.glStart = GlMatrix.create();
        this.glEnd = GlMatrix.create();
        this.direction = GlMatrix.create();
        this.length = 1;
    }

    reset(glStart, glEnd, factor) {
        this.factor = factor;
        GlMatrix.copy(this.glStart, glStart);
        GlMatrix.copy(this.glEnd, glEnd);
        this.length = GlMatrix.distance(this.glEnd, this.glStart);
        GlMatrix.normalize(this.direction, GlMatrix.sub(this.direction, this.glEnd, this.glStart));
    }
}

class Photon {
    constructor() {
        this.glPosition = GlMatrix.create();
        this.glOrientation = GlMatrix.create();
    }
}



const poolRays = [];

function getRay() {
    let ray = poolRays.pop();

    if (ray !== undefined) {
        return ray;
    }

    return new Ray();
}

function freeRays(rays) {
    poolRays.push(...rays);
}



const poolPhotons = [];

function getPhoton() {
    let photon = poolPhotons.pop();

    if (photon !== undefined) {
        return photon;
    }

    return new Photon();
}

function freePhotons(photons) {
    poolPhotons.push(...photons);
}


export default Light;