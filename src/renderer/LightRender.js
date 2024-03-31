
const viewLightInput = document.getElementById('viewPhotons');

class LightRender {
    constructor(render) {
        this.render = render;
    }

    draw(light) {
        // Render.drawLine(light.position, light.target, 2, 'rgb(250, 200, 50)');
        // light.rays.forEach(ray => Render.drawLine(ray.start, ray.end, 1, 'rgb(250, 200, 50)'))
        if (viewLightInput.checked) {
            light.photons.forEach(photon => this.render.drawCircle(photon.position, 10, 'rgb(255, 255, 255, 0.2)'))
        }
        
        
        // light.rays.forEach(ray => this.render.drawLine(ray.start, ray.end, light.width, 'rgb(255, 255, 255, 0.1)'));
        // light.rays.forEach(ray => Render.drawLine(ray.start, ray.end, 5, `rgba(255, 255, 255, ${ray.factor})`))

        this.drawEmiter(light);
        // Render.drawLine(light.position, light.position.add(light.direction.mulScalar(500)), 1, 'rgba(250, 200, 50, 0.4)')
    }

    drawEmiter(light) {
        this.render.drawEmptyCircle(light.position, 50, 'rgb(120, 120, 120)');
        this.render.drawLine(light.position.add(light.direction.mulScalar(60)), light.position.add(light.direction.mulScalar(200)), 1, 'rgb(120, 120, 120)');
    }
}

export {LightRender as default};