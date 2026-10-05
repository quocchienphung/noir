/**
 * GLSL ES 3.0 sources for the NOIR black-hole renderer.
 *
 * Physics model (units of the Schwarzschild radius, rs = 1):
 * photon paths are integrated with the exact Schwarzschild null-geodesic form written as a Newtonian-like
 * force, a = −1.5 · h² · x / |x|⁵ (h = |x × v|, conserved), which reproduces gravitational lensing, the
 * photon ring at r ≈ 1.5 and the shadow of radius ≈ 2.6 rs. The thin accretion disk lies in the y = 0 plane;
 * each crossing of that plane is shaded and composited front-to-back, so the far side of the disk appears
 * lensed above and below the hole exactly as in a ray-traced render.
 */

export const FULLSCREEN_VERT = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const TRACE_FRAG = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2D;

in vec2 vUv;
out vec4 fragColor;

uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCamPos;
uniform mat3 uCamBasis;   // columns: right, up, forward
uniform float uTanHalfFov;
uniform sampler2D uNoise; // 256×256 RGBA random, LINEAR + REPEAT
uniform int uSteps;
uniform float uDiskIn;
uniform float uDiskOut;
uniform float uDiskGain;
uniform float uDoppler;
uniform float uFlow;      // disk flow speed
uniform vec3 uHot;        // inner (hottest) emission tint
uniform vec3 uWarm;       // mid-disk tint
uniform vec3 uCool;       // outer-disk tint
uniform float uStarGain;

const float PI = 3.14159265;
const float TAU = 6.28318531;

float n2(vec2 p) { return texture(uNoise, p / 256.0).r; }

// Mip-sampled value noise; uv.x = 1 per revolution so the pattern wraps seamlessly around the disk.
// Coarser mips average the white noise, so the contrast of the design level (lod) is restored by 2^lod.
// aa is the level the pixel footprint needs: sampling there (without extra boost) lets detail that is
// smaller than a pixel average out instead of aliasing into moiré on the grazing, edge-on disk.
float tn(vec2 uv, float lod, float aa) {
  float v = textureLod(uNoise, uv, max(lod, aa)).r;
  return clamp((v - 0.5) * exp2(lod) * 1.15 + 0.5, 0.0, 1.0);
}

// Cartesian fbm for the background dust (no wrap needed).
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * n2(p);
    p = p * 2.03 + vec2(17.0, 31.0);
    a *= 0.5;
  }
  return s;
}

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

vec3 starfield(vec3 d) {
  vec3 col = vec3(0.0);
  for (int layer = 0; layer < 2; layer++) {
    float scale = layer == 0 ? 90.0 : 210.0;
    vec3 p = d * scale;
    vec3 id = floor(p);
    vec3 f = fract(p) - 0.5;
    float h = hash13(id + float(layer) * 19.7);
    if (h > (layer == 0 ? 0.992 : 0.996)) {
      vec3 o = vec3(hash13(id + 3.1), hash13(id + 7.7), hash13(id + 11.3)) - 0.5;
      float dist = length(f - o * 0.6);
      float s = smoothstep(0.12, 0.0, dist);
      float tint = hash13(id + 5.5);
      col += s * mix(vec3(1.0, 0.86, 0.7), vec3(0.75, 0.85, 1.0), tint) * (0.4 + 2.0 * pow(h, 40.0));
    }
  }
  // very faint warm dust so the void is not a flat colour
  float dust = fbm(d.xz * 38.0 + d.y * 21.0);
  col += vec3(0.014, 0.008, 0.005) * smoothstep(0.5, 0.95, dust) + vec3(0.009, 0.0055, 0.0038);
  return col * uStarGain;
}

// Disk emission and opacity at a plane crossing.
vec4 shadeDisk(vec3 hit, vec3 dir, float travel) {
  float r = length(hit.xz);
  float phi = atan(hit.z, hit.x);
  // world-space size of this pixel where the ray meets the disk (stretched at grazing incidence)
  float pixAngle = 2.0 * uTanHalfFov / uRes.y;
  float foot = travel * pixAngle / max(abs(dir.y), 0.04);
  // texels per pixel across the radius for a radial frequency k (v = k·ln r → dv = k·dr/r)
  // (biased ~0.8 level sharp: a touch of sub-pixel sparkle reads as fine filaments rather than moiré)
  float aaBase = log2(max(256.0 * foot / r, 1e-4)) - 0.8;

  // Keplerian differential rotation with two cross-faded phases so the pattern never winds up.
  float omega = uFlow * pow(r, -1.5);  // sign of uFlow = sense of rotation
  float period = 24.0;
  float f1 = fract(uTime / period);
  float f2 = fract(uTime / period + 0.5);
  float w1 = 1.0 - abs(2.0 * f1 - 1.0);
  float w2 = 1.0 - abs(2.0 * f2 - 1.0);

  float lnr = log(r);
  float pattern = 0.0;
  float fine = 0.0;
  for (int k = 0; k < 2; k++) {
    float fk = k == 0 ? f1 : f2;
    float wk = k == 0 ? w1 : w2;
    float u = (phi - omega * fk * period) / TAU;
    float ko = float(k);
    // orbit-aligned lanes: few features around, many across the radius
    float lanes = 0.5 * tn(vec2(u, lnr * 2.2 + ko * 0.37), 2.0, aaBase + 1.14)
                + 0.32 * tn(vec2(u * 2.0, lnr * 4.6 + ko * 0.61), 1.5, aaBase + 2.2)
                + 0.18 * tn(vec2(u, lnr * 1.1 + ko * 0.21), 3.0, aaBase + 0.14);
    float threads = tn(vec2(u * 2.0, lnr * 6.0 + ko * 0.13), 1.2, aaBase + 2.58);
    pattern += wk * lanes;
    fine += wk * threads;
  }

  float density = smoothstep(0.28, 0.82, pattern) * (0.5 + 0.7 * fine);
  density = clamp(density, 0.0, 1.0);

  // radial profile: sharp inner edge near the ISCO, soft outer fade
  float inner = smoothstep(uDiskIn, uDiskIn + 0.35, r);
  float outer = 1.0 - smoothstep(uDiskOut * 0.45, uDiskOut, r);
  float profile = inner * outer * pow(uDiskIn / r, 1.25);

  // temperature → colour (white-gold inside, amber, then brown-red outside)
  float t = clamp((r - uDiskIn) / (uDiskOut - uDiskIn), 0.0, 1.0);
  vec3 col = mix(uHot, uWarm, smoothstep(0.0, 0.14, t));
  col = mix(col, uCool, smoothstep(0.12, 0.75, t));
  // the brightest threads run hotter than the gas between them
  col = mix(col, uHot, 0.2 * density * (1.0 - t));

  // relativistic beaming (orbital velocity of a static-frame Keplerian orbit, M = 0.5)
  vec3 vdir = normalize(vec3(-hit.z, 0.0, hit.x)) * sign(uFlow);
  float beta = clamp(sqrt(0.5 / max(r - 1.0, 0.05)), 0.0, 0.7);
  float gamma = inversesqrt(1.0 - beta * beta);
  float dop = 1.0 / (gamma * (1.0 + beta * dot(vdir, dir)));
  float beaming = mix(1.0, pow(dop, 3.0), uDoppler);
  float gravRed = sqrt(max(1.0 - 1.0 / r, 0.0));
  col *= mix(vec3(1.0), vec3(1.0, 0.92 + 0.08 * dop, 0.8 + 0.2 * dop), uDoppler);

  float emission = uDiskGain * profile * beaming * gravRed * (0.14 + 2.0 * pow(density, 1.5));
  float alpha = clamp(inner * outer * (0.25 + 0.85 * density), 0.0, 0.96);
  return vec4(col * emission, alpha);
}

void main() {
  vec2 uv = (gl_FragCoord.xy / uRes) * 2.0 - 1.0;
  uv.x *= uRes.x / uRes.y;
  vec3 rd = normalize(uCamBasis * vec3(uv * uTanHalfFov, 1.0));

  vec3 p = uCamPos;
  vec3 v = rd;
  vec3 hv = cross(p, v);
  float h2 = dot(hv, hv);

  vec3 col = vec3(0.0);
  float alpha = 0.0;
  float travel = 0.0;
  bool captured = false;
  bool escaped = false;

  for (int i = 0; i < 400; i++) {
    if (i >= uSteps) break;
    float r2 = dot(p, p);
    float r = sqrt(r2);
    float dt = clamp(0.065 * r, 0.012, 1.4);
    vec3 acc = -1.5 * h2 * p / (r2 * r2 * r);
    vec3 nv = v + acc * dt;
    vec3 np = p + nv * dt;

    if (p.y * np.y < 0.0) {
      float s = p.y / (p.y - np.y);
      vec3 hit = mix(p, np, s);
      float hr = length(hit.xz);
      if (hr > uDiskIn * 0.98 && hr < uDiskOut) {
        vec4 d = shadeDisk(hit, normalize(nv), travel + s * dt);
        col += (1.0 - alpha) * d.rgb;
        alpha += (1.0 - alpha) * d.a;
        if (alpha > 0.985) break;
      }
    }

    travel += dt;
    p = np;
    v = nv;
    if (dot(p, p) < 1.0) { captured = true; break; }
    if (r > 70.0 && dot(p, v) > 0.0) { escaped = true; break; }
  }

  if (!captured) {
    vec3 bg = starfield(normalize(v));
    col += (1.0 - alpha) * bg * (escaped ? 1.0 : 0.6);
  }
  fragColor = vec4(col, 1.0);
}
`;

/** Bright-pass + 4-tap downsample (first bloom level). */
export const PREFILTER_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uThreshold;
vec3 tap(vec2 o) { return texture(uSrc, vUv + o * uTexel).rgb; }
void main() {
  vec3 c = (tap(vec2(-1.0, -1.0)) + tap(vec2(1.0, -1.0)) + tap(vec2(-1.0, 1.0)) + tap(vec2(1.0, 1.0))) * 0.25;
  float br = max(c.r, max(c.g, c.b));
  float knee = uThreshold * 0.6;
  float soft = clamp(br - uThreshold + knee, 0.0, 2.0 * knee);
  soft = soft * soft / (4.0 * knee + 1e-4);
  float contrib = max(soft, br - uThreshold) / max(br, 1e-4);
  fragColor = vec4(c * contrib, 1.0);
}
`;

/** 13-tap downsample (Jimenez 2014). */
export const DOWN_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uSrc;
uniform vec2 uTexel;
vec3 t(vec2 o) { return texture(uSrc, vUv + o * uTexel).rgb; }
void main() {
  vec3 a = t(vec2(-2.0, 2.0)), b = t(vec2(0.0, 2.0)), c = t(vec2(2.0, 2.0));
  vec3 d = t(vec2(-2.0, 0.0)), e = t(vec2(0.0, 0.0)), f = t(vec2(2.0, 0.0));
  vec3 g = t(vec2(-2.0, -2.0)), h = t(vec2(0.0, -2.0)), i = t(vec2(2.0, -2.0));
  vec3 j = t(vec2(-1.0, 1.0)), k = t(vec2(1.0, 1.0)), l = t(vec2(-1.0, -1.0)), m = t(vec2(1.0, -1.0));
  vec3 res = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
  fragColor = vec4(res, 1.0);
}
`;

/** 9-tap tent upsample, added onto the next-larger level. */
export const UP_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uRadius;
vec3 t(vec2 o) { return texture(uSrc, vUv + o * uTexel * uRadius).rgb; }
void main() {
  vec3 s = t(vec2(0.0)) * 4.0;
  s += (t(vec2(-1.0, 0.0)) + t(vec2(1.0, 0.0)) + t(vec2(0.0, -1.0)) + t(vec2(0.0, 1.0))) * 2.0;
  s += t(vec2(-1.0, -1.0)) + t(vec2(1.0, -1.0)) + t(vec2(-1.0, 1.0)) + t(vec2(1.0, 1.0));
  fragColor = vec4(s / 16.0, 1.0);
}
`;

/** Final composite: bloom, ACES filmic tonemap, vignette, film grain and dither. */
export const COMPOSITE_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uExposure;
uniform float uBloomGain;
uniform float uFade;       // 0 → scene, 1 → black (crossing the horizon)
uniform float uTime;
uniform float uGrain;
uniform vec2 uRes;

vec3 aces(vec3 x) {
  const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
void main() {
  vec3 scene = texture(uScene, vUv).rgb;
  vec3 bloom = texture(uBloom, vUv).rgb;
  vec3 c = (scene + bloom * uBloomGain) * uExposure;
  // blend ACES with a hue-preserving variant (tonemap the peak channel, keep the ratios) so very hot gas
  // stays gold instead of collapsing to grey-white, while true highlights still roll off to white
  float peak = max(c.r, max(c.g, c.b));
  vec3 hueKeep = c * (aces(vec3(peak)).r / max(peak, 1e-4));
  c = mix(aces(c), hueKeep, 0.6);
  c = pow(c, vec3(1.0 / 2.2));
  vec2 q = vUv - 0.5;
  c *= 1.0 - smoothstep(0.35, 0.95, length(q * vec2(1.05, 1.2))) * 0.55;
  float g = hash12(gl_FragCoord.xy + fract(uTime * 13.7) * 431.0) - 0.5;
  c += g * uGrain * (0.35 + 0.65 * (1.0 - dot(c, vec3(0.333))));
  c += (hash12(gl_FragCoord.xy * 1.7) - 0.5) / 255.0;
  c *= 1.0 - uFade;
  fragColor = vec4(max(c, 0.0), 1.0);
}
`;
