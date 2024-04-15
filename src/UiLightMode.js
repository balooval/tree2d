import { BaseRender, canvasToWorldPosition } from './renderer/BaseRender.js';
import * as UiMouse from './UiMouse.js';
import { intCanvasToWorldPosition } from './renderer/BaseRender.js';

class UiLightMode {
    constructor() {
        this.canvasId = null;
        this.active = false;
        this.callback = null;
        this.lightSource = null;
        this.run = false;
    }
    
    init(canvas, lightSource, callback) {
        this.canvasId = canvas.id;
        this.lightSource = lightSource;
        this.callback = callback;
        document.getElementById(this.canvasId).addEventListener('mousedown', (evt) => this.#onMouseDown(evt));
        document.getElementById(this.canvasId).addEventListener('mouseup', (evt) => this.#onMouseUp(evt));
    }

    start() {
        this.active = true;
    }
    
    stop() {
        this.active = false;
        this.run = false;
    }

    #onMouseDown(evt) {
        if (evt.button !== 0) {
            return;
        }
        if (this.active === false) {
            return;
        }


        this.run = true;
    }

    #onMouseUp(evt) {
        if (evt.button !== 0) {
            return;
        }
        if (this.active === false) {
            return;
        }

        this.run = false;
    }

    update() {
        
        if (this.active === false) {
            return;
        }
        
        const lightPosition = intCanvasToWorldPosition(UiMouse.mousePosition[0], UiMouse.mousePosition[1]);
        this.lightSource.reset(lightPosition[0], lightPosition[1]);
        
        if (this.run === false) {
            return;
        }

        this.callback();
    }
}

export default new UiLightMode();