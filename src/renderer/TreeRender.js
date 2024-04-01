import { degrees, random, radians } from "../Math.js";
import * as GlMatrix from "../../vendor/gl-matrix/vec2.js";

const glOrigin = GlMatrix.fromValues(0, 0);
const glGround = GlMatrix.fromValues(1, 0);

const leavesPresets = {
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


class TreeRender {
    constructor(render, lightSource) {
        this.render = render;
        this.lightSource = lightSource;
        this.viewLeaves = true;
        this.leafDrawer = new Leaf(this.render, this.lightSource);

        this.trunkPointA = GlMatrix.create();
        this.trunkPointB = GlMatrix.create();
        this.trunkPointC = GlMatrix.create();
        this.trunkPointD = GlMatrix.create();
    }

    setViewLeaves(state) {
        this.viewLeaves = state;
    }

    draw(tree) {
        this.leafDrawer.setLowQuality();
        tree.getBranchs().forEach(branch => {
            this.#drawBranch(branch);
            this.#drawLeaves(tree, branch);
        });

    }

    drawHighQualityLeaves(tree) {
        this.leafDrawer.setFullQuality();
        tree.getBranchs().forEach(branch => {
            this.#drawLeaves(tree, branch);
        });
    }

    #drawBranch(branch) {
        // this.render.glDrawLine(branch.glStart, branch.glEnd, branch.getWidth(), branch.trunkColor);
        // this.render.glDrawLine(branch.glStart, branch.glEnd, branch.getWidth(), `rgb(0, ${branch.energy > 0 ? 255 : 0}, 0)`);
        // this.render.glDrawLine(branch.glStart, branch.glEnd, 10, `rgb(150, ${(branch.energy / branch.energyNeededToGrow) * 255}, 150)`);
        // this.render.glDrawLine(branch.glStart, branch.glEnd, branch.getWidth(), `rgb(0, ${branch.auxinQuantity * 25}, 0)`);
        // this.render.glDrawLine(branch.glStart, branch.glEnd, branch.getWidth(), `rgb(0, ${branch.energyTransferedByCycle * 10}, 0)`);
        // this.render.glDrawLine(branch.glStart, branch.glEnd, 10, `rgb(0, ${(branch.length / branch.preset.newBranchLength) * 50}, 0)`);
        // this.render.glDrawLine(branch.glStart, branch.glEnd, branch.getWidth(), `rgb(0, 0, 0)`);
        // this.render.glDrawLine(branch.glStart, branch.glEnd, 10, `rgb(0, ${branch.mainStrenght * 250}, 0)`);
        // return;

        const width = branch.getWidth();
        const parentWidth = branch.parent.getWidth();

        GlMatrix.add(
            this.trunkPointA,
            branch.glEnd,
            GlMatrix.scale(
                this.trunkPointA,
                GlMatrix.rotate(
                    this.trunkPointA,
                    branch.glDirection,
                    glOrigin,
                    radians(90)
                ),
                width
            )
        );

        GlMatrix.add(
            this.trunkPointB,
            branch.glEnd,
            GlMatrix.scale(
                this.trunkPointB,
                GlMatrix.rotate(
                    this.trunkPointB,
                    branch.glDirection,
                    glOrigin,
                    radians(-90)
                ),
                width
            )
        );

        GlMatrix.add(
            this.trunkPointC,
            branch.parent.glEnd,
            GlMatrix.scale(
                this.trunkPointC,
                GlMatrix.rotate(
                    this.trunkPointC,
                    branch.parent.glDirection,
                    glOrigin,
                    radians(-90)
                ),
                parentWidth
            )
        );

        GlMatrix.add(
            this.trunkPointD,
            branch.parent.glEnd,
            GlMatrix.scale(
                this.trunkPointD,
                GlMatrix.rotate(
                    this.trunkPointD,
                    branch.parent.glDirection,
                    glOrigin,
                    radians(90)
                ),
                parentWidth
            )
        );

        const glPoints = [
            this.trunkPointA,
            this.trunkPointB,
            this.trunkPointC,
            this.trunkPointD,
        ];
        
        this.render.glDrawPolygon(glPoints, branch.trunkColor);

        if (branch.scar === true) {
            this.render.glDrawCircle(branch.glEnd, width, branch.parent.trunkColor);
        }
    }

    #drawLeaves(tree, branch) {

        if (this.viewLeaves === false) {
            return;
        }

        const leaves = branch.getLeaves();
        const count = leaves.length;
        
        if (count === 0) {
            return;
        }

        const currentLeavesPreset = leavesPresets[tree.preset.leavesPreset];

        this.leafDrawer.setPreset(currentLeavesPreset);
        this.leafDrawer.setColor(tree.preset.leafHue);
        
        const formRatio = 1;
        const heliotropism = GlMatrix.fromValues(currentLeavesPreset.heliotropism[0], currentLeavesPreset.heliotropism[1]);

        const leavesSize = leaves.reduce((cum, leaf) => cum + leaf.energy, 0) * branch.preset.leafScale;

        const lightQuantity = branch.budsLight;
        // const lightQuantity = branch.attractors.length;

        this.leafDrawer.draw(tree, branch.glEnd, leavesSize, lightQuantity, formRatio, heliotropism);
    }
}

class Leaf {
    constructor(render, lightSource) {
        this.render = render;
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

        this.#setupParticles(position, size, lightQuantity);

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

            const color = `hsl(${this.hue}, 100%, ${particle.shadeValue}%)`; // H : 80 => 120
            this.render.glDrawCircle(particle.glPosition, particle.size, color);
            this.#dropShadow(particle);
        }
    }

    #dropShadow(particle) {
        GlMatrix.set(
            this.shadowGlPosition,
            particle.glPosition[0] + (this.shadowOffset * particle.glPosition[1]),
            this.tree.position[1]
        );

        const color = `rgba(52, 54, 61, 0.01)`;
        this.render.glDrawCircle(this.shadowGlPosition, particle.size * 1.5, color);
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

export {TreeRender as default};