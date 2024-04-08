import PerlinNoise from './PerlinNoise.js';

export default `
varying vec2 noiseUv;
varying vec2 vUv;
attribute vec2 uvs; 
attribute vec2 noiseuvs; 

vec2 rotate(vec2 point, float radAngle, vec2 pivot)
{
    float x = point.x;
    float y = point.y;
    float rX = pivot.x + (x - pivot.x) * cos(radAngle) - (y - pivot.y) * sin(radAngle);
    float rY = pivot.y + (x - pivot.x) * sin(radAngle) + (y - pivot.y) * cos(radAngle);

    return vec2(rX, rY);
}

void main() {
    
    vUv = uvs;
    noiseUv = vec2(noiseuvs.x, noiseuvs.y) * 0.6;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}


`;
