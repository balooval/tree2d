import * as UiMouse from './UiMouse.js';
import RBushKnn from '../vendor/rbush-knn.js';
import { BaseRender, canvasToWorldPosition } from './renderer/BaseRender.js';

class UiBend {
    constructor() {
        this.render = new BaseRender();
        this.canvasId = null;
        this.active = false;
        this.rbushBranchs = null;
        this.maxSearchDistance = 50;
        this.targetBranch = null;
        this.callback = null;
        this.currentMode = 'select';
        this.lastMouseY = 0;
        this.leftButton = 0;
    }
    
    init(canvas, callback) {
        this.render.init(canvas);
        this.callback = callback;
        this.mainContext = canvas.getContext('2d');
        this.canvasId = canvas.id;
        this.rbushBranchs = null;
        document.getElementById(this.canvasId).addEventListener('mousemove', () => this.#onMouseMove());
        document.getElementById(this.canvasId).addEventListener('mousedown', (evt) => this.#onMouseDown(evt));
        document.getElementById(this.canvasId).addEventListener('mouseup', (evt) => this.#onMouseUp(evt));
    }

    update() {
        if (this.active === false) {
            return;
        }

        this.#draw();
    }

    start() {
        this.active = true;
        this.currentMode = 'select';
    }
    
    stop() {
        this.active = false;
        this.targetBranch = null;
        this.render.clear();
    }

    #onMouseDown(evt) {
        if (evt.button !== this.leftButton) {
            return;
        }
        if (this.targetBranch === null) {
            return;
        }

        this.currentMode = 'bend';
        this.lastMouseY = UiMouse.mousePosition[1];
    }

    #onMouseUp(evt) {
        if (evt.button !== this.leftButton) {
            return;
        }
        if (this.active === false) {
            return;
        }
        this.currentMode = 'select';
        if (this.targetBranch === null) {
            return;
        }
        this.callback();
        this.targetBranch = null;
    }

    #onMouseMove() {
        if (this.active === false) {
            return;
        }

        if (this.currentMode === 'select') {
            const worldPosition = canvasToWorldPosition({x:UiMouse.mousePosition[0], y:UiMouse.mousePosition[1]});
            const nearBranch = RBushKnn(this.rbushBranchs, worldPosition[0], worldPosition[1], 1, undefined, this.maxSearchDistance);

            if (nearBranch.length === 0) {
                this.targetBranch = null;
                return;
            }

            this.targetBranch = nearBranch.pop().branch;
        }

        if (this.currentMode === 'bend') {
            const angle = (UiMouse.mousePosition[1] - this.lastMouseY) * 0.01;
            this.lastMouseY = UiMouse.mousePosition[1];
            this.targetBranch.softRotate(angle, 0, 8);
        }
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
            this.render.glDrawLine(allBranchs[i].glStart, allBranchs[i].glEnd, allBranchs[i].getWidth(), `rgb(0, 0, 255)`);
        }
    }

    setBranches(rbushBranchs) {
        this.rbushBranchs = rbushBranchs;
    }
}

export default new UiBend();