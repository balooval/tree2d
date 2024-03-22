import { randomize, randomElement } from "../Math.js";
import {presets} from '../Tree.js';

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

        // this.render.drawCircle(tree.root.start, tree.root.energy, 'rgba(0, 255, 0, 0.2)');
    }

    #drawBranch(branch) {
        this.render.drawLine(branch.start, branch.end, branch.getWidth(), branch.trunkColor);
        // this.render.drawLine(branch.start, branch.end, branch.getWidth(), `rgb(0, ${branch.energy > 0 ? 255 : 0}, 0)`);
        // this.render.drawLine(branch.start, branch.end, branch.getWidth(), `rgb(0, ${branch.energy * 100}, 0)`);
        // this.render.drawLine(branch.start, branch.end, branch.getWidth(), `rgb(0, ${branch.auxinQuantity * 25}, 0)`);
        // this.render.drawLine(branch.start, branch.end, branch.getWidth(), `rgb(0, ${branch.energyTransferedByCycle * 10}, 0)`);
        // this.render.drawLine(branch.start, branch.end, 10, `rgb(0, ${(branch.length / branch.preset.newBranchLength) * 50}, 0)`);
        // this.render.drawLine(branch.start, branch.end, branch.getWidth(), `rgb(0, 0, 0)`);
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
            // leavePosition.x = randomize(leavePosition.x, branch.preset.leaveDispersion);
            // leavePosition.y = randomize(leavePosition.y, branch.preset.leaveDispersion);
            this.render.drawCircle(leavePosition, branch.getLeafSize(), branch.getLeaveColor())
        }
    }
}

export {TreeRender as default};