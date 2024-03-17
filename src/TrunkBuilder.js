import * as MATH from "./Math.js";
import * as THREE from './../vendor/three.module.js';


class TrunkBuilder {

    constructor(preset) {
        this.preset = preset;
        this.datas = {};
        this.initDatas();
    }

    buildGeometry(trunk, percent) {
        this.percent = percent;
        let geometry = new THREE.BufferGeometry();

        this.initDatas();

        const finalBranches = trunk.getFinalBranchs();
        this.maxBranchTime = finalBranches.reduce((time, branch) => Math.max(branch.time, time), 0);
        this.maxBranchTime *= this.percent;

        const root = trunk.branchs[0];

        this.buildBranchGeometry(root, 0, 0, 0);
    
        const vertices = new Float32Array(this.datas.verticesPositions);
        const uvs = new Float32Array(this.datas.uvValues);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geometry.setIndex(this.datas.facesIndices);
        geometry.computeVertexNormals();
    
        return geometry;
    }
    
    buildBranchGeometry(branch, bottomFacesIndex, uvVert, prevIndex) {
        const quaternionTop = new THREE.Quaternion();

        const averageDirection = branch.direction.clone();
        if (branch.parent !== null) {
            averageDirection.add(branch.parent.direction);
        }
        averageDirection.normalize();


        quaternionTop.setFromUnitVectors(new THREE.Vector3(0, 1, 0), averageDirection);
    
        // let radius = Math.min(Math.max(branch.radius * 0.1, 0.1), 10) * this.preset.branchWidth;
        // let radius = Math.max(Math.tanh(branch.radius * 0.0001) * this.preset.branchWidth, 0.4);
        let radius = Math.max(Math.tanh(branch.childsNb * 0.001) * this.preset.branchWidth, 0.4);
        radius *= this.percent;
        const facesByBranch = 32;
        const angleStep = (Math.PI * 2) / facesByBranch;
        const uvStep = 2 / facesByBranch;
        
        let deepFactor = 1;
        if (prevIndex % 2 === 0) {
            deepFactor = -1;
        }
        const maxDeep = radius * (this.preset.barkRoughness * 0.1) * deepFactor;

        for (let i = 0; i < facesByBranch; i ++) {
            const angle = angleStep * i;

            const deep = Math.cos(angle * 8) * maxDeep;
            const localRadius = radius + deep;
            
            let offsetX = Math.cos(angle);
            let offsetZ = Math.sin(angle);
            offsetX *= localRadius;
            offsetZ *= localRadius;
            
            let vertice = new THREE.Vector3(offsetX, 0, offsetZ);
            vertice.applyQuaternion(quaternionTop);
            vertice.add(branch.end);
    
            this.datas.verticesPositions.push(
                vertice.x, vertice.y, vertice.z
            );
    
            this.datas.uvValues.push(1 - uvStep * i, uvVert);
        }
    
        let myTopFacesIndex = this.datas.faceIndex;
    
        if (branch.parent) {
            myTopFacesIndex += facesByBranch;
    
            const bottomIndices = [];
            const topIndices = [];
            for (let i = 0; i < facesByBranch; i ++) {
                bottomIndices.push(bottomFacesIndex + i);
                topIndices.push(myTopFacesIndex + i);
            }
            bottomIndices.push(bottomFacesIndex);
            topIndices.push(myTopFacesIndex);
    
            for (let i = 0; i < facesByBranch; i ++) {
                this.datas.facesIndices.push(
                    bottomIndices[i],
                    topIndices[i],
                    bottomIndices[i + 1],
                    
                    topIndices[i + 1],
                    bottomIndices[i + 1],
                    topIndices[i],
                );
            }
            this.datas.faceIndex += facesByBranch;
        }
    
        const myUvVert = uvVert + 0.2;
        const myIndex = prevIndex + 1;
        
    
        if (this.maxBranchTime > branch.time) {
            for (let c = 0; c < branch.childs.length; c ++) {
                this.buildBranchGeometry(branch.childs[c], myTopFacesIndex, myUvVert, myIndex);
            }
        }
    }

    initDatas() {
        this.datas = {
            faceIndex : 0,
            verticesPositions : [],
            facesIndices : [],
            uvValues : [],
        };
    }
}

export default TrunkBuilder;