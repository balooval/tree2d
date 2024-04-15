import * as GlMatrix from "../../vendor/gl-matrix/vec2.js";
import { radians, randomize, hslToRgb } from "../Math.js";
import * as Render3D from './Render3d.js';
import {
	Mesh,
    BufferGeometry,
    BufferAttribute,
    ShaderMaterial,
    MeshBasicMaterial,
    DoubleSide,
} from '../../vendor/three.module.js';
import VertexShader from '../shaders/TrunkVertex.js';
import FragmentShader from '../shaders/TrunkFragment.js';

const glOrigin = GlMatrix.fromValues(0, 0);

class TrunkRender3d {
    constructor(render, lightSource) {
        this.render = render;
        this.lightSource = lightSource;
        this.trunkPointA = GlMatrix.create();
        this.trunkPointB = GlMatrix.create();
        this.trunkPointC = GlMatrix.create();
        this.trunkPointD = GlMatrix.create();


        const uniforms = {
            trunkNoiseSmall: {type: 'float', value: 0.01},
            trunkNoiseMid: {type: 'float', value: 0.07},
            trunkNoiseBig: {type: 'float', value: 0.1},
        }

        this.material = new ShaderMaterial({
            uniforms: uniforms,
            fragmentShader: FragmentShader,
            vertexShader: VertexShader,
        })

        // this.material = new MeshBasicMaterial( {color: 0xffffff});
        this.meshes = new Map();
        this.vertices = [];
        this.vertexColors = [];
    }

    deleteTree(tree) {
        const treeMesh = this.meshes.get(tree);
        treeMesh.geometry.dispose();
        Render3D.scene.remove(treeMesh);
        this.meshes.delete(tree);
    }

    draw(tree) {
        // this.material.uniforms.trunkNoiseSmall.value = tree.preset.trunkNoiseSmall;
        // this.material.uniforms.trunkNoiseMid.value = tree.preset.trunkNoiseMid;
        // this.material.uniforms.trunkNoiseBig.value = tree.preset.trunkNoiseBig;


        if (this.meshes.has(tree) === false) {
            const treeMesh = new Mesh(new BufferGeometry(), this.material);
            Render3D.addToScene(treeMesh);
            this.meshes.set(tree, treeMesh);
        }

        const geometry = this.meshes.get(tree).geometry;

        this.vertices = [];
        this.vertexColors = [];
        this.vertexUvs = [];
        this.vertexNoiseUvs = [];

        tree.getBranchs().forEach(branch => {
            // this.#drawBranch(branch);
            this.#drawBranchRound(branch);
        });

        geometry.setAttribute('position', new BufferAttribute(new Float32Array(this.vertices), 3));
        geometry.setAttribute('color', new BufferAttribute(new Float32Array(this.vertexColors), 3));
        geometry.setAttribute('uvs', new BufferAttribute(new Float32Array(this.vertexUvs), 2));
        geometry.setAttribute('noiseuvs', new BufferAttribute(new Float32Array(this.vertexNoiseUvs), 2));

        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
    }

    #drawBranchRound(branch) {
        const widthScale = 1;
        const width = branch.getWidth() * widthScale;
        const parentWidth = branch.parent.getWidth() * widthScale;

        const steps = 8;
        const totalAngle = Math.PI;
        const angleStep = totalAngle / steps;
        const angleStart = 0 - (Math.PI / 1);

        const branchAngle = Math.atan2(branch.glDirection[0], branch.glDirection[1]);
        const branchparentAngle = Math.atan2(branch.parent.glDirection[0], branch.parent.glDirection[1]);

        for (let i = 0; i < steps; i ++) {
            let angle = 0;
            
            angle = (angleStep * (i + 0)) + angleStart;
            const bottomLeftPosX = branch.parent.glEnd[0] + Math.cos(angle) * Math.cos(branchparentAngle) * parentWidth;
            const bottomLeftPosY = branch.parent.glEnd[1] - Math.cos(angle) * Math.sin(branchparentAngle) * parentWidth;
            const bottomLeftPosZ = Math.sin(angle) * width;
            this.vertices.push(bottomLeftPosX, bottomLeftPosY, bottomLeftPosZ);

            angle = (angleStep * (i + 1)) + angleStart;
            const bottomRightPosX = branch.parent.glEnd[0] + Math.cos(angle) * Math.cos(branchparentAngle) * parentWidth;
            const bottomRightPosY = branch.parent.glEnd[1] - Math.cos(angle) * Math.sin(branchparentAngle) * parentWidth;
            const bottomRightPosZ = Math.sin(angle) * width;
            this.vertices.push(bottomRightPosX, bottomRightPosY, bottomRightPosZ);

            angle = (angleStep * (i + 0)) + angleStart;
            const topLeftPosX = branch.glEnd[0] +  Math.cos(angle) * Math.cos(branchAngle) * width;
            const topLeftPosY = branch.glEnd[1] - Math.cos(angle) * Math.sin(branchAngle) * width;
            const topLeftPosZ = Math.sin(angle) * width;
            this.vertices.push(topLeftPosX, topLeftPosY, topLeftPosZ);


            this.vertices.push(topLeftPosX, topLeftPosY, topLeftPosZ);
            this.vertices.push(bottomRightPosX, bottomRightPosY, bottomRightPosZ);

            angle = (angleStep * (i + 1)) + angleStart;
            const topRightPosX = branch.glEnd[0] +  Math.cos(angle) * Math.cos(branchAngle) * width;
            const topRightPosY = branch.glEnd[1] - Math.cos(angle) * Math.sin(branchAngle) * width;
            const topRightPosZ = Math.sin(angle) * width;
            this.vertices.push(topRightPosX, topRightPosY, topRightPosZ);

            this.vertexColors.push(
                0.5, 0.5, 0.5,
                0.5, 0.5, 0.5,
                0.5, 0.5, 0.5,
                0.5, 0.5, 0.5,
                0.5, 0.5, 0.5,
                0.5, 0.5, 0.5,
            );
    
            const noiseScale = 50;

            this.vertexUvs.push(
                (i + 0) * noiseScale, bottomLeftPosY,
                (i + 1) * noiseScale, bottomRightPosY,
                (i + 0) * noiseScale, topLeftPosY,
                (i + 0) * noiseScale, topLeftPosY,
                (i + 1) * noiseScale, bottomRightPosY,
                (i + 1) * noiseScale, topRightPosY,

                // 0, 0,
                // 1, 0,
                // 0, 1,
                // 0, 1,
                // 1, 0,
                // 1, 1,
            );

            this.vertexNoiseUvs.push(
                (i + 0) * noiseScale, bottomLeftPosY,
                (i + 1) * noiseScale, bottomRightPosY,
                (i + 0) * noiseScale, topLeftPosY,
                (i + 0) * noiseScale, topLeftPosY,
                (i + 1) * noiseScale, bottomRightPosY,
                (i + 1) * noiseScale, topRightPosY,

                // 0, 0,
                // 1, 0,
                // 0, 1,
                // 0, 1,
                // 1, 0,
                // 1, 1,
            );
        }
    }

    #drawBranch(branch) {
        const widthScale = 1;
        const width = branch.getWidth() * widthScale;
        const parentWidth = branch.parent.getWidth() * widthScale;

        this.#updateCornerPoint(this.trunkPointA, branch, width, 90);
        this.#updateCornerPoint(this.trunkPointB, branch, width, -90);
        this.#updateCornerPoint(this.trunkPointC, branch.parent, parentWidth, -90);
        this.#updateCornerPoint(this.trunkPointD, branch.parent, parentWidth, 90);

        this.vertices.push(
            this.trunkPointA[0], this.trunkPointA[1], 0,
            this.trunkPointC[0], this.trunkPointC[1], 0,
            this.trunkPointB[0], this.trunkPointB[1], 0,
            
            this.trunkPointC[0], this.trunkPointC[1], 0,
            this.trunkPointA[0], this.trunkPointA[1], 0,
            this.trunkPointD[0], this.trunkPointD[1], 0,
        );

        const branchRgb = hslToRgb(branch.trunkHSL.h / 360, branch.trunkHSL.s / 100, branch.trunkHSL.l / 100);
        const parentRgb = hslToRgb(branch.parent.trunkHSL.h / 360, branch.parent.trunkHSL.s / 100, branch.parent.trunkHSL.l / 100);
        this.vertexColors.push(
            branchRgb[0], branchRgb[1], branchRgb[2],
            branchRgb[0], branchRgb[1], branchRgb[2],
            parentRgb[0], parentRgb[1], parentRgb[2],
            parentRgb[0], parentRgb[1], parentRgb[2],
            parentRgb[0], parentRgb[1], parentRgb[2],
            branchRgb[0], branchRgb[1], branchRgb[2],
        );

        this.vertexUvs.push(
            0, 0,
            1, 1,
            1, 0,
            1, 1,
            0, 0,
            0, 1,
        );

        const xOffset = width * 20;
        this.vertexNoiseUvs.push(
            this.trunkPointA[0], this.trunkPointA[1],
            this.trunkPointA[0] + xOffset, this.trunkPointA[1],
            this.trunkPointD[0] + xOffset, this.trunkPointD[1],

            this.trunkPointD[0] + xOffset, this.trunkPointD[1],
            this.trunkPointD[0], this.trunkPointD[1],
            this.trunkPointA[0], this.trunkPointA[1],
        );
    }

    #updateCornerPoint(destPoint, branch, width, angle) {
        GlMatrix.rotate(
            destPoint,
            branch.glDirection,
            glOrigin,
            radians(angle)
        );
        GlMatrix.scale(
            destPoint,
            destPoint,
            width
        );
        GlMatrix.add(
            destPoint,
            branch.glEnd,
            destPoint
        );
    }
}

export {TrunkRender3d as default};