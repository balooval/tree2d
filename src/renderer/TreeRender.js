import { random } from "../Math.js";

class TreeRender {
    constructor(render) {
        this.render = render;
        this.viewLeaves = true;
        this.leafDrawer = new Leaf(this.render);
    }

    setViewLeaves(state) {
        this.viewLeaves = state;
    }

    draw(tree) {
        tree.getBranchs().forEach(branch => {
            this.#drawBranch(branch);
            // this.#drawLeaves(branch);
        });

        // FallingLeaves.update();
    }

    testLeaves(tree, lightSource) {
        this.leafDrawer.setLightSource(lightSource);
        this.leafDrawer.setColor(tree.preset.leafHue);
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
        
        const formRatio = 1;
        const heliotropism = new Vector(0, -1);

        const leavesSize = leaves.reduce((cum, leaf) => cum + leaf.energy, 0) * branch.preset.leafScale;

        const lightQuantity = branch.budsLight;
        // const lightQuantity = branch.attractors.length;

        this.leafDrawer.draw(tree, branch.end, leavesSize, lightQuantity, formRatio, heliotropism);
    }
}

class Leaf {
    constructor(render) {
        this.render = render;
        this.particlesCount = 72;
        this.particles = [];
        this.formRatio = 0;
        this.heliotropism = new Vector(0, 0);
        this.lightSource = null;
        this.hue = 80;
        this.tree = null;
        this.shadowOffset = 0;
    }

    setColor(hue) {
        this.hue = hue;
    }

    setLightSource(lightSource) {
        this.lightSource = lightSource;
        const radians = this.lightSource.direction.toRadians() - (Math.PI * 1.5);
        this.shadowOffset = Math.tan(radians);
        // console.log('direction', this.lightSource.direction, this.lightSource.direction.toRadians());
    }

    draw(tree, position, size, lightQuantity, formRatio, heliotropism) {
        this.tree = tree;
        this.formRatio = formRatio;
        this.heliotropism = heliotropism;
        this.#addParticles(position, size, lightQuantity);

        while (this.particles.length > 0) {
            this.#grow();
            this.#drawStep();
        }
    }

    #addParticles(position, size, lightQuantity) {
        // const lightValue = Math.round(Math.min(120, 50 + (lightQuantity * 10)));
        const shadeValue = Math.round(lightQuantity * 10);

        for (let i = 0; i < this.particlesCount; i ++) {
            const orientation = new Vector(1, 0).rotateRadiansSelf(i * 5);
            this.particles.push({
                x: position.x,
                y: position.y,
                orientation: orientation.add(this.heliotropism),
                size: (8 * size) + Math.random() * 1,
                life: (100 * size) + Math.random() * 50,
                shadeValue: shadeValue,
                shadeGradient: this.lightSource.direction.dot(orientation) * -1,
            });
        }
    }

    #drawStep() {
        for (let i = 0; i < this.particles.length; i++) {
            if (Math.random() < 0.8) {
                continue;
            }
            const p = this.particles[i];
            const color = `hsl(${this.hue}, 100%, ${p.shadeValue}%)`; // H : 80 => 120

            this.render.drawCircle(p, p.size, color);

            this.#dropShadow(p);
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
        const delta = 16;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
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
                this.particles.splice(i--, 1);
                continue;
            }
        }
    }
}

export {TreeRender as default};