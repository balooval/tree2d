import * as MATH from "./Math.js";
import * as THREE from './../vendor/three.module.js';
import * as BufferGeometryUtils from './../vendor/BufferGeometryUtils.module.js';


class LeavesBuilder {

    constructor(preset) {
        this.preset = preset;
        this.totalAngle = 360;
        this.angleStep = 1;
        this.leafGeometry = this.buildLeafGeometry();
    }

    buildGeometry(trunk) {
        this.angleStep = MATH.radians(this.totalAngle / Math.floor(this.preset.branchLeaveCount));
        const geometries = [];
        trunk.getFinalBranchs().forEach(branch => {
            for (let i = 0; i < this.preset.branchLeaveCount; i ++) {
                geometries.push(this.getLeafGeometry(branch, i));
            }
        });

        if (geometries.length === 0) {
            return null;
        }
        
        const geometry = BufferGeometryUtils.BufferGeometryUtils.mergeBufferGeometries(geometries);
        geometry.computeVertexNormals();
        return geometry;
    }

    getLeafGeometry(branch, index) {
        const percent = (index / this.preset.branchLeaveCount);
        const leafBranch = this.getStartingBranche(branch, 1 - percent);
        const geometry = this.leafGeometry.clone();
        const scale = (1 - (percent * 0.5)) * this.preset.branchLeaveScale;
        geometry.scale(scale, scale, scale);
    
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), leafBranch.direction);
        
        let angle;
        angle = (1 - percent) * 1.5;
        angle = (Math.random() * 2) - 1;
        geometry.rotateY(angle);
        angle = this.angleStep * index;
        geometry.rotateZ(angle);
        angle = (Math.random() * 2) - 1;
        geometry.rotateX(angle);
        geometry.applyQuaternion(quaternion);

        const posX = MATH.lerpFloat(leafBranch.start.x, leafBranch.end.x, percent);
        const posY = MATH.lerpFloat(leafBranch.start.y, leafBranch.end.y, percent);
        const posZ = MATH.lerpFloat(leafBranch.start.z, leafBranch.end.z, percent);
        geometry.translate(posX, posY, posZ);
    
        return geometry;
    }

    getStartingBranche(branch, percent) {
        let startingBranch = branch;
        const branchsToReverseCount = Math.round(percent * this.preset.branchLeaveCount / 8);
        for (let i = 0; i < branchsToReverseCount; i ++) {
            if (startingBranch.parent === null) {
                break;
            }
            startingBranch = startingBranch.parent;
        }
        return startingBranch;
    }

    buildLeafGeometry() {
        let geometry = new THREE.BufferGeometry();
    
        const size = 20;
    
        const verticesPositions = [];
        const facesIndices = [];
        const uvValues = [];
        
        verticesPositions.push(- size / 2, 0, 0);
        verticesPositions.push(size / 2, 0, 0);
        verticesPositions.push(size / 2, size, 0);
        verticesPositions.push(- size / 2, size, 0);
        
        uvValues.push(0, 0);
        uvValues.push(1, 0);
        uvValues.push(1, 1);
        uvValues.push(0, 1);
    
        facesIndices.push(0, 2, 1);
        facesIndices.push(3, 2, 0);
    
        const vertices = new Float32Array(verticesPositions);
        const uvs = new Float32Array(uvValues);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geometry.setIndex(facesIndices);
        geometry.computeVertexNormals();
    
        return geometry;
    }
}

export default LeavesBuilder;