import PerlinNoise from './PerlinNoise.js';

export default `
uniform float time;
varying vec3 vUv;
varying vec3 vInstanceColor;
varying float distanceFromGround;
attribute vec3 instancePosition; 

vec2 rotate(vec2 point, float radAngle, vec2 pivot)
{
    float x = point.x;
    float y = point.y;
    float rX = pivot.x + (x - pivot.x) * cos(radAngle) - (y - pivot.y) * sin(radAngle);
    float rY = pivot.y + (x - pivot.x) * sin(radAngle) + (y - pivot.y) * cos(radAngle);

    return vec2(rX, rY);
}

${PerlinNoise}

void main() {
    vUv = position; 
    vInstanceColor = instanceColor; 
    distanceFromGround = position.y;

    //gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);

    vec4 mvPosition = vec4(position, 1.0);
    float delta = (cos(time * 0.02) * 0.5);// + 4.72;

    float angle = perlin(vec2((instancePosition.x + (time * 2.0)) * 0.005, instancePosition.y * 0.05));

    mvPosition.xy = rotate(mvPosition.xy, angle * 1.0, vec2(0.0, 0.0));

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(mvPosition.xyz, 1.0);
}


`;
