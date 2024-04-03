import * as GlMatrix from "../../vendor/gl-matrix/vec2.js";
import { random, randomizeListValues } from "../Math.js";
import { glWorldToCanvasPosition } from "./BaseRender.js";

const glOrigin = GlMatrix.fromValues(0, 0);
const glGround = GlMatrix.fromValues(1, 0);

export const leavesPresets = {
    standard: {
        baseLife: 100,
        translationSpeed: 4,
        heliotropism: [0, -1],
    },
    spike: {
        baseLife: 400,
        translationSpeed: 2,
        heliotropism: [0, 0],
    },
};

export class LeafDrawer {
    constructor(render, lightSource, treeLayer) {
        this.render = render;
        this.treeLayer = treeLayer;
        this.particlesCount = 72;
        this.particlesToDraw = this.particlesCount;
        this.particles = [];
        this.formRatio = 0;
        this.heliotropism = GlMatrix.create();
        this.lightSource = lightSource;
        this.hue = 80;
        this.tree = null;
        this.shadowOffset = 0;
        this.growIsRunning = false;
        this.shadowGlPosition = GlMatrix.create();
        this.particleGlTranslation = GlMatrix.create();
        this.particleGlOrientation = GlMatrix.create();

        this.preset = leavesPresets.standard;

        this.maxWhileLoop = 999999;

        this.leafPointA = GlMatrix.create();
        this.leafPointB = GlMatrix.create();
        this.leafPointC = GlMatrix.create();
        this.leafPointD = GlMatrix.create();

        for (let i = 0; i < this.particlesCount; i ++) {
            this.particles.push({
                glPosition: GlMatrix.fromValues(0, 0),
                orientation: GlMatrix.fromValues(0, 1),
                size: 1,
                life: 1,
                shadeValue: 0,
                shadeGradient: GlMatrix.fromValues(0, 1),
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

    draw(tree, position, size, lightQuantity, formRatio, heliotropism) {
        this.tree = tree;
        this.formRatio = formRatio;
        this.heliotropism = heliotropism;
        
        const angle = Math.atan2(this.lightSource.glDirection[0], this.lightSource.glDirection[1]) * -1;
        this.shadowOffset = Math.tan(angle);

        this.#setupParticles(position, Math.min(4, size), lightQuantity);

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

    #setupParticles(position, size, lightQuantity) {
        const shadeValue = Math.round(lightQuantity * 10);

        // const baseLife = 100;
        const baseLife = this.preset.baseLife;

        for (let i = 0; i < this.particlesToDraw; i ++) {
            GlMatrix.rotate(this.particleGlOrientation, glGround, glOrigin, i * 5);

            const shadeGradient = GlMatrix.dot(this.lightSource.glDirection, this.particleGlOrientation) * -1;

            GlMatrix.copy(this.particles[i].glPosition, position);
            GlMatrix.add(this.particles[i].orientation, this.particleGlOrientation, this.heliotropism);
            this.particles[i].size = (8 * size) + Math.random() * 1;
            this.particles[i].life = (baseLife * size) + Math.random() * (baseLife / 2);
            this.particles[i].shadeValue = shadeValue;
            this.particles[i].shadeGradient = shadeGradient;
        }
    }

    #drawStep() {
        for (let i = 0; i < this.particlesToDraw; i++) {
            if (Math.random() < 0.8) {
                continue;
            }
            const particle = this.particles[i];
            if (particle.life <= 0) {
                continue;
            }

            const color = `hsl(${this.hue}, 65%, ${particle.shadeValue}%)`; // H : 80 => 120
            // this.render.glDrawCircle(particle.glPosition, particle.size, color);
            const widthFactor = 0.5;
            const baseFactor = particle.size * 0.4;
            const randomVariation = particle.size * 0.2;

            GlMatrix.set(this.leafPointA, particle.glPosition[0] + particle.size * widthFactor, particle.glPosition[1] + baseFactor);
            GlMatrix.set(this.leafPointB, particle.glPosition[0], particle.glPosition[1] + particle.size);
            GlMatrix.set(this.leafPointC, particle.glPosition[0] - particle.size * widthFactor, particle.glPosition[1] + baseFactor);
            GlMatrix.set(this.leafPointD, particle.glPosition[0], particle.glPosition[1] - particle.size);


            const glPoints = [
                randomizeListValues(this.leafPointA, randomVariation),
                randomizeListValues(this.leafPointB, randomVariation),
                randomizeListValues(this.leafPointC, randomVariation),
                randomizeListValues(this.leafPointD, randomVariation),
            ];
            
            this.render.glDrawPolygon(glPoints, color);



            this.#dropShadow(particle);
        }
    }

    #dropShadow(particle) {
        if (Math.random() < 0.8) {
            return;
        }
        GlMatrix.set(
            this.shadowGlPosition,
            particle.glPosition[0] + (this.shadowOffset * particle.glPosition[1]),
            this.tree.position[1]
        );

        const distanceFromGround = GlMatrix.dist(this.shadowGlPosition, particle.glPosition) * 0.1;
        const color = `rgba(52, 54, 61, ${Math.max(0.005, 0.1 / distanceFromGround)})`;
        this.render.glDrawCircle(this.shadowGlPosition, particle.size * (distanceFromGround * 0.01), color); // 
        
        this.treeLayer.context.globalCompositeOperation = 'source-atop';
        const gradient = this.treeLayer.context.createLinearGradient(
            ...glWorldToCanvasPosition(particle.glPosition),
            ...glWorldToCanvasPosition(this.shadowGlPosition),
        );
        gradient.addColorStop(0, 'rgba(0, 30, 50, 0.09)');
        gradient.addColorStop(0.8, 'rgba(0, 30, 50, 0)');
        this.treeLayer.glDrawLine(particle.glPosition, this.shadowGlPosition, particle.size * 0.1, gradient);

        this.treeLayer.context.globalCompositeOperation = 'source-over';
    }

    #grow() {
        this.growIsRunning = false;
        const delta = 16;
        const translationSpeed = this.preset.translationSpeed;
        const translationVariation = translationSpeed / 2;

        for (let i = 0; i < this.particlesToDraw; i++) {
            const p = this.particles[i];
            if (p.life <= 0) {
                continue;
            }
            const translationX = p.orientation[0] * (translationSpeed + this.formRatio) + random(translationVariation * -1, translationVariation);
            const translationY = p.orientation[1] * (translationSpeed - this.formRatio) + random(translationVariation * -1, translationVariation);
            GlMatrix.set(this.particleGlTranslation, translationX, translationY)
            GlMatrix.add(p.glPosition, p.glPosition, this.particleGlTranslation);
            p.life -= delta;
            p.size -= delta / 35;
            p.shadeValue = Math.min(90, Math.max(13, p.shadeValue + p.shadeGradient));
            
            if (p.size <= 0) {
                p.life = 0;
            }
            
            if (p.life <= 0) {
                continue;
            }
            this.growIsRunning = true;
        }
    }
}