
const viewLightInput = document.getElementById('viewPhotons');
import * as GlMatrix from "../../vendor/gl-matrix/vec2.js";

class LightRender {
    constructor(render) {
        this.render = render;
        this.lightTargetStart = GlMatrix.create();
        this.lightTargetEnd = GlMatrix.create();
    }

    draw(light) {
        // Render.drawLine(light.position, light.target, 2, 'rgb(250, 200, 50)');
        // light.rays.forEach(ray => Render.drawLine(ray.start, ray.end, 1, 'rgb(250, 200, 50)'))
        if (viewLightInput.checked) {
            light.photons.forEach(photon => this.render.glDrawCircle(photon.glPosition, 10, 'rgb(255, 255, 255)'))
        }
        
        
        // light.rays.forEach(ray => this.render.drawLine(ray.start, ray.end, light.width, 'rgb(255, 255, 255, 0.1)'));
        // light.rays.forEach(ray => Render.drawLine(ray.start, ray.end, 5, `rgba(255, 255, 255, ${ray.factor})`))

        this.drawEmiter(light);
    }

    drawEmiter(light) {
        this.render.glDrawEmptyCircle(light.glPosition, 50, 'rgb(120, 120, 120)');

        GlMatrix.scale(this.lightTargetStart, light.glDirection, 60);
        GlMatrix.add(this.lightTargetStart, this.lightTargetStart, light.glPosition);

        GlMatrix.scale(this.lightTargetEnd, light.glDirection, 200);
        GlMatrix.add(this.lightTargetEnd, this.lightTargetEnd, light.glPosition);

        this.render.glDrawLine(this.lightTargetStart, this.lightTargetEnd, 1, 'rgb(120, 120, 120)');
    }
}

export {LightRender as default};