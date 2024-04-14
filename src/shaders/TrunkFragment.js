import PerlinNoise from './PerlinNoise.js';
import Colors from './Colors.js';

export default `
uniform float trunkNoiseSmall;
uniform float trunkNoiseMid;
uniform float trunkNoiseBig;
varying vec2 noiseUv;
varying vec2 vUv;
varying vec3 vColor;

${PerlinNoise}

${Colors}

void main() {
    float scale = 2.0;
    float horPos = scale - (abs((vUv.x - 0.5) * 2.0) * scale);
    float variation = cos(vUv.y * 6.28) * 0.1;
    horPos -= variation;
    
    // horPos = clamp(horPos, 0.0, 1.0);
    horPos = smoothstep(0.2, 1.0, horPos);

    if (horPos < 0.05) {
        discard;
    }

    vec2 noiseUvFrag = vec2(noiseUv.x, noiseUv.y * 5.0);
    
    float noiseA = perlinNormalized(noiseUvFrag * trunkNoiseSmall);
    float noiseB = smoothstep(0.4, 0.5, perlinNormalized(noiseUvFrag * trunkNoiseMid));
    float noiseC = perlinNormalized(noiseUvFrag * trunkNoiseBig);

    float noise = noiseA;
    noise *= noiseB;
    noise += noiseC;

    // int octaves = 8;
    // float noiseScale = trunkNoiseSmall;
    // float noisePower = 1.0;
    // float noise = 0.0;
    // float totalPower = 0.0;

    // for(int i = 0; i < octaves; i ++) {
    //     totalPower += noisePower;
    //     float res = noisePower * perlinNormalized(noiseUvFrag * noiseScale);
    //     noise += res;
    //     noisePower += res;
    //     noiseScale *= 2.0;
    // }
    // noise /= totalPower;
    
    
    vec3 hsl = rgb2hsl(vColor);
    hsl.z *= noise;

    hsl.s *= horPos + 0.0;
    hsl.z *= horPos + 0.0;

    float minimumLight = 0.3;

    vec3 rgb = hsl2rgb(hsl);
    
    gl_FragColor = vec4(rgb.xyz, 1.0);
}`;
