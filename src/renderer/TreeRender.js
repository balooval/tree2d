// import * as FallingLeaves from '../FallingLeaves.js';

class TreeRender {
    constructor(render) {
        this.render = render;
        this.viewLeaves = true;
    }

    setViewLeaves(state) {
        this.viewLeaves = state;
    }

    draw(tree) {
        tree.getBranchs().forEach(branch => {
            this.#drawBranch(branch);
            this.#drawLeaves(branch);
        });

        // FallingLeaves.update();

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

    #drawLeaves(branch) {

        if (this.viewLeaves === false) {
            return;
        }

        const leaves = branch.getLeaves();
        const count = leaves.length;
        
        if (count === 0) {
            return;
        }

        for (let i = 0; i < count; i ++) {
            const leaf = leaves[i];
            this.render.drawImage(
                'leaf',
                branch.end,
                leaf.orientation.toRadians() + Math.PI / 2,
                Math.log1p(leaf.light * 2)// * 2
            );
            // this.render.drawLine(branch.end, leaf.orientation.mulScalar(leaf.energy * 5).add(branch.end), leaf.light * 20, 'rgb(255, 0, 0)');
        }
    }
}

export {TreeRender as default};