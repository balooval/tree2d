
export default `
uniform float time;
varying vec3 vUv;
varying vec3 vInstanceColor;

vec2 rotate(vec2 point, float radAngle, vec2 pivot)
{
    float x = point.x;
    float y = point.y;
    float rX = pivot.x + (x - pivot.x) * cos(radAngle) - (y - pivot.y) * sin(radAngle);
    float rY = pivot.y + (x - pivot.x) * sin(radAngle) + (y - pivot.y) * cos(radAngle);

    return vec2(rX, rY);
}

vec2 rand2d(vec2 uv) {
    return fract(sin(vec2(dot(uv, vec2(12.34, 45.67)),
        dot(uv, vec2(78.9, 3.14)))) * 12345.67) * 2.0 - 1.0;
}


float perlin(vec2 uv) {
    vec2 u = floor(uv);
    vec2 f = fract(uv);
    vec2 s = smoothstep(0.0, 1.0, f);
	
    vec2 a = rand2d(u);
    vec2 b = rand2d(u + vec2(1.0, 0.0));
    vec2 c = rand2d(u + vec2(0.0, 1.0));
    vec2 d = rand2d(u + vec2(1.0, 1.0));
	
    return mix(mix(dot(a, -f), dot(b, vec2(1.0, 0.0) - f), s.x),
        mix(dot(c, vec2(0.0, 1.0) - f), dot(d, vec2(1.0, 1.0) - f), s.x), s.y);
}


void main() {
    vUv = position; 
    vInstanceColor = instanceColor; 

    //gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);

    vec4 mvPosition = vec4(position, 1.0);
    float delta = (cos(time * 0.02) * 0.5);// + 4.72;

    //mvPosition.xy = rotate(mvPosition.xy, delta, vec2(0.0, 0.0));

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(mvPosition.xyz, 1.0);
}


`;
