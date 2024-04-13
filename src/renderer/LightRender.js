
const viewLightInput = document.getElementById('viewPhotons');
import * as GlMatrix from "../../vendor/gl-matrix/vec2.js";

class LightRender {
    constructor(render) {
        this.render = render;
        this.lightTargetStart = GlMatrix.create();
        this.lightTargetEnd = GlMatrix.create();
    }

    draw(light) {
        if (viewLightInput.checked) {
            light.photons.forEach(photon => this.render.glDrawCircle(photon.glPosition, 10, 'rgb(255, 255, 255)'))
        }

        this.drawEmiter(light);
    }

    drawEmiter(light) {
        const lightSize = 50;
        this.render.glDrawEmptyCircle(light.glPosition, lightSize, 'rgb(120, 120, 120)');

        GlMatrix.scale(this.lightTargetStart, light.glDirection, lightSize * 1.7);
        GlMatrix.add(this.lightTargetStart, this.lightTargetStart, light.glPosition);

        GlMatrix.scale(this.lightTargetEnd, light.glDirection, lightSize * 4);
        GlMatrix.add(this.lightTargetEnd, this.lightTargetEnd, light.glPosition);

        this.render.glDrawLine(this.lightTargetStart, this.lightTargetEnd, 1, 'rgb(120, 120, 120)');

        const cornerCount = 8;
        const angleStep = (Math.PI * 2) / cornerCount;

        for (let i = 0; i < cornerCount; i ++) {
            const angle = i * angleStep;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const startX = light.glPosition[0] + cos * (lightSize * 1.2);
            const startY = light.glPosition[1] + sin * (lightSize * 1.2);
            const endX = light.glPosition[0] + cos * (lightSize * 1.5);
            const endY = light.glPosition[1] + sin * (lightSize * 1.5);
            this.render.glDrawLine([startX, startY], [endX, endY], 2, 'rgb(120, 120, 120)');

        }
    }
}

export {LightRender as default};