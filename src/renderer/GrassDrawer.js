import * as GlMatrix from "../../vendor/gl-matrix/vec2.js";
import { random, randomize, randomElement } from "../Math.js";
import { glWorldToCanvasPosition } from "./BaseRender.js";

const glOrigin = GlMatrix.fromValues(0, 0);
const glGround = GlMatrix.fromValues(1, 0);

const grassPresets = {
    standard: {
        baseLife: 50,
        translationSpeed: 3,
    },
    spike: {
        baseLife: 400,
        translationSpeed: 2,
    },
};

export class GrassDrawer {
    constructor(render, lightSource, treeLayer) {
        this.delta = 16;
        this.delta = 100;
        this.render = render;
        this.treeLayer = treeLayer;
        this.particlesCount = 72;
        this.particlesToDraw = this.particlesCount;
        this.particles = [];
        this.lightSource = lightSource;
        this.hue = 80;
        this.tree = null;
        this.shadowOffset = 0;
        this.growIsRunning = false;
        this.shadowGlPosition = GlMatrix.create();
        this.particleGlTranslation = GlMatrix.create();
        this.particleGlOrientation = GlMatrix.create();

        this.preset = grassPresets.standard;

        this.maxWhileLoop = 999999;

        this.heliotropism = GlMatrix.fromValues(0, -0.7);

        this.leafPointA = GlMatrix.create();
        this.leafPointB = GlMatrix.create();
        this.leafPointC = GlMatrix.create();
        this.leafPointD = GlMatrix.create();
        this.leafPointE = GlMatrix.create();

        for (let i = 0; i < this.particlesCount; i ++) {
            this.particles.push({
                glPosition: GlMatrix.fromValues(0, 0),
                orientation: GlMatrix.fromValues(0, 1),
                size: 1,
                life: 1,
                angle: 0,
                shadeValue: 0,
            });
        }
    }

    setPreset(preset) {
        this.preset = preset;
    }

    setFullQuality() {
        this.particlesToDraw = this.particlesCount;
        this.maxWhileLoop = 999999;
    }

    setLowQuality() {
        this.particlesToDraw = 4;
        this.maxWhileLoop = 10;
    }

    setColor(hue) {
        this.hue = hue;
    }

    draw(tree) {
        this.tree = tree;

        this.delta = Math.max(10, this.delta - 0.2);
        
        const lightAngle = Math.atan2(this.lightSource.glDirection[0], this.lightSource.glDirection[1]) * -1;
        this.shadowOffset = Math.tan(lightAngle);

        const size = 5;
        
        this.#setupParticles(this.tree.position, size);

        this.growIsRunning = true;
        let loopCounter = 0;

        while (this.growIsRunning === true) {
            this.#grow();
            this.#drawStep();

            loopCounter ++;
            if (loopCounter > this.maxWhileLoop) {
                this.growIsRunning = false;
            }
        }
    }

    #setupParticles(position, size) {
        // const baseLife = this.preset.baseLife;
        const baseLife = 200;

        const angles = [
            [1, 0],
            [-1, 0],
        ];

        const shadeVariations = [5, 20, 30];

        for (let i = 0; i < this.particlesToDraw; i ++) {
            const angle = randomElement(angles);
            const particleLife = (baseLife * size) + Math.random() * (baseLife / 2);

            GlMatrix.copy(this.particles[i].glPosition, position);
            GlMatrix.set(this.particles[i].orientation, angle[0], angle[1]);
            this.particles[i].size = 5 + Math.expm1(Math.random() * 3);
            this.particles[i].life = particleLife;
            this.particles[i].shadeValue = 20 + randomElement(shadeVariations);
        }

        // console.log('this.particles', this.particles);
    }

    #drawStep() {

        for (let i = 0; i < this.particlesToDraw; i++) {
            if (Math.random() < 0.7) {
                continue;
            }
            const particle = this.particles[i];
            if (particle.life <= 0) {
                continue;
            }

            const color = `hsl(${this.hue}, 45%, ${particle.shadeValue}%)`; // H : 80 => 120
            
            const width = particle.size * 0.3;

            GlMatrix.set(this.leafPointA, particle.glPosition[0] + width, particle.glPosition[1]);
            GlMatrix.set(this.leafPointB, particle.glPosition[0] - width, particle.glPosition[1]);
            GlMatrix.set(this.leafPointC, particle.glPosition[0] - width, particle.glPosition[1] + particle.size);
            GlMatrix.set(this.leafPointD, particle.glPosition[0], particle.glPosition[1] + particle.size * 3);
            GlMatrix.set(this.leafPointE, particle.glPosition[0] + width, particle.glPosition[1] + particle.size);

            const treeDistance = this.tree.position[0] - this.leafPointA[0];
            let angle = treeDistance * 0.005;
            angle = randomize(angle, angle * 0.5);
            // angle *= (particle.size * 0.05);

            GlMatrix.rotate(this.leafPointB, this.leafPointB, particle.glPosition, angle);
            GlMatrix.rotate(this.leafPointC, this.leafPointC, particle.glPosition, angle);
            GlMatrix.rotate(this.leafPointD, this.leafPointD, particle.glPosition, angle * 2);
            GlMatrix.rotate(this.leafPointE, this.leafPointE, particle.glPosition, angle);


            const glPoints = [
                this.leafPointA,
                this.leafPointB,
                this.leafPointC,
                this.leafPointD,
                this.leafPointE,
                // randomizeListValues(this.leafPointD, randomVariation),
            ];


            const gradient = this.render.context.createLinearGradient(
                ...glWorldToCanvasPosition(this.leafPointD),
                ...glWorldToCanvasPosition(this.leafPointA),
            );


            const shadeValue = randomElement([25, 40, 50]) * 1
            gradient.addColorStop(0.2, `hsl(${this.hue}, 65%, ${shadeValue}%)`);
            gradient.addColorStop(0.9, `hsl(${this.hue}, 65%, ${shadeValue * 0.3}%)`);
            
            this.render.glDrawPolygon(glPoints, gradient);
        }

    }

    #grow() {
        this.growIsRunning = false;
        const translationSpeed = this.preset.translationSpeed;
        const translationVariation = translationSpeed / 2;
        
        for (let i = 0; i < this.particlesToDraw; i++) {
            const p = this.particles[i];
            if (p.life <= 0) {
                continue;
            }
            const translationX = p.orientation[0] * (translationSpeed) + random(translationVariation * -1, translationVariation);
            const translationY = p.orientation[1] * (translationSpeed);
            GlMatrix.set(this.particleGlTranslation, translationX, translationY)
            GlMatrix.add(p.glPosition, p.glPosition, this.particleGlTranslation);
            p.life -= this.delta;
            p.size -= this.delta / 200;
            
            if (p.size <= 8) {
                p.life = 0;
            }
            
            if (p.life <= 0) {
                continue;
            }
            this.growIsRunning = true;
        }
    }
}