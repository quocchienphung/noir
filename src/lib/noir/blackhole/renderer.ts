import { envRotation, type EnvironmentLook } from "./environment";
import { BAKE_FRAG, COMPOSITE_FRAG, DOWN_FRAG, FULLSCREEN_VERT, PREFILTER_FRAG, TRACE_ENV_FRAG, TRACE_FRAG, UP_FRAG } from "./shaders";

type Vec3 = [number, number, number];

/**
 * Material of the accretion flow. Units: Schwarzschild radius rs = 1, simulation seconds. Colours are
 * linear RGB. The same model drives every scene; scenes differ only by camera and a few look values.
 */
export interface GasLook {
  /** Inner edge of the stable disk, rs (the Schwarzschild ISCO is 3 rs). Range 2.4–4. */
  inner: number;
  /** Radius where the disk has faded out, rs. Range 10–30. */
  outer: number;
  /** Gaussian half-thickness H as a fraction of radius (H = thickness · r). Range 0.01–0.08. */
  thickness: number;
  /** Emission scale, linear HDR units. */
  gain: number;
  /** Emissivity ∝ (inner / r)^falloff. Range 1–3. */
  falloff: number;
  /** Absorption per unit density per rs; higher → more opaque, darker voids show. Range 0–3. */
  opacity: number;
  /** Mix of relativistic beaming D⁴ and the matching colour shift, 0–1. */
  doppler: number;
  /** Orbital angular speed scale: Ω = orbit · r^−1.5 rad/s. Sign sets the sense of rotation. */
  orbit: number;
  /** Inflow at the inner edge, e-folds of radius per second (∝ r^−1.5, ×6 inside the edge). Range 0–0.05. */
  drift: number;
  /** Domain-warp strength (meandering of streaks), 0–2. */
  warp: number;
  /** Filament contrast, 0–1. */
  filaments: number;
  /** Clumping: 0 smooth, 1 strong masses and voids. */
  clumping: number;
  /** Density of infalling streams inside the inner edge relative to the disk, 0–0.6. */
  plunge: number;
  /** Lifetime of one advected texture phase, s (three overlapping phases). Range 8–40. */
  period: number;
  /** Temperature scale feeding the palette (1 = hot inner edge reads white-hot). */
  heat: number;
  /** White-hot, champagne, copper, umber. */
  palette: [Vec3, Vec3, Vec3, Vec3];
}

export interface Quality {
  /** Geodesic step budget (independent of resolution). */
  steps: number;
  /** Max samples per ray segment through the gas slab. */
  slab: number;
}

export interface FrameParams {
  camPos: Vec3;
  /** Column-major 3×3 basis: right, up, forward. */
  basis: Float32Array;
  tanHalfFov: number;
  time: number;
  quality: Quality;
  gas: GasLook;
  exposure: number;
  bloomGain: number;
  bloomThreshold: number;
  fade: number;
  grain: number;
  hueKeep: number;
  /** Wide optical veil (coarsest bloom level) gain: the soft haze that lifts space around bright gas. */
  veil: number;
  starGain: number;
  /**
   * Background environment at infinity (environment.ts). Absent or `enabled: false` → the accepted star
   * background, unchanged. Only escaped rays see it, through their remaining transmittance.
   */
  environment?: EnvironmentLook;
  /** 0 beauty, 1 unlit density, 2 capture/escape/unresolved, 3 flow markers. */
  debug?: number;
  /** 0 beauty, 1 no bloom + veil, 2 false-colour radiance, 3 no veil, 4 no bloom. */
  view?: number;
  /** Development ablation bitmask (see TRACE_FRAG uAbl). */
  ablate?: number;
}

interface Target {
  fb: WebGLFramebuffer;
  tex: WebGLTexture;
  w: number;
  h: number;
}

type Uniforms = Record<string, WebGLUniformLocation | null>;

interface Program {
  prog: WebGLProgram;
  u: Uniforms;
}

const BLOOM_LEVELS = 7;
const GAS_SIZE = 512;
/** Fixed seed: the gas field (and so the disk) is identical on every load. */
export const GAS_SEED = 0x6e6f6972; // "noir"

const TRACE_UNIFORMS = [
  "uRes", "uTime", "uCamPos", "uCamBasis", "uTanHalfFov", "uGas", "uSteps", "uSlab", "uDebug", "uAbl",
  "uDiskIn", "uDiskOut", "uThick", "uGain", "uFalloff", "uOpacity", "uDoppler", "uOrbit", "uDrift",
  "uWarp", "uFil", "uClump", "uPlunge", "uPeriod", "uHeat", "uC0", "uC1", "uC2", "uC3", "uStarGain", "uGasMean", "uGasStd",
  "uEnvGain", "uEnvSrc", "uEnvSrcCol", "uEnvStars", "uEnvDiffuse", "uEnvBand", "uEnvRot", "uEnvSeed",
];

/**
 * WebGL2 renderer: ray-traced Schwarzschild black hole with a volumetric gas slab into an HDR target,
 * seven-level bloom + veil, ACES composite. The caller owns the animation loop and passes a complete camera /
 * look description per frame. All GPU resources are created once (and again after a context restore).
 */
export class BlackHoleRenderer {
  readonly gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject;
  private vbo: WebGLBuffer;
  private gasTex: WebGLTexture;
  /** Per-channel mean and standard deviation of the baked gas field (read back once after the bake). */
  private gasMean: [number, number, number, number] = [0.5, 0.5, 0.5, 0.5];
  private gasStd: [number, number, number, number] = [0.15, 0.15, 0.15, 0.15];
  /** Environment source uniforms, reused every frame (no per-frame allocation). */
  private envSrc = new Float32Array(12);
  private envCol = new Float32Array(12);
  private envRot = new Float32Array(9);
  private trace: Program;
  /** Trace program with the environment compiled in (NOIR_ENV), created on first use. */
  private traceEnv: Program | null = null;
  private prefilter: Program;
  private down: Program;
  private up: Program;
  private composite: Program;
  private scene: Target | null = null;
  private bloom: Target[] = [];
  private hdr: boolean;
  /** GPU frame timing (EXT_disjoint_timer_query_webgl2), when the browser exposes it. */
  private timer: { ext: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number }; pending: WebGLQuery[]; samples: number[] } | null = null;
  /** Ray-traced (scene) buffer size. */
  width = 0;
  height = 0;
  /** Output (canvas drawing buffer) size; the composite upsamples the scene to it with Catmull-Rom. */
  outWidth = 0;
  outHeight = 0;

  static create(canvas: HTMLCanvasElement): BlackHoleRenderer | null {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl) return null;
    try {
      return new BlackHoleRenderer(gl);
    } catch (e) {
      console.warn("[noir] black hole renderer unavailable:", e);
      return null;
    }
  }

  private constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.hdr = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");

    this.trace = this.program(TRACE_FRAG, TRACE_UNIFORMS);
    this.prefilter = this.program(PREFILTER_FRAG, ["uSrc", "uTexel", "uThreshold"]);
    this.down = this.program(DOWN_FRAG, ["uSrc", "uTexel"]);
    this.up = this.program(UP_FRAG, ["uSrc", "uTexel", "uRadius"]);
    this.composite = this.program(COMPOSITE_FRAG, [
      "uScene", "uBloom", "uVeilTex", "uExposure", "uBloomGain", "uVeil", "uFade", "uTime", "uGrain", "uHueKeep", "uView", "uRes", "uSrcRes",
    ]);

    // one oversized triangle covering the viewport
    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    if (!vao || !vbo) throw new Error("buffer allocation failed");
    this.vao = vao;
    this.vbo = vbo;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    this.gasTex = this.bakeGas();
    // GPU timing drives adaptive resolution when the browser exposes it (falls back to frame cadence)
    const ext = gl.getExtension("EXT_disjoint_timer_query_webgl2") as { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null;
    if (ext) this.timer = { ext, pending: [], samples: [] };
  }

  /** Median GPU time of the last frames in ms (needs the timer extension), else null. */
  gpuMs(): number | null {
    const t = this.timer;
    if (!t || t.samples.length < 5) return null;
    const s = [...t.samples].sort((a, b) => a - b);
    return s[s.length >> 1];
  }

  /** Forget timing history (after a resolution change the old samples no longer apply). */
  resetTiming() {
    if (this.timer) this.timer.samples.length = 0;
  }

  private collectTimers() {
    const t = this.timer;
    if (!t) return;
    const gl = this.gl;
    while (t.pending.length) {
      const q = t.pending[0];
      if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break;
      const disjoint = gl.getParameter(t.ext.GPU_DISJOINT_EXT) as boolean;
      const ns = gl.getQueryParameter(q, gl.QUERY_RESULT) as number;
      gl.deleteQuery(q);
      t.pending.shift();
      if (!disjoint) {
        t.samples.push(ns / 1e6);
        if (t.samples.length > 60) t.samples.shift();
      }
    }
  }

  private compile(type: number, src: string) {
    const gl = this.gl;
    const sh = gl.createShader(type);
    if (!sh) throw new Error("shader allocation failed");
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error(`shader compile failed: ${log}`);
    }
    return sh;
  }

  private program(frag: string, uniforms: string[]): Program {
    const gl = this.gl;
    const vs = this.compile(gl.VERTEX_SHADER, FULLSCREEN_VERT);
    const fs = this.compile(gl.FRAGMENT_SHADER, frag);
    const prog = gl.createProgram();
    if (!prog) throw new Error("program allocation failed");
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, "aPos");
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`link failed: ${gl.getProgramInfoLog(prog)}`);
    const u: Uniforms = {};
    for (const name of uniforms) u[name] = gl.getUniformLocation(prog, name);
    return { prog, u };
  }

  /** Renders the tileable gas field once on the GPU, then builds mipmaps (+ anisotropic filtering). */
  private bakeGas() {
    const gl = this.gl;
    const bake = this.program(BAKE_FRAG, ["uSeed"]);
    const tex = gl.createTexture();
    const fb = gl.createFramebuffer();
    if (!tex || !fb) throw new Error("gas texture allocation failed");
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, GAS_SIZE, GAS_SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, GAS_SIZE, GAS_SIZE);
    gl.useProgram(bake.prog);
    gl.uniform1ui(bake.u.uSeed, GAS_SEED);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // Exact channel statistics: the shader works in z-scores and fades filtered detail to each layer's
    // true expectation, so brightness does not shift as features drop below the pixel footprint.
    const px = new Uint8Array(GAS_SIZE * GAS_SIZE * 4);
    gl.readPixels(0, 0, GAS_SIZE, GAS_SIZE, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const sum = [0, 0, 0, 0];
    const sq = [0, 0, 0, 0];
    for (let i = 0; i < px.length; i += 4)
      for (let c = 0; c < 4; c++) {
        const v = px[i + c] / 255;
        sum[c] += v;
        sq[c] += v * v;
      }
    const n = GAS_SIZE * GAS_SIZE;
    for (let c = 0; c < 4; c++) {
      this.gasMean[c] = sum[c] / n;
      this.gasStd[c] = Math.max(1e-3, Math.sqrt(Math.max(0, sq[c] / n - this.gasMean[c] ** 2)));
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb);
    gl.deleteProgram(bake.prog);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) {
      const max = gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number;
      gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, max));
    }
    return tex;
  }

  private target(w: number, h: number): Target {
    const gl = this.gl;
    const tex = gl.createTexture();
    const fb = gl.createFramebuffer();
    if (!tex || !fb) throw new Error("target allocation failed");
    gl.bindTexture(gl.TEXTURE_2D, tex);
    if (this.hdr) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE && this.hdr) {
      // Half-float render targets unsupported after all: fall back to 8-bit.
      this.hdr = false;
      gl.deleteTexture(tex);
      gl.deleteFramebuffer(fb);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return this.target(w, h);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fb, tex, w, h };
  }

  private freeTargets() {
    const gl = this.gl;
    for (const t of [this.scene, ...this.bloom]) {
      if (!t) continue;
      gl.deleteTexture(t.tex);
      gl.deleteFramebuffer(t.fb);
    }
    this.scene = null;
    this.bloom = [];
  }

  /**
   * Output size (device pixels of the canvas) and render scale of the ray-traced buffer. The canvas
   * always runs at output resolution, so the browser never bilinear-stretches a small canvas; the
   * composite upsamples the traced image with a Catmull-Rom filter instead (much crisper).
   */
  resize(outW: number, outH: number, scale = 1) {
    outW = Math.max(16, Math.round(outW));
    outH = Math.max(16, Math.round(outH));
    const w = Math.max(16, Math.round(outW * Math.min(1, scale)));
    const h = Math.max(16, Math.round(outH * Math.min(1, scale)));
    const canvas = this.gl.canvas as HTMLCanvasElement;
    if (outW !== this.outWidth || outH !== this.outHeight) {
      canvas.width = outW;
      canvas.height = outH;
      this.outWidth = outW;
      this.outHeight = outH;
    }
    if (w === this.width && h === this.height && this.scene) return;
    this.width = w;
    this.height = h;
    this.freeTargets();
    this.scene = this.target(w, h);
    let bw = w;
    let bh = h;
    for (let i = 0; i < BLOOM_LEVELS; i++) {
      bw = Math.max(4, Math.floor(bw / 2));
      bh = Math.max(4, Math.floor(bh / 2));
      this.bloom.push(this.target(bw, bh));
    }
  }

  private pass(p: Program, dst: Target | null, w: number, h: number) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.fb : null);
    gl.viewport(0, 0, w, h);
    gl.useProgram(p.prog);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private bind(unit: number, tex: WebGLTexture, loc: WebGLUniformLocation | null) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(loc, unit);
  }

  render(f: FrameParams) {
    const gl = this.gl;
    const scene = this.scene;
    if (!scene || gl.isContextLost()) return;
    gl.disable(gl.BLEND);
    // Fully faded (the dive has crossed the horizon): the composite multiplies everything, dither included,
    // by 1 − fade = 0, so the frame is exactly black. Skip the trace and post entirely; this keeps the
    // overlap with the next scene from doubling GPU work. Pixel-identical (qa-spacetime-diff, hero p 1).
    if (f.fade >= 1) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.outWidth, this.outHeight);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }
    let query: WebGLQuery | null = null;
    if (this.timer && this.timer.pending.length < 4) {
      this.collectTimers();
      query = gl.createQuery();
      if (query) gl.beginQuery(this.timer.ext.TIME_ELAPSED_EXT, query);
    } else this.collectTimers();

    // 1. ray trace (environment off → the accepted program, unchanged)
    const env = f.environment?.enabled ? f.environment : null;
    if (env && !this.traceEnv) this.traceEnv = this.program(TRACE_ENV_FRAG, TRACE_UNIFORMS);
    const t = env && this.traceEnv ? this.traceEnv : this.trace;
    const g = f.gas;
    gl.useProgram(t.prog);
    gl.uniform2f(t.u.uRes, scene.w, scene.h);
    gl.uniform1f(t.u.uTime, f.time);
    gl.uniform3f(t.u.uCamPos, f.camPos[0], f.camPos[1], f.camPos[2]);
    gl.uniformMatrix3fv(t.u.uCamBasis, false, f.basis);
    gl.uniform1f(t.u.uTanHalfFov, f.tanHalfFov);
    gl.uniform1i(t.u.uSteps, f.quality.steps);
    gl.uniform1i(t.u.uSlab, f.quality.slab);
    gl.uniform1i(t.u.uDebug, f.debug ?? 0);
    gl.uniform1i(t.u.uAbl, f.ablate ?? 0);
    gl.uniform1f(t.u.uDiskIn, g.inner);
    gl.uniform1f(t.u.uDiskOut, g.outer);
    gl.uniform1f(t.u.uThick, g.thickness);
    gl.uniform1f(t.u.uGain, g.gain);
    gl.uniform1f(t.u.uFalloff, g.falloff);
    gl.uniform1f(t.u.uOpacity, g.opacity);
    gl.uniform1f(t.u.uDoppler, g.doppler);
    gl.uniform1f(t.u.uOrbit, g.orbit);
    gl.uniform1f(t.u.uDrift, g.drift);
    gl.uniform1f(t.u.uWarp, g.warp);
    gl.uniform1f(t.u.uFil, g.filaments);
    gl.uniform1f(t.u.uClump, g.clumping);
    gl.uniform1f(t.u.uPlunge, g.plunge);
    gl.uniform1f(t.u.uPeriod, g.period);
    gl.uniform1f(t.u.uHeat, g.heat);
    gl.uniform3fv(t.u.uC0, g.palette[0]);
    gl.uniform3fv(t.u.uC1, g.palette[1]);
    gl.uniform3fv(t.u.uC2, g.palette[2]);
    gl.uniform3fv(t.u.uC3, g.palette[3]);
    gl.uniform1f(t.u.uStarGain, f.starGain);
    gl.uniform4fv(t.u.uGasMean, this.gasMean);
    gl.uniform4fv(t.u.uGasStd, this.gasStd);
    if (env) {
      const src = this.envSrc;
      const col = this.envCol;
      src.fill(0);
      col.fill(0);
      env.sources.slice(0, 3).forEach((e, i) => {
        src.set([e.direction[0], e.direction[1], e.direction[2], e.angularSize], i * 4);
        col.set([e.radiance[0], e.radiance[1], e.radiance[2], e.aspect], i * 4);
      });
      gl.uniform1f(t.u.uEnvGain, env.intensity);
      gl.uniform4fv(t.u.uEnvSrc, src);
      gl.uniform4fv(t.u.uEnvSrcCol, col);
      gl.uniform1f(t.u.uEnvStars, env.stars);
      gl.uniform1f(t.u.uEnvDiffuse, env.diffuse);
      gl.uniform3fv(t.u.uEnvBand, env.bandNormal);
      gl.uniformMatrix3fv(t.u.uEnvRot, false, envRotation(env.ambientMapRotation + env.animationRate * f.time, this.envRot));
      gl.uniform1f(t.u.uEnvSeed, env.seed);
    }
    this.bind(0, this.gasTex, t.u.uGas);
    this.pass(t, scene, scene.w, scene.h);

    // 2. bloom: prefilter → downsample chain → additive upsample chain
    const b = this.bloom;
    gl.useProgram(this.prefilter.prog);
    gl.uniform2f(this.prefilter.u.uTexel, 1 / scene.w, 1 / scene.h);
    gl.uniform1f(this.prefilter.u.uThreshold, f.bloomThreshold);
    this.bind(0, scene.tex, this.prefilter.u.uSrc);
    this.pass(this.prefilter, b[0], b[0].w, b[0].h);
    for (let i = 1; i < b.length; i++) {
      gl.useProgram(this.down.prog);
      gl.uniform2f(this.down.u.uTexel, 1 / b[i - 1].w, 1 / b[i - 1].h);
      this.bind(0, b[i - 1].tex, this.down.u.uSrc);
      this.pass(this.down, b[i], b[i].w, b[i].h);
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    for (let i = b.length - 1; i > 0; i--) {
      gl.useProgram(this.up.prog);
      gl.uniform2f(this.up.u.uTexel, 1 / b[i].w, 1 / b[i].h);
      // coarser levels spread wider: a soft optical veil around the brightest gas, not just a rim glow
      gl.uniform1f(this.up.u.uRadius, 1.0 + 0.25 * i);
      this.bind(0, b[i].tex, this.up.u.uSrc);
      this.pass(this.up, b[i - 1], b[i - 1].w, b[i - 1].h);
    }
    gl.disable(gl.BLEND);

    // 3. composite to the canvas
    const c = this.composite;
    gl.useProgram(c.prog);
    gl.uniform1f(c.u.uExposure, f.exposure);
    gl.uniform1f(c.u.uBloomGain, f.bloomGain);
    gl.uniform1f(c.u.uFade, f.fade);
    gl.uniform1f(c.u.uTime, f.time);
    gl.uniform1f(c.u.uGrain, f.grain);
    gl.uniform1f(c.u.uHueKeep, f.hueKeep);
    gl.uniform1f(c.u.uVeil, f.veil);
    gl.uniform1i(c.u.uView, f.view ?? 0);
    gl.uniform2f(c.u.uRes, this.outWidth, this.outHeight);
    gl.uniform2f(c.u.uSrcRes, this.width, this.height);
    this.bind(0, scene.tex, c.u.uScene);
    this.bind(1, b[0].tex, c.u.uBloom);
    this.bind(2, b[b.length - 1].tex, c.u.uVeilTex);
    this.pass(c, null, this.outWidth, this.outHeight);
    if (query && this.timer) {
      gl.endQuery(this.timer.ext.TIME_ELAPSED_EXT);
      this.timer.pending.push(query);
    }
  }

  dispose() {
    const gl = this.gl;
    this.freeTargets();
    gl.deleteTexture(this.gasTex);
    for (const p of [this.trace, this.traceEnv, this.prefilter, this.down, this.up, this.composite]) if (p) gl.deleteProgram(p.prog);
    gl.deleteBuffer(this.vbo);
    gl.deleteVertexArray(this.vao);
  }
}

/** Builds a camera basis (column-major right/up/forward) looking from `eye` at `target`, rolled by `roll` rad. */
export function lookAt(eye: Vec3, target: Vec3, roll = 0): Float32Array {
  const f = norm(sub(target, eye));
  let r = norm(cross(f, [0, 1, 0]));
  let u = cross(r, f);
  if (roll !== 0) {
    const c = Math.cos(roll);
    const s = Math.sin(roll);
    const r2: Vec3 = [r[0] * c + u[0] * s, r[1] * c + u[1] * s, r[2] * c + u[2] * s];
    const u2: Vec3 = [u[0] * c - r[0] * s, u[1] * c - r[1] * s, u[2] * c - r[2] * s];
    r = r2;
    u = u2;
  }
  return new Float32Array([r[0], r[1], r[2], u[0], u[1], u[2], f[0], f[1], f[2]]);
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function norm(a: Vec3): Vec3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
