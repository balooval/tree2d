import PerlinNoise from './PerlinNoise.js';
import Colors from './Colors.js';

export default `
uniform float time;
uniform float groundPosition;
uniform vec2 mousePosition;
uniform vec2 lightDirection;
uniform vec3 globalColor;
varying vec3 vFinalColor;
attribute vec3 instancePosition; 
attribute vec2 instanceOrientations; 
attribute float instanceDistance; 
attribute float instanceLightReceived; 

${PerlinNoise}

${Colors}

vec2 rotate(vec2 point, float radAngle, vec2 pivot)
{
    float x = point.x;
    float y = point.y;
    float rX = pivot.x + (x - pivot.x) * cos(radAngle) - (y - pivot.y) * sin(radAngle);
    float rY = pivot.y + (x - pivot.x) * sin(radAngle) + (y - pivot.y) * cos(radAngle);

    return vec2(rX, rY);
}

void main() {
    float instanceLightShade = (dot(lightDirection, instanceOrientations) + 1.3) * 0.4;
    instanceLightShade += instanceDistance * (instanceLightReceived * 0.1);

    vec3 hsl = rgb2hsl(globalColor);
    hsl.z *= instanceLightShade;

    vec3 finalRgb = hsl2rgb(hsl);

    vFinalColor = finalRgb;
    // vFinalColor = vec3(instanceLightReceived, instanceLightReceived, instanceLightReceived);

    //gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);

    vec4 worldPosition = instanceMatrix * vec4(position, 1.0);
    float noiseA = perlin(vec2((instancePosition.x + (time * 2.0)) * 0.005, instancePosition.y * 0.05));
    float noiseB = perlin(vec2((instancePosition.x + (time * 2.0)) * 0.05, instancePosition.y * 0.5));
    float noise = noiseA + (noiseB * 0.1);

    float noiseFactor = (instancePosition.y - groundPosition) * 0.001;
    worldPosition.x += (noise * noiseFactor) * 20.0;

    vec4 instancePosition = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec2 toto = vec2(instancePosition.xy - mousePosition);
    float angleWithMouse = atan(toto.y, toto.x);
    float mouseForce = 150.0 - clamp(distance(mousePosition, vec2(instancePosition.xy)), 1.0, 150.0);
    float mouseTranslationX = cos(angleWithMouse) * (mouseForce * 0.11);
    float mouseTranslationY = sin(angleWithMouse) * (mouseForce * 0.11);

    worldPosition.x += mouseTranslationX;
    worldPosition.y += mouseTranslationY;
    

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(worldPosition.xyz, 1.0);
}


`;
