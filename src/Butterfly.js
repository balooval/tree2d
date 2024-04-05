import * as GlMatrix from "../vendor/gl-matrix/vec2.js";
import * as Render3D from './renderer/Render3d.js';
import { randomize } from './Math.js';
import {
	BoxGeometry,
	MeshBasicMaterial,
	Mesh,
    Object3D,
    DoubleSide,
    BufferGeometry,
    BufferAttribute,
} from '../vendor/three.module.js';

const gravity = GlMatrix.fromValues(0, -0.2);

export class Butterfly {
    constructor(posX, posY) {
        this.position = GlMatrix.fromValues(posX, posY);
        this.orientation = GlMatrix.fromValues(1, 0);
        const speed = 3;
        this.speed = GlMatrix.fromValues(speed, speed);
        this.translation = GlMatrix.create();
        this.destination = GlMatrix.create();
        this.age = 0;
        this.wingRotation = randomize(1, 0.3);
        this.wingFrequence = randomize(18, 2);

        const wingMaterial = new MeshBasicMaterial( {color: 0xffeedd, side: DoubleSide} ); 
        const bodyMaterial = new MeshBasicMaterial( {color: 0x909090, side: DoubleSide} ); 
        const size = 5;


        const wingGeometry = new BufferGeometry();
        const vertices = new Float32Array( [
            0, 0,  0,
            0, size * 3,  size * 1,
            0, size * 2,  size * -2,

            0, size * 3,  size * 1,
            0, size * 2,  size * -2,
            0, size * 3.5,  size * -1.5,
        ] );

        // itemSize = 3 because there are 3 values (components) per vertex
        wingGeometry.setAttribute('position', new BufferAttribute(vertices, 3));
        this.wingMesh = new Mesh(wingGeometry, wingMaterial);
        this.wingMeshR = new Mesh(wingGeometry, wingMaterial);


        const bodyGeometry = new BoxGeometry(size * 0.5, size * 0.5, size * 2); 
        const bodyMesh = new Mesh(bodyGeometry, bodyMaterial);
        bodyMesh.position.set(0, 0 - size * 0.2, size * -0.5);

        this.mesh = new Object3D();
        this.mesh.add(this.wingMesh);
        this.mesh.add(this.wingMeshR);
        this.mesh.add(bodyMesh);

        this.mesh.position.set(this.position[0], this.position[1], 0);
        Render3D.scene.add(this.mesh);

        this.getNewDestination();
    }

    update() {
        this.age ++;

        const currentDistance = this.getDistanceToDestination();

        if (this.age % this.wingFrequence === 0) {
            this.wingRotation *= -1;
        }

        if (this.age % 10 === 0) {
            this.updateDirectionToDestination();
        }

        if (currentDistance < 10) {
            this.getNewDestination();
        }

        GlMatrix.mul(this.translation, this.orientation, this.speed);
        GlMatrix.add(this.position, this.position, this.translation);
        this.mesh.position.set(this.position[0], this.position[1], 0);

        const finalWingRotation = this.wingRotation + (this.orientation[1] * 0.2);
        this.wingMesh.rotateZ(0.08 * finalWingRotation);
        this.wingMeshR.rotateZ(-0.1 * finalWingRotation);
    }

    getNewDestination() {
        GlMatrix.set(this.destination, randomize(0, 1000), randomize(400, 200));
        this.updateDirectionToDestination();
    }
    
    updateDirectionToDestination() {
        GlMatrix.sub(this.orientation, this.destination, this.position);
        GlMatrix.normalize(this.orientation, this.orientation);
        GlMatrix.add(this.orientation, this.orientation, gravity);

        this.mesh.lookAt(this.destination[0], this.destination[1], 0);

        const speed = randomize(1.8, 0.6);
        GlMatrix.set(this.speed, speed, speed);
    }

    getDistanceToDestination() {
        return GlMatrix.dist(this.destination, this.position);
    }
}


class Debug {
    constructor(posX, posY) {
        this.position = GlMatrix.fromValues(posX, posY);
        const size = 50;
        const geometry = new BoxGeometry(size, size, size); 
        const material = new MeshBasicMaterial( {color: 0x0000aa} ); 
        this.mesh = new Mesh(geometry, material);
        this.mesh.position.set(this.position[0], this.position[1], 0);
        Render3D.scene.add(this.mesh);
    }

    updatePosition(posX, posY) {
        this.mesh.position.set(posX, posY, 0);
    }
}