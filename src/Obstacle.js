import * as MATH from "./Math.js";
import * as THREE from './../vendor/three.module.js';
import Render3d from "./Render3d.js";


class Obstacle {

    constructor(position, width, deep, height) {
        this.position = position;
        this.width = width;
        this.deep = deep;
        this.height = height;

        const geometry = new THREE.BoxGeometry(width, height, deep);
        const material = new THREE.MeshStandardMaterial({color: 0x00ff00, transparent:true, opacity:0.5});
        const cube = new THREE.Mesh(geometry, material);
        cube.position.x = position.x;
        cube.position.y = position.y + height / 2;
        cube.position.z = position.z;
        Render3d.add(cube);
    }

    isInto(position) {
        if (position.x < this.position.x - (this.width / 2)) return false;
        if (position.x > this.position.x + (this.width / 2)) return false;
        if (position.z < this.position.z - (this.deep / 2)) return false;
        if (position.z > this.position.z + (this.deep / 2)) return false;
        if (position.y < this.position.y) return false;
        if (position.y > this.position.y + this.height) return false;
        return true;
    }
}

export default Obstacle;