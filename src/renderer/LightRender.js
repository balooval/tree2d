import Render from './Render.js'
import LightLayer from './LightLayer.js'

const viewLightInput = document.getElementById('viewPhotons');

class LightRender {
    constructor(render) {
        this.render = render;
    }

    draw(light) {
        // Render.drawLine(light.position, light.target, 2, 'rgb(250, 200, 50)');
        // light.rays.forEach(ray => Render.drawLine(ray.start, ray.end, 1, 'rgb(250, 200, 50)'))
        if (viewLightInput.checked) {
            light.photons.forEach(photon => Render.drawCircle(photon.position, 10, 'rgb(255, 255, 255, 0.2)'))
        }
        
        // light.rays.forEach(ray => LightLayer.drawRay(light, ray))
        // light.rays.forEach(ray => Render.drawLine(ray.start, ray.end, 5, `rgba(255, 255, 255, ${ray.factor})`))

        Render.drawCircle(light.position, 50, 'rgba(250, 200, 50, 0.5)')
        Render.drawLine(light.position, light.position.add(light.direction.mulScalar(500)), 1, 'rgba(250, 200, 50, 0.4)')
    }

    drawPhoton(worldPosition) {
        const position = Render.worldToCanvasPosition(worldPosition);
        Render.context.beginPath();
        const gradient = Render.context.createRadialGradient(position[0], position[1], 2, position[0], position[1], 20);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        // gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        Render.context.fillStyle = gradient;
        Render.context.arc(position[0], position[1], 20, 0, 6.28);
        Render.context.fill();
    }
}

const lightRender = new LightRender(Render);

export {lightRender as default};