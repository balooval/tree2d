import * as UiMouse from './UiMouse.js';
import RBushKnn from '../vendor/rbush-knn.js';
import { BaseRender, canvasToWorldPosition } from './renderer/BaseRender.js';

class UiCut {
    constructor() {
        this.render = new BaseRender();
        this.canvasId = null;
        this.active = false;
        this.rbushBranchs = null;
        this.maxSearchDistance = 50;
        this.targetBranch = null;
        this.cutCallback = null;
    }
    
    init(canvas, cutCallback) {
        this.render.init(canvas);
        this.cutCallback = cutCallback;
        this.mainContext = canvas.getContext('2d');
        this.canvasId = canvas.id;
        this.rbushBranchs = null;
        document.getElementById(this.canvasId).addEventListener('mousemove', () => this.#onMouseMove());
        document.getElementById(this.canvasId).addEventListener('click', () => this.#onClick());
    }

    update() {
        if (this.active === false) {
            return;
        }

        this.#draw();
    }

    start() {
        this.active = true;
    }
    
    stop() {
        this.active = false;
        this.targetBranch = null;
        this.render.clear();
    }

    #onClick() {
        if (this.targetBranch !== null) {
            this.targetBranch.remove();
            this.cutCallback();
            this.targetBranch = null;
        }
    }

    #onMouseMove() {
        if (this.active === false) {
            return;
        }
        const worldPosition = canvasToWorldPosition({x:UiMouse.mousePosition[0], y:UiMouse.mousePosition[1]});
        const nearBranch = RBushKnn(this.rbushBranchs, worldPosition[0], worldPosition[1], 1, undefined, this.maxSearchDistance);

        if (nearBranch.length === 0) {
            this.targetBranch = null;
            return;
        }

        this.targetBranch = nearBranch.pop().branch;
    }
    
    #draw() {

        this.render.clear();

        if (this.targetBranch !== null) {
            this.#drawTargetBranch(this.targetBranch);
        }

        this.render.drawIntoContext(this.mainContext);
    }

    #drawTargetBranch(branch) {
        const allBranchs = branch.addToList([]);
        
        for (let i = 0; i < allBranchs.length; i ++) {
            this.render.glDrawLine(allBranchs[i].glStart, allBranchs[i].glEnd, allBranchs[i].getWidth(), `rgb(255, 0, 0)`);
        }
    }

    setBranches(rbushBranchs) {
        this.rbushBranchs = rbushBranchs;
    }
}

export default new UiCut();