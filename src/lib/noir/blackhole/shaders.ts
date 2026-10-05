/**
 * GLSL ES 3.0 sources for the NOIR black-hole renderer (see docs/research/noir/BLACK_HOLE_REBUILD.md).
 *
 * Units: Schwarzschild radius rs = 1. Light rays are integrated as null geodesics written as a central
 * force, x'' = −1.5 h² x / |x|⁵ with h = |x × x'| conserved, which reproduces the Schwarzschild orbit
 * equation u'' + u = 1.5 u². The scheme is velocity Verlet with a step that shrinks near the photon
 * sphere; tests/qa-geodesic.mjs checks it against a converged RK4 reference (capture boundary within
 * 0.2 % of 3√3/2, deflection within 0.2° for the step policy below).
 *
 * Each ray also carries two ray differentials (the change of position/velocity per screen pixel in x and
 * y), integrated with the linearised equation. Where the ray meets gas, those differentials give the true
 * footprint of the pixel — including lensing magnification near the shadow and the extreme
 * demagnification of the higher-order images — and the gas texture is filtered with textureGrad, so
 * sub-pixel structure averages out instead of glittering.
 *
 * The accretion disk is a slab of finite thickness (Gaussian vertical profile, H = thickness · r) with a
 * continuous density field; each segment of the ray that passes through the slab is sub-sampled and
 * integrated front-to-back with emission and absorption (radiance is integrated, not alpha-blended).
 */

export const FULLSCREEN_VERT = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

/**
 * One-off bake of the tileable gas field (512², RGBA8, then mipmapped). Periodic gradient noise with an
 * integer hash, so the result is identical on every load for a given seed:
 *   R  large-scale fBm (masses and voids)        G  medium fBm (turbulence, local temperature)
 *   B  ridged multi-octave noise (filaments)     A  low-frequency fBm (domain warp)
 */
export const BAKE_FRAG = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
in vec2 vUv;
out vec4 fragColor;
uniform uint uSeed;

uint hash(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v.x ^ v.y ^ v.z;
}
vec2 grad(ivec2 c, int period, uint layer) {
  ivec2 w = ((c % period) + period) % period;
  uint h = hash(uvec3(uint(w.x), uint(w.y), uSeed * 131u + layer));
  float a = float(h & 65535u) / 65535.0 * 6.2831853;
  return vec2(cos(a), sin(a));
}
// periodic gradient (Perlin-style) noise in [-1, 1], period cells across the unit square
float pnoise(vec2 uv, int period, uint layer) {
  vec2 p = uv * float(period);
  ivec2 i = ivec2(floor(p));
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float n00 = dot(grad(i, period, layer), f);
  float n10 = dot(grad(i + ivec2(1, 0), period, layer), f - vec2(1.0, 0.0));
  float n01 = dot(grad(i + ivec2(0, 1), period, layer), f - vec2(0.0, 1.0));
  float n11 = dot(grad(i + ivec2(1, 1), period, layer), f - vec2(1.0, 1.0));
  return mix(mix(n00, n10, u.x), mix(n01, n11, u.x), u.y) * 1.414;
}
// Gradient noise is exactly zero on its lattice, and octaves that double the period share the coarse
// lattice points: without an offset every tile carries a regular grid of calm points, which read as straight
// moiré lines across a face-on disk. Each octave is shifted by an irrational-looking fraction of a cell
// (a translation keeps the tiling intact).
vec2 octShift(int o) { return vec2(0.3719, 0.6143) * float(o + 1); }
float fbm(vec2 uv, int base, int octaves, uint layer) {
  float s = 0.0, a = 0.5, n = 0.0;
  int period = base;
  for (int o = 0; o < 8; o++) {
    if (o >= octaves) break;
    s += a * pnoise(uv + octShift(o) / float(period), period, layer + uint(o) * 7u);
    n += a;
    a *= 0.5;
    period *= 2;
  }
  return s / n;
}
float ridged(vec2 uv, int base, int octaves, uint layer) {
  float s = 0.0, a = 0.6, n = 0.0, prev = 1.0;
  int period = base;
  for (int o = 0; o < 6; o++) {
    if (o >= octaves) break;
    float r = 1.0 - abs(pnoise(uv + octShift(o) / float(period), period, layer + uint(o) * 11u));
    r = r * r * r;
    s += a * r * prev;
    n += a;
    prev = clamp(r * 1.6, 0.0, 1.0);
    a *= 0.55;
    period *= 2;
  }
  return s / n;
}
void main() {
  vec2 uv = vUv;
  float big = fbm(uv, 4, 6, 1u);
  float med = fbm(uv, 8, 5, 101u);
  float fil = ridged(uv, 8, 4, 201u);
  float warp = fbm(uv, 2, 4, 301u);
  fragColor = vec4(
    clamp(big * 0.9 + 0.5, 0.0, 1.0),
    clamp(med * 0.9 + 0.5, 0.0, 1.0),
    clamp(fil * 1.35, 0.0, 1.0),
    clamp(warp * 0.9 + 0.5, 0.0, 1.0)
  );
}
`;

export const TRACE_FRAG = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2D;

in vec2 vUv;
out vec4 fragColor;

uniform vec2 uRes;
uniform float uTime;       // simulation time (s); drives the gas only, never the camera
uniform vec3 uCamPos;
uniform mat3 uCamBasis;    // columns: right, up, forward
uniform float uTanHalfFov;
uniform sampler2D uGas;    // baked tileable gas field, mipmapped + anisotropic
uniform int uSteps;        // integration step budget (quality tier, independent of resolution)
uniform int uSlab;         // max samples per ray segment inside the slab (quality tier)
uniform int uAbl;          // development ablation bitmask (0 in production): 1 no fade-to-mean,
                           // 2 no aniso bound, 4 no march-step fold, 8 no vertical shear of the field
uniform int uDebug;        // 0 beauty, 1 unlit density, 2 capture/escape/unresolved, 3 flow markers,
                           // ablation: 4 no streaks, 5 no knots, 6 single advection phase, 7 no texture

// material (GasLook in scenes.ts documents units and ranges)
uniform float uDiskIn;
uniform float uDiskOut;
uniform float uThick;
uniform float uGain;
uniform float uFalloff;
uniform float uOpacity;
uniform float uDoppler;
uniform float uOrbit;
uniform float uDrift;
uniform float uWarp;
uniform float uFil;
uniform float uClump;
uniform float uPlunge;
uniform float uPeriod;
uniform float uHeat;
uniform vec3 uC0;          // white-hot   (linear RGB)
uniform vec3 uC1;          // champagne
uniform vec3 uC2;          // copper
uniform vec3 uC3;          // umber
uniform float uStarGain;
uniform vec4 uGasMean;     // per-channel mean / std of the baked field (exact, read back after the bake)
uniform vec4 uGasStd;

const float TAU = 6.28318531;
const float PI = 3.14159265;

// ---- geodesic -----------------------------------------------------------------------------------------

float stepSize(float r) {
  return clamp(0.07 * r * (0.35 + 0.65 * smoothstep(1.5, 4.0, r)), 0.008, 1.6);
}
vec3 accel(vec3 p, float h2) {
  float r2 = dot(p, p);
  return -1.5 * h2 * p / (r2 * r2 * sqrt(r2));
}
// linearised acceleration for a ray differential (dp; dh2 = change of h² for the neighbouring ray)
vec3 daccel(vec3 p, vec3 dp, float h2, float dh2) {
  float r2 = dot(p, p);
  float ir5 = 1.0 / (r2 * r2 * sqrt(r2));
  return -1.5 * (dh2 * p * ir5 + h2 * dp * ir5 - 5.0 * h2 * p * dot(p, dp) * ir5 / r2);
}

// ---- background ---------------------------------------------------------------------------------------

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
vec3 starfield(vec3 d) {
  vec3 col = vec3(0.0);
  for (int layer = 0; layer < 2; layer++) {
    float scale = layer == 0 ? 110.0 : 260.0;
    vec3 p = d * scale;
    vec3 id = floor(p);
    vec3 f = fract(p) - 0.5;
    float h = hash13(id + float(layer) * 19.7);
    if (h > (layer == 0 ? 0.9935 : 0.997)) {
      vec3 o = vec3(hash13(id + 3.1), hash13(id + 7.7), hash13(id + 11.3)) - 0.5;
      float s = 1.0 - smoothstep(0.0, 0.1, length(f - o * 0.6));
      float tint = hash13(id + 5.5);
      col += s * mix(vec3(1.0, 0.88, 0.74), vec3(0.78, 0.86, 1.0), tint) * (0.25 + 1.6 * pow(h, 60.0));
    }
  }
  return col * uStarGain;
}

// ---- gas ----------------------------------------------------------------------------------------------

vec3 palette(float t) {
  // t ≈ 1 at the hot inner edge; > 1 for beamed-up gas. White-hot → champagne → copper → umber → dark.
  vec3 c = mix(vec3(0.0), uC3, smoothstep(0.02, 0.22, t));
  c = mix(c, uC2, smoothstep(0.2, 0.45, t));
  c = mix(c, uC1, smoothstep(0.42, 0.72, t));
  c = mix(c, uC0, smoothstep(0.7, 1.05, t));
  return c;
}

// Footprint with a bounded aspect ratio (4:1, matching the sampler's anisotropy cap). Lensed images near
// the shadow are compressed far beyond what anisotropic filtering covers, and high anisotropy was also the
// dominant cost (~8.5 ms per fine-layer fetch at 16:1); the minor axis is widened instead (slightly softer
// along a streak, never aliased across it).
void boundAniso(inout vec2 gx, inout vec2 gy) {
  float lx = length(gx), ly = length(gy);
  const float MAXA = 4.0;
  if (lx > MAXA * ly) {
    vec2 n = ly > 1e-12 ? gy / ly : vec2(-gx.y, gx.x) / max(lx, 1e-12);
    gy = n * (lx / MAXA);
  } else if (ly > MAXA * lx) {
    vec2 n = lx > 1e-12 ? gx / lx : vec2(-gy.y, gy.x) / max(ly, 1e-12);
    gx = n * (ly / MAXA);
  }
}

// Density and local heat at q. fx/fy are the pixel footprint vectors at q (world space, from the ray
// differentials); along is the march step along the ray.
// The texture lives in co-moving coordinates of the flow: u = (φ − Ω·age)/2π, s = ln r + v_s·age.
// Increasing age moves a fixed texture feature to larger φ (orbit) and to smaller r (inflow). Three
// overlapping phases of age, weighted sin² (their weights sum to a constant), are blended with variance
// normalisation so contrast never pulses; the shear accumulated within one phase is what stretches clumps
// into streaks along the orbit.
vec2 gasAt(vec3 q, vec3 fx, vec3 fy, vec3 along, out float heatOut) {
  heatOut = 0.0;
  float r = length(q.xz);
  float edge = smoothstep(uDiskIn - 0.15, uDiskIn + 0.55, r);
  float outer = 1.0 - smoothstep(uDiskOut * 0.45, uDiskOut, r);
  // infalling streams inside the stable disk's edge, fading out towards the horizon
  float plunge = (1.0 - edge) * smoothstep(1.2, uDiskIn, r) * uPlunge;
  float env = edge * outer + plunge;
  if (env <= 1e-4) return vec2(0.0);
  // Cheap exit before any texture fetch: even the thickest local slab (H ≤ 1.6·thickness·r) has
  // negligible density this far from the mid-plane. Most march samples in the tenuous envelope end here.
  float hMax = uThick * r * 1.6;
  if (q.y * q.y > 6.5 * hMax * hMax) return vec2(0.0);

  float phi = atan(q.z, q.x);
  float lnr = log(r);
  float ir2 = 1.0 / (r * r);
  vec2 gu = vec2(-q.z, q.x) * ir2 / TAU;   // ∂u/∂(x, z)
  vec2 gs = q.xz * ir2;                      // ∂s/∂(x, z)
  vec2 dX = vec2(dot(gu, fx.xz), dot(gs, fx.xz));
  vec2 dY = vec2(dot(gu, fy.xz), dot(gs, fy.xz));
  // the step along the ray is part of what one sample stands for: fold it into the footprint (replacing
  // the shorter axis when it is longer) so detail finer than the march spacing is filtered, not skipped
  vec2 dZ = 0.5 * vec2(dot(gu, along.xz), dot(gs, along.xz));
  if ((uAbl & 4) == 0 && dot(dZ, dZ) > min(dot(dX, dX), dot(dY, dY))) {
    if (dot(dX, dX) < dot(dY, dY)) dX = dZ;
    else dY = dZ;
  }
  if ((uAbl & 2) == 0) boundAniso(dX, dY);

  float omega = uOrbit * pow(r, -1.5);
  // inflow in e-folds of radius per second: slow in the disk, much faster once gas plunges
  float vs = uDrift * pow(uDiskIn / r, 1.5) * (1.0 + 5.0 * (1.0 - edge));

  // Visible feature counts = tile scale × the bake's own base frequency (cells per tile: R 4, G 8, B 8,
  // A 2). Earlier scales ignored that factor and put ~300–500 features per e-fold of radius into the
  // mottling and filament layers: sub-pixel at hero size, so they read as sand or were filtered away,
  // while only the soft blob layers survived. Counts are now sized for what a hero pixel can carry:
  const vec2 SA = vec2(2.0, 1.0);    // masses (R) + warp (A): ~8 per revolution, ~4 per e-fold (integer per revolution: seamless at φ = ±π)
  const vec2 SS = vec2(1.0, 8.0);    // streaks (B, ridged): ~64 per e-fold across, ~50:1 along the orbit
  const vec2 SK = vec2(8.0, 12.0);   // clumps (G): ~64 per revolution × ~96 per e-fold, ~9:1 along the orbit
  float fadeA = 1.0 - smoothstep(0.12, 0.45, max(length(dX * SA), length(dY * SA)));
  float fadeS = 1.0 - smoothstep(0.12, 0.45, max(length(dX * SS), length(dY * SS)));
  float fadeK = 1.0 - smoothstep(0.12, 0.45, max(length(dX * SK), length(dY * SK)));
  if ((uAbl & 1) != 0) { fadeA = 1.0; fadeS = 1.0; fadeK = 1.0; }
  // vertical layering: the field shears slightly with height, so the slab has 3D structure (cloud tops,
  // overhangs) rather than one extruded 2D pattern
  float zeta = (uAbl & 8) != 0 ? 0.0 : q.y / (uThick * r);
  vec3 acc = vec3(0.0);
  float wsum = 0.0, wsum2 = 0.0;
  // A phase lives for a fixed fraction of the local orbital period (T ∝ r^1.5), so every radius
  // accumulates the same shear per phase and overlapping phases carry streaks at the same tilt. Wraps
  // happen where a phase's weight is zero, so the field stays continuous across radius and time.
  float period = uPeriod * clamp(pow(r / uDiskIn, 1.5), 0.35, 12.0);
  for (int k = 0; k < 3; k++) {
    float ph = fract(uTime / period + float(k) / 3.0);
    float age = ph * period;
    float w = sin(PI * ph);
    w *= w;
    if (uDebug == 6) { if (k > 0) break; age = 0.5 * period; w = 1.0; }
    vec2 c = vec2((phi - omega * age) / TAU + float(k) * 0.371, lnr + vs * age + float(k) * 0.237);
    vec4 A = textureGrad(uGas, (c + vec2(zeta * 0.01, zeta * 0.03)) * SA, dX * SA, dY * SA);
    // domain warp (mostly across the orbit, several streak spacings) so streaks meander, merge and part
    vec2 wv = (vec2(A.a, A.r) - uGasMean.ar) / uGasStd.ar * uWarp * vec2(0.006, 0.018);
    vec2 cw = c + wv;
    float S = uDebug == 4 ? uGasMean.b : textureGrad(uGas, cw * SS, dX * SS, dY * SS).b;
    float K = uDebug == 5 ? uGasMean.g : textureGrad(uGas, (cw + vec2(0.0, zeta * 0.004)) * SK + vec2(0.31, 0.17), dX * SK, dY * SK).g;
    acc += w * vec3(A.r, S, K);
    wsum += w;
    wsum2 += w * w;
  }
  // z-scores of the phase blend (variance-normalised, so contrast does not pulse with the phase mix)
  float wn = inversesqrt(wsum2);  // Σ w = 1.5 always (sin² over three phases a third apart)
  vec3 z = (acc - wsum * vec3(uGasMean.r, uGasMean.b, uGasMean.g)) * wn / vec3(uGasStd.r, uGasStd.b, uGasStd.g);
  if (uDebug == 7) z = vec3(0.0);   // ablation: no texture at all (pure geometry)

  // Contrast curves, each faded to its own expectation under a unit normal (computed once:
  // E[streak] = 0.289, E[knot] = 0.174, E[mass] = 0.5) once the pixel footprint covers its features, so
  // filtering keeps brightness constant instead of pulling everything towards one grey.
  float streak = mix(0.289, smoothstep(-0.3, 1.5, z.y), fadeS);
  float knot = mix(0.258, smoothstep(-0.2, 1.6, z.z), fadeK);
  float mass = mix(0.5, clamp(0.5 + 0.25 * z.x, 0.0, 1.0), fadeA);

  // local thickness follows the masses (a gently bumpy surface); Gaussian vertical profile
  float H = uThick * r * clamp(0.55 + 0.9 * (mass - 0.5) + 0.25 * knot, 0.25, 1.6);
  float vert = exp(-2.0 * (q.y * q.y) / (H * H));
  // Dark lanes are genuinely thin gas (density ~6 % of a filament), so they read as gaps rather than
  // being averaged into haze; filaments and knots carry the density and, hotter, the light.
  float fil = mix(1.0, streak, uFil);
  // Streaks and clumps add rather than multiply: a product chops every long filament into short dashes
  // at the clump spacing, which read as hair (proved by ablating either layer). Mean body ≈ 0.34.
  float body = (0.03 + 0.4 * fil + 0.65 * knot + 0.35 * fil * knot) * mix(1.0, 0.55 + 0.9 * mass, uClump);
  heatOut = 0.42 + 0.4 * fil + 0.6 * knot + 0.3 * (mass - 0.5);
  // surface density falls with radius (the outer disk is more tenuous, so lensed light behind it shows
  // through)
  float sigma = pow(uDiskIn / max(r, uDiskIn), 0.9);
  return vec2(env * sigma * vert * body, edge);
}

// Integrates the slab along the segment p0 → p1 (dir = backward ray direction), accumulating radiance into
// col and transmittance into tr. Emission j and absorption k per unit length; exact for piecewise-constant
// samples: Δcol = tr · j · (1 − e^{−kΔs}) / k. The march is adaptive: about a third of an optical depth per
// step in dense gas (so the visible surface is resolved), up to half the envelope height in the tenuous
// fringe, and it stops once the gas is opaque. Each sample is filtered with its true pixel footprint (the
// ray differentials at that point) extended by the step along the ray.
void slab(vec3 p0, vec3 p1, vec3 dir, vec3 fx0, vec3 fx1, vec3 fy0, vec3 fy1, inout vec3 col, inout float tr) {
  float r0 = length(p0.xz), r1 = length(p1.xz);
  float rmax = max(r0, r1);
  float hm = uThick * rmax * 3.2 + 0.03;   // envelope that contains the thickest local slab
  if ((p0.y > hm && p1.y > hm) || (p0.y < -hm && p1.y < -hm)) return;
  if (min(r0, r1) > uDiskOut * 1.05 || rmax < 1.2) return;
  float dy = p1.y - p0.y;
  float t0 = 0.0, t1 = 1.0;
  if (abs(dy) > 1e-7) {
    float ta = (hm - p0.y) / dy, tb = (-hm - p0.y) / dy;
    t0 = max(0.0, min(ta, tb));
    t1 = min(1.0, max(ta, tb));
  }
  if (t1 <= t0) return;
  float L = length(p1 - p0);
  // Steps must resolve the vertical profile where the ray crosses it steeply: at most a third of the local
  // (thinnest) thickness per unit of vertical travel. Without this, steep lensed crossings of the thin
  // inner slab undersample the Gaussian and alias into concentric fringes (proved with texture off).
  float hThin = uThick * min(r0, r1) * 0.35 + 0.004;
  float dsMax = min(hm * 0.5, 0.33 * hThin / max(abs(dir.y), 0.04));
  float dsMin = max(0.0035 * rmax, 0.008);
  float ds = dsMax;
  float tc = t0;
  vec3 vdirSign = vec3(sign(uOrbit));
  for (int j = 0; j < 64; j++) {
    if (j >= uSlab || tc >= t1) break;
    float tn = min(tc + ds / L, t1);
    float dsw = (tn - tc) * L;
    float t = 0.5 * (tc + tn);
    tc = tn;
    vec3 q = mix(p0, p1, t);
    vec3 fx = mix(fx0, fx1, t), fy = mix(fy0, fy1, t);
    float heat;
    vec2 g = gasAt(q, fx, fy, dir * dsw, heat);
    float rho = g.x;
    float k = uOpacity * rho;
    ds = clamp(0.33 / (k + 0.33 / dsMax), dsMin, dsMax);
    if (rho < 1e-4) continue;
    float r = length(q.xz);

    vec3 j3;
    if (uDebug == 1) {
      j3 = vec3(rho * 0.9);
    } else {
      // relativistic beaming of a Keplerian flow (static-frame speed β = √(M/(r−2M)), M = ½)
      vec3 vdir = normalize(vec3(-q.z, 0.0, q.x)) * vdirSign;
      float beta = clamp(sqrt(0.5 / max(r - 1.0, 0.08)), 0.0, 0.62);
      float gamma = inversesqrt(1.0 - beta * beta);
      float D = 1.0 / (gamma * (1.0 + beta * dot(vdir, dir)));
      float gr = sqrt(max(1.0 - 1.0 / r, 0.0));
      float gfac = D * gr;
      float temp = uHeat * pow(uDiskIn / max(r, 1.25), 0.85) * heat * mix(1.0, pow(gfac, 0.7), uDoppler);
      float emiss = uGain * pow(uDiskIn / max(r, 1.2), uFalloff) * mix(1.0, pow(gfac, 4.0), uDoppler);
      // plunging gas is dimmer: below the edge, emission falls with the gravitational redshift
      emiss *= mix(gr, 1.0, g.y);
      // Emissivity per unit density rises steeply with local heat. In optically thick gas the visible
      // brightness is emission ÷ absorption, so density alone cancels out: hot masses must out-shine the
      // cooler, absorbing lanes between them for the band to read as lumpy gas rather than a smooth sheet.
      // (exponent 2.2 rather than 3: with D⁴ beaming on top, a cubic made single hot clumps passing the
      // approaching side flare the whole frame by ~20 % within half a second)
      j3 = palette(temp) * emiss * rho * pow(heat, 2.2);
      if (uDebug == 3) {
        // flow markers: knots fixed in the flow's co-moving frame (continuous advection, no phases)
        float om = uOrbit * pow(r, -1.5);
        float vs = uDrift * pow(uDiskIn / r, 1.5);
        float u0 = (atan(q.z, q.x) - om * uTime) / TAU;
        float s0 = log(r) + vs * uTime;
        vec2 cell = fract(vec2(u0 * 12.0, s0 * 3.0)) - 0.5;
        j3 += vec3(0.0, 4.0, 1.0) * (1.0 - smoothstep(0.05, 0.12, length(cell * vec2(1.0, 2.0)))) * rho;
      }
    }
    float tau = k * dsw;
    float att = exp(-tau);
    col += tr * j3 * (tau > 1e-4 ? (1.0 - att) / k : dsw);
    tr *= att;
    if (tr < 0.003) return;
  }
}

void main() {
  vec2 ndc = (gl_FragCoord.xy / uRes) * 2.0 - 1.0;
  float aspect = uRes.x / uRes.y;
  vec2 uv = vec2(ndc.x * aspect, ndc.y);
  float pix = 2.0 / uRes.y;
  vec3 rd = normalize(uCamBasis * vec3(uv * uTanHalfFov, 1.0));
  vec3 rdx = normalize(uCamBasis * vec3((uv + vec2(pix, 0.0)) * uTanHalfFov, 1.0)) - rd;
  vec3 rdy = normalize(uCamBasis * vec3((uv + vec2(0.0, pix)) * uTanHalfFov, 1.0)) - rd;

  vec3 p = uCamPos;
  vec3 v = rd;
  vec3 hv = cross(p, v);
  float h2 = dot(hv, hv);
  // differentials: the camera is a point, so only the direction differs between neighbouring pixels
  vec3 dpx = vec3(0.0), dvx = rdx, dpy = vec3(0.0), dvy = rdy;
  float dh2x = 2.0 * dot(hv, cross(p, dvx));
  float dh2y = 2.0 * dot(hv, cross(p, dvy));
  vec3 a = accel(p, h2);
  vec3 dax = vec3(0.0), day = vec3(0.0);

  vec3 col = vec3(0.0);
  float tr = 1.0;
  int state = 0;   // 0 unresolved, 1 captured, 2 escaped, 3 opaque

  for (int i = 0; i < 600; i++) {
    if (i >= uSteps) break;
    float r = length(p);
    float dt = stepSize(r);
    float hdt2 = 0.5 * dt * dt;
    vec3 p1 = p + v * dt + a * hdt2;
    vec3 dpx1 = dpx + dvx * dt + dax * hdt2;
    vec3 dpy1 = dpy + dvy * dt + day * hdt2;
    vec3 a1 = accel(p1, h2);
    vec3 dax1 = daccel(p1, dpx1, h2, dh2x);
    vec3 day1 = daccel(p1, dpy1, h2, dh2y);
    vec3 v1 = v + 0.5 * (a + a1) * dt;
    dvx += 0.5 * (dax + dax1) * dt;
    dvy += 0.5 * (day + day1) * dt;

    slab(p, p1, normalize(v1), dpx, dpx1, dpy, dpy1, col, tr);

    p = p1; v = v1; a = a1;
    dpx = dpx1; dpy = dpy1; dax = dax1; day = day1;
    if (tr < 0.003) { state = 3; break; }
    if (dot(p, p) < 1.0) { state = 1; break; }
    if (r > 60.0 && dot(p, v) > 0.0) { state = 2; break; }
  }

  // Rays still bound after the budget have wound around the photon sphere: they sit within a hair of the
  // critical curve and are treated as captured (their higher-order images are sub-pixel thin).
  if (state == 0 && length(p) < 8.0) state = 1;
  if (state == 2 || state == 0) col += tr * starfield(normalize(v));

  if (uDebug == 2) {
    vec3 s = state == 1 ? vec3(0.6, 0.05, 0.05) : state == 2 ? vec3(0.05, 0.35, 0.08) : state == 3 ? vec3(0.4, 0.4, 0.4) : vec3(0.1, 0.2, 1.0);
    col = s + col * 0.15;
  }
  fragColor = vec4(col, 1.0);
}
`;

/**
 * Bright-pass + 4-tap downsample (first bloom level), soft knee. Taps are Karis-averaged (weight
 * 1/(1+luma)) and capped, so a few extreme HDR pixels near the white-hot junction cannot make the whole
 * bloom/veil breathe from frame to frame as the gas moves (measured: clipped-pixel count swung 23→173
 * while mean scene brightness stayed within ±5 %).
 */
export const PREFILTER_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uThreshold;
const float CAP = 12.0;
vec3 tap(vec2 o, out float w) {
  vec3 c = texture(uSrc, vUv + o * uTexel).rgb;
  float l = max(c.r, max(c.g, c.b));
  c *= min(1.0, CAP / max(l, 1e-4));
  w = 1.0 / (1.0 + max(c.r, max(c.g, c.b)));
  return c * w;
}
void main() {
  float w0, w1, w2, w3;
  vec3 sum = tap(vec2(-1.0, -1.0), w0) + tap(vec2(1.0, -1.0), w1) + tap(vec2(-1.0, 1.0), w2) + tap(vec2(1.0, 1.0), w3);
  vec3 c = sum / (w0 + w1 + w2 + w3);
  float br = max(c.r, max(c.g, c.b));
  float knee = uThreshold * 0.7;
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

/**
 * Final composite, linear HDR in → display out: bloom, exposure, ACES (Narkowicz fit) with a small
 * hue-preserving share, exact sRGB encoding, vignette, luminance-proportional grain (keeps blacks black)
 * and 8-bit dither. uView: 0 beauty, 1 no bloom, 2 false-colour log2 radiance (pre-tonemap).
 */
export const COMPOSITE_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform sampler2D uVeilTex;  // coarsest bloom level: a very wide, smooth blur of the bright gas
uniform float uExposure;
uniform float uBloomGain;
uniform float uVeil;
uniform float uFade;       // 0 → scene, 1 → black (crossing the horizon)
uniform float uTime;
uniform float uGrain;
uniform float uHueKeep;
uniform int uView;
uniform vec2 uRes;
uniform vec2 uSrcRes;      // size of the traced scene buffer (upsampled here to uRes)

// Catmull-Rom (bicubic) upsampling in 9 bilinear taps: far crisper than the browser stretching a small
// canvas bilinearly, and it keeps thin filaments and the photon ring from smearing when the traced
// buffer is below output resolution. Clamped at 0 (HDR ringing at the shadow edge).
vec3 catmullRom(sampler2D tex, vec2 uv, vec2 size) {
  vec2 sp = uv * size;
  vec2 t1 = floor(sp - 0.5) + 0.5;
  vec2 f = sp - t1;
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
  vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
  vec2 w3 = f * f * (-0.5 + 0.5 * f);
  vec2 w12 = w1 + w2;
  vec2 t0 = (t1 - 1.0) / size, t3 = (t1 + 2.0) / size, t12 = (t1 + w2 / w12) / size;
  vec3 c = vec3(0.0);
  c += texture(tex, vec2(t0.x, t0.y)).rgb * w0.x * w0.y;
  c += texture(tex, vec2(t12.x, t0.y)).rgb * w12.x * w0.y;
  c += texture(tex, vec2(t3.x, t0.y)).rgb * w3.x * w0.y;
  c += texture(tex, vec2(t0.x, t12.y)).rgb * w0.x * w12.y;
  c += texture(tex, vec2(t12.x, t12.y)).rgb * w12.x * w12.y;
  c += texture(tex, vec2(t3.x, t12.y)).rgb * w3.x * w12.y;
  c += texture(tex, vec2(t0.x, t3.y)).rgb * w0.x * w3.y;
  c += texture(tex, vec2(t12.x, t3.y)).rgb * w12.x * w3.y;
  c += texture(tex, vec2(t3.x, t3.y)).rgb * w3.x * w3.y;
  return max(c, vec3(0.0));
}

vec3 aces(vec3 x) {
  const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}
vec3 srgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec3 heat(float t) {
  return clamp(vec3(1.5 - abs(4.0 * t - 3.0), 1.5 - abs(4.0 * t - 2.0), 1.5 - abs(4.0 * t - 1.0)), 0.0, 1.0);
}
void main() {
  vec3 scene = uSrcRes.x < uRes.x - 0.5 ? catmullRom(uScene, vUv, uSrcRes) : texture(uScene, vUv).rgb;
  vec3 bloom = texture(uBloom, vUv).rgb;
  if (uView == 2) {
    float l = dot(scene, vec3(0.2126, 0.7152, 0.0722));
    fragColor = vec4(heat(clamp((log2(max(l, 1e-5)) + 10.0) / 14.0, 0.0, 1.0)), 1.0);
    return;
  }
  vec3 veil = texture(uVeilTex, vUv).rgb;
  // uView: 1 no bloom + no veil, 3 no veil, 4 no bloom (veil kept)
  vec3 post = (uView == 1 ? vec3(0.0) : (uView == 4 ? vec3(0.0) : bloom * uBloomGain) + (uView == 3 ? vec3(0.0) : veil * uVeil));
  vec3 c = (scene + post) * uExposure;
  float peak = max(c.r, max(c.g, c.b));
  vec3 hueKeep = c * (aces(vec3(peak)).r / max(peak, 1e-5));
  c = mix(aces(c), hueKeep, uHueKeep);
  c = srgb(c);
  vec2 q = vUv - 0.5;
  c *= 1.0 - smoothstep(0.4, 1.0, length(q * vec2(1.0, 1.15))) * 0.45;
  float g = hash12(gl_FragCoord.xy + fract(uTime * 13.7) * 431.0) - 0.5;
  c *= 1.0 + g * uGrain;
  c += (hash12(gl_FragCoord.xy * 1.7) - 0.5) / 255.0;
  c *= 1.0 - uFade;
  fragColor = vec4(max(c, 0.0), 1.0);
}
`;
