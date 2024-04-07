import PerlinNoise from './PerlinNoise.js';

export default `
uniform float time;
uniform float groundPosition; 
varying vec3 vUv;
varying vec3 vInstanceColor;
attribute vec3 instancePosition; 

${PerlinNoise}

vec2 rotate(vec2 point, float radAngle, vec2 pivot)
{
    float x = point.x;
    float y = point.y;
    float rX = pivot.x + (x - pivot.x) * cos(radAngle) - (y - pivot.y) * sin(radAngle);
    float rY = pivot.y + (x - pivot.x) * sin(radAngle) + (y - pivot.y) * cos(radAngle);

    return vec2(rX, rY);
}

void main() {
    vUv = position; 
    vInstanceColor = instanceColor; 

    //gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);

    vec4 worldPosition = instanceMatrix * vec4(position, 1.0);
    float noiseA = perlin(vec2((instancePosition.x + (time * 2.0)) * 0.005, instancePosition.y * 0.05));
    float noiseB = perlin(vec2((instancePosition.x + (time * 2.0)) * 0.05, instancePosition.y * 0.5));
    float noise = noiseA + (noiseB * 0.1);

    //float noiseFactor = clamp((instancePosition.y - groundPosition) * 0.01, 0.1, 1.0);
    float noiseFactor = (instancePosition.y - groundPosition) * 0.001;

    worldPosition.x += (noise * noiseFactor) * 20.0;

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(worldPosition.xyz, 1.0);
}


`;
