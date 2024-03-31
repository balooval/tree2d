import { degrees, random } from "../Math.js";

class TreeRender {
    constructor(render, lightSource) {
        this.render = render;
        this.lightSource = lightSource;
        this.viewLeaves = true;
        this.leafDrawer = new Leaf(this.render, this.lightSource);
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

    testLeaves(tree) {
        this.leafDrawer.setFullQuality();
        tree.getBranchs().forEach(branch => {
            this.#drawLeaves(tree, branch);
        });
    }

    #drawBranch(branch) {
        // this.render.drawLine(branch.start, branch.end, branch.getWidth(), branch.trunkColor);
        // this.render.drawLine(branch.start, branch.end, branch.getWidth(), `rgb(0, ${branch.energy > 0 ? 255 : 0}, 0)`);
        // this.render.drawLine(branch.start, branch.end, 10, `rgb(150, ${(branch.energy / branch.energyNeededToGrow) * 255}, 150)`);
        // this.render.drawLine(branch.start, branch.end, branch.getWidth(), `rgb(0, ${branch.auxinQuantity * 25}, 0)`);
        // this.render.drawLine(branch.start, branch.end, branch.getWidth(), `rgb(0, ${branch.energyTransferedByCycle * 10}, 0)`);
        // this.render.drawLine(branch.start, branch.end, 10, `rgb(0, ${(branch.length / branch.preset.newBranchLength) * 50}, 0)`);
        // this.render.drawLine(branch.start, branch.end, branch.getWidth(), `rgb(0, 0, 0)`);
        // this.render.drawLine(branch.start, branch.end, 10, `rgb(0, ${branch.mainStrenght * 250}, 0)`);
        // return;

        const width = branch.getWidth();
        const parentWidth = branch.parent.getWidth();

        const points = [
            branch.end.add(branch.direction.rotateDegrees(90).mulScalarSelf(width)),
            branch.end.add(branch.direction.rotateDegrees(-90).mulScalarSelf(width)),
            branch.parent.end.add(branch.parent.direction.rotateDegrees(-90).mulScalarSelf(parentWidth)),
            branch.parent.end.add(branch.parent.direction.rotateDegrees(90).mulScalarSelf(parentWidth)),
        ];

        this.render.drawPolygon(points, branch.trunkColor);

        if (branch.scar === true) {
            this.render.drawCircle(branch.end, width, branch.parent.trunkColor);
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

        this.leafDrawer.setColor(tree.preset.leafHue);
        
        const formRatio = 1;
        const heliotropism = new Vector(0, -1);

        const leavesSize = leaves.reduce((cum, leaf) => cum + leaf.energy, 0) * branch.preset.leafScale;

        const lightQuantity = branch.budsLight;
        // const lightQuantity = branch.attractors.length;

        this.leafDrawer.draw(tree, branch.end, leavesSize, lightQuantity, formRatio, heliotropism);
    }
}

class Leaf {
    constructor(render, lightSource) {
        this.render = render;
        this.particlesCount = 72;
        this.particlesToDraw = this.particlesCount;
        this.particles = [];
        this.formRatio = 0;
        this.heliotropism = new Vector(0, 0);
        this.lightSource = lightSource;
        this.hue = 80;
        this.tree = null;
        this.shadowOffset = 0;
        this.growIsRunning = false;

        this.maxWhileLoop = 999999;

        for (let i = 0; i < this.particlesCount; i ++) {
            this.particles.push({
                x: 0,
                y: 0,
                orientation: new Vector(0, 1),
                size: 1,
                life: 1,
                shadeValue: 0,
                shadeGradient: new Vector(0, 1),
            });
        }
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
        
        const radians = this.lightSource.direction.toRadians() - (Math.PI * 1.5);
        this.shadowOffset = Math.tan(radians);

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

        for (let i = 0; i < this.particlesToDraw; i ++) {
            const orientation = new Vector(1, 0).rotateRadiansSelf(i * 5);
            this.particles[i].x = position.x;
            this.particles[i].y = position.y;
            this.particles[i].orientation = orientation.add(this.heliotropism);
            this.particles[i].size = (8 * size) + Math.random() * 1;
            this.particles[i].life = (100 * size) + Math.random() * 50;
            this.particles[i].shadeValue = shadeValue;
            this.particles[i].shadeGradient = this.lightSource.direction.dot(orientation) * -1;
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

            // console.log('particle', particle);
            this.render.drawCircle(particle, particle.size, color);

            this.#dropShadow(particle);
        }
    }

    #dropShadow(particle) {
        const position = {
            x: particle.x + (this.shadowOffset * particle.y),
            y: this.tree.position.y,
        };
        
        // position.x += Math.tan(this.lightSource.direction.toRadians()) * particle.y;
        const color = `rgba(52, 54, 61, 0.01)`;
        this.render.drawCircle(position, particle.size * 1.5, color);
    }

    #grow() {
        this.growIsRunning = false;
        const delta = 16;
        for (let i = 0; i < this.particlesToDraw; i++) {
            const p = this.particles[i];
            if (p.life <= 0) {
                continue;
            }
            const translationX = p.orientation.x * (4 + this.formRatio) + random(-2, 2);
            const translationY = p.orientation.y * (4 - this.formRatio) + random(-2, 2);
            p.x += translationX;
            p.y += translationY;
            p.life -= delta;
            p.size -= delta / 35;
            // p.shadeValue = Math.min(90, Math.max(13, p.shadeValue + translationY));
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