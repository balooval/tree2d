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
        // this.render.drawLine(branch.start, branch.end, 10, `rgb(150, ${branch.energy * 60}, 150)`);
        // this.render.drawLine(branch.start, branch.end, branch.getWidth(), `rgb(0, ${branch.auxinQuantity * 25}, 0)`);
        // this.render.drawLine(branch.start, branch.end, branch.getWidth(), `rgb(0, ${branch.energyTransferedByCycle * 10}, 0)`);
        // this.render.drawLine(branch.start, branch.end, 10, `rgb(0, ${(branch.length / branch.preset.newBranchLength) * 50}, 0)`);
        // this.render.drawLine(branch.start, branch.end, branch.getWidth(), `rgb(0, 0, 0)`);
        // return;

        if (branch.parent === null) {
            return;
        }

        const width = branch.getWidth();
        const parentWidth = branch.parent.getWidth();

        const points = [
            branch.end.add(branch.direction.rotateDegrees(90).mulScalarSelf(width)),
            branch.end.add(branch.direction.rotateDegrees(-90).mulScalarSelf(width)),
            branch.parent.end.add(branch.parent.direction.rotateDegrees(-90).mulScalarSelf(parentWidth)),
            branch.parent.end.add(branch.parent.direction.rotateDegrees(90).mulScalarSelf(parentWidth)),
        ];

        this.render.drawPolygon(points, branch.trunkColor);
    }

    #drawLeaves(branch) {

        if (this.viewLeaves === false) {
            return;
        }

        if (branch.leavesHealth === 0) {
            return;
        }

        const leaves = branch.getLeaves();

        const count = leaves.length;

        for (let i = 0; i < count; i ++) {
            const leavePosition = leaves[i];
            this.render.drawCircle(leavePosition, 10, branch.getLeaveColor());
        }
    }
}

export {TreeRender as default};