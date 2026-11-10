"""Low-level drawing: anti-aliased shapes, cached text, grading, film texture.
Canvas = float32 RGB array (H, W, 3) in 0..1."""
import os, math, functools
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FONT_DIR = os.path.join(ROOT, 'assets', 'fonts')
FONTS = {
    'semibold': 'Inter-SemiBold.otf', 'bold': 'Inter-Bold.otf', 'medium': 'Inter-Medium.otf',
    'display': 'InterDisplay-ExtraBold.otf', 'black': 'InterDisplay-Black.otf',
    'mono': 'JetBrainsMono-Bold.ttf', 'serif': 'LiberationSerif-Bold.ttf',
    'serifr': 'LiberationSerif-Regular.ttf', 'serifi': 'LiberationSerif-Italic.ttf',
}

# palette
CHAR = (0.070, 0.070, 0.075)
WHITE = (0.96, 0.95, 0.92)
RED = (0.80, 0.17, 0.14)
SEPIA = (0.86, 0.71, 0.46)
COLD = (0.70, 0.82, 0.92)
WARM = (1.00, 0.78, 0.46)
SIL = (0.035, 0.035, 0.04)      # silhouette black


# ---------------------------------------------------------------- easing
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x

def ramp(t, a, b):
    return clamp((t - a) / (b - a)) if b != a else float(t >= a)

def ease(x):
    x = clamp(x); return x * x * (3 - 2 * x)

def eio(x):
    x = clamp(x); return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2

def eout(x):
    x = clamp(x); return 1 - (1 - x) ** 3

def env(t, a, b, fi=0.35, fo=0.35):
    """1 inside [a, b] with fades in/out."""
    if t < a - fi or t > b + fo:
        return 0.0
    return ease(ramp(t, a - fi, a)) * (1 - ease(ramp(t, b, b + fo)))

def lerp(a, b, x):
    return a + (b - a) * x

def lerp3(a, b, x):
    return tuple(a[i] + (b[i] - a[i]) * x for i in range(3))

def noise1(t, seed=0):
    """Smooth 1-D value noise in -1..1."""
    i = math.floor(t); f = t - i
    def h(n):
        n = (n * 374761393 + seed * 668265263) & 0xffffffff
        n = ((n ^ (n >> 13)) * 1274126177) & 0xffffffff
        return ((n ^ (n >> 16)) & 0xffff) / 32767.5 - 1
    u = f * f * (3 - 2 * f)
    return h(i) * (1 - u) + h(i + 1) * u


# ---------------------------------------------------------------- compositing
def blend(img, m, color, alpha=1.0, x0=0, y0=0, add=False):
    """Blend colour into img through float mask m placed at (x0, y0)."""
    if alpha <= 0.001:
        return
    h, w = m.shape[:2]
    xa, ya = max(0, x0), max(0, y0)
    xb, yb = min(img.shape[1], x0 + w), min(img.shape[0], y0 + h)
    if xa >= xb or ya >= yb:
        return
    mm = m[ya - y0:yb - y0, xa - x0:xb - x0]
    if mm.ndim == 2:
        mm = mm[..., None]
    mm = mm * alpha
    reg = img[ya:yb, xa:xb]
    c = np.asarray(color, np.float32)
    if add:
        reg += c * mm
    else:
        reg += (c - reg) * mm


def blend_rgba(img, rgb, a, x0=0, y0=0, alpha=1.0):
    h, w = a.shape[:2]
    xa, ya = max(0, x0), max(0, y0)
    xb, yb = min(img.shape[1], x0 + w), min(img.shape[0], y0 + h)
    if xa >= xb or ya >= yb or alpha <= 0.001:
        return
    sa = a[ya - y0:yb - y0, xa - x0:xb - x0, None] * alpha
    img[ya:yb, xa:xb] += (rgb[ya - y0:yb - y0, xa - x0:xb - x0] - img[ya:yb, xa:xb]) * sa


def _bbox(pts, pad):
    pts = np.asarray(pts, np.float64).reshape(-1, 2)
    x0 = int(math.floor(pts[:, 0].min() - pad)); y0 = int(math.floor(pts[:, 1].min() - pad))
    x1 = int(math.ceil(pts[:, 0].max() + pad)); y1 = int(math.ceil(pts[:, 1].max() + pad))
    x0, y0 = max(x0, -4), max(y0, -4)
    x1, y1 = min(x1, W + 4), min(y1, H + 4)
    return x0, y0, x1, y1


def _mask(polys, draw, pad=2, blur=0):
    allp = np.concatenate([np.asarray(p, np.float64).reshape(-1, 2) for p in polys])
    x0, y0, x1, y1 = _bbox(allp, pad + blur * 3)
    if x1 <= x0 or y1 <= y0:
        return None, 0, 0
    m = np.zeros((y1 - y0, x1 - x0), np.uint8)
    off = np.array([x0, y0])
    draw(m, [((np.asarray(p, np.float64).reshape(-1, 2) - off) * 16).round().astype(np.int32) for p in polys])
    m = m.astype(np.float32) / 255
    if blur > 0:
        m = cv2.GaussianBlur(m, (0, 0), blur)
    return m, x0, y0


def poly(img, pts, color, alpha=1.0, blur=0, add=False):
    polys = pts if isinstance(pts, list) and len(pts) and np.ndim(pts[0]) == 2 else [pts]
    polys = [p for p in polys if len(p) >= 3]
    if not polys:
        return
    m, x0, y0 = _mask(polys, lambda m, P: cv2.fillPoly(m, P, 255, cv2.LINE_AA, 4), blur=blur)
    if m is not None:
        blend(img, m, color, alpha, x0, y0, add)


def stroke(img, pts, color, width=2.0, alpha=1.0, closed=False, blur=0, add=False):
    pts = np.asarray(pts, np.float64).reshape(-1, 2)
    if len(pts) < 2:
        return
    wi = max(1, int(round(width)))
    m, x0, y0 = _mask([pts], lambda m, P: cv2.polylines(m, P, closed, 255, wi, cv2.LINE_AA, 4),
                      pad=wi + 2, blur=blur)
    if m is not None:
        blend(img, m, color, alpha, x0, y0, add)


def dashed(img, pts, color, width=3, dash=18, gap=12, alpha=1.0, phase=0.0):
    pts = np.asarray(pts, np.float64).reshape(-1, 2)
    seg = np.diff(pts, axis=0); L = np.hypot(seg[:, 0], seg[:, 1]); cum = np.concatenate([[0], np.cumsum(L)])
    total = cum[-1]; s = -phase % (dash + gap) - (dash + gap)
    def at(d):
        i = min(np.searchsorted(cum, d, side='right') - 1, len(L) - 1)
        f = (d - cum[i]) / max(L[i], 1e-6); return pts[i] + seg[i] * f
    while s < total:
        a, b = max(0, s), min(total, s + dash)
        if b > a:
            stroke(img, [at(a), at((a + b) / 2), at(b)], color, width, alpha)
        s += dash + gap


def circle(img, c, r, color, alpha=1.0, blur=0, add=False):
    if r <= 0:
        return
    n = max(24, int(r * 0.8))
    th = np.linspace(0, 2 * np.pi, n, endpoint=False)
    poly(img, np.stack([c[0] + r * np.cos(th), c[1] + r * np.sin(th)], 1), color, alpha, blur, add)


def ellipse_pts(cx, cy, rx, ry, rot=0.0, n=64, a0=0, a1=2 * np.pi):
    th = np.linspace(a0, a1, n)
    x, y = rx * np.cos(th), ry * np.sin(th)
    cr, sr = math.cos(rot), math.sin(rot)
    return np.stack([cx + x * cr - y * sr, cy + x * sr + y * cr], 1)


def rect(img, x0, y0, x1, y1, color, alpha=1.0, blur=0, add=False):
    poly(img, [(x0, y0), (x1, y0), (x1, y1), (x0, y1)], color, alpha, blur, add)


def rrect_pts(x0, y0, x1, y1, r, n=8):
    r = min(r, (x1 - x0) / 2, (y1 - y0) / 2)
    pts = []
    for cx, cy, a in ((x1 - r, y0 + r, -np.pi / 2), (x1 - r, y1 - r, 0), (x0 + r, y1 - r, np.pi / 2), (x0 + r, y0 + r, np.pi)):
        for k in range(n + 1):
            th = a + k / n * np.pi / 2
            pts.append((cx + r * math.cos(th), cy + r * math.sin(th)))
    return np.array(pts)


def vgrad(img, y0, y1, c0, c1, x0=0, x1=W, alpha=1.0):
    y0, y1 = int(max(0, y0)), int(min(H, y1))
    if y1 <= y0:
        return
    f = np.linspace(0, 1, y1 - y0, dtype=np.float32)[:, None, None]
    col = np.asarray(c0, np.float32) * (1 - f) + np.asarray(c1, np.float32) * f
    reg = img[y0:y1, x0:x1]
    reg += (col - reg) * alpha


_glow_cache = {}
def glow(img, c, r, color, strength=1.0, add=True):
    """Soft radial light (gaussian)."""
    r = max(2, int(r))
    if r not in _glow_cache:
        g = cv2.getGaussianKernel(2 * r * 2 + 1, r / 1.6)
        _glow_cache[r] = (g @ g.T / (g.max() ** 2)).astype(np.float32)
    m = _glow_cache[r]
    blend(img, m, color, strength, int(c[0]) - 2 * r, int(c[1]) - 2 * r, add=add)


# ---------------------------------------------------------------- text
@functools.lru_cache(maxsize=64)
def font(name, size):
    return ImageFont.truetype(os.path.join(FONT_DIR, FONTS[name]), size)


def wrap(text, fnt, max_w, tracking=0):
    words = text.split(' ')
    lines, cur = [], ''
    for w_ in words:
        trial = (cur + ' ' + w_).strip()
        if _tw(trial, fnt, tracking) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur); cur = w_
    if cur:
        lines.append(cur)
    return lines


def _tw(s, fnt, tracking=0):
    return fnt.getlength(s) + tracking * max(0, len(s) - 1)


@functools.lru_cache(maxsize=600)
def text_mask(text, fname, size, max_w=0, align='center', spacing=1.18, tracking=0):
    """Rendered text as float mask. Returns (mask, w, h)."""
    fnt = font(fname, size)
    lines = []
    for para in text.split('\n'):
        lines += wrap(para, fnt, max_w, tracking) if max_w else [para]
    asc, desc = fnt.getmetrics()
    lh = int(size * spacing)
    widths = [int(math.ceil(_tw(l, fnt, tracking))) for l in lines]
    pad = 4 + int(size * 0.12)          # glyphs in heavy weights overhang their advance width
    tw = max(widths) + 2 * pad; th = lh * (len(lines) - 1) + asc + desc + 8
    im = Image.new('L', (tw, th), 0); d = ImageDraw.Draw(im)
    for i, l in enumerate(lines):
        x = pad if align == 'left' else (tw - widths[i]) / 2 if align == 'center' else tw - pad - widths[i]
        y = 4 + i * lh
        if tracking:
            for ch in l:
                d.text((x, y), ch, font=fnt, fill=255); x += fnt.getlength(ch) + tracking
        else:
            d.text((x, y), l, font=fnt, fill=255)
    return np.asarray(im, np.float32) / 255, tw, th


@functools.lru_cache(maxsize=300)
def _shadow(text, fname, size, max_w, align, spacing, tracking, blur):
    m, w, h = text_mask(text, fname, size, max_w, align, spacing, tracking)
    p = int(blur * 3)
    big = np.pad(m, p)
    return cv2.GaussianBlur(big, (0, 0), blur), p


def text(img, s, x, y, fname='semibold', size=48, color=WHITE, alpha=1.0, anchor='mm', max_w=0,
         align='center', spacing=1.18, tracking=0, shadow=0.0, sblur=6, scale=1.0):
    """Draw text; anchor 'mm' centre, 'lt' left-top, 'mt' middle-top, 'lm' left-middle. Returns bbox."""
    if alpha <= 0.002 or not s:
        return None
    m, w, h = text_mask(s, fname, size, max_w, align, spacing, tracking)
    if scale != 1.0:
        m = cv2.resize(m, (max(1, int(w * scale)), max(1, int(h * scale))), interpolation=cv2.INTER_LINEAR)
        h, w = m.shape
    ax = {'l': 0, 'm': 0.5, 'r': 1}[anchor[0]]; ay = {'t': 0, 'm': 0.5, 'b': 1}[anchor[1]]
    x0, y0 = int(round(x - w * ax)), int(round(y - h * ay))
    if shadow > 0:
        sm, p = _shadow(s, fname, size, max_w, align, spacing, tracking, sblur)
        if scale != 1.0:
            sm = cv2.resize(sm, (int(sm.shape[1] * scale), int(sm.shape[0] * scale)))
            p = int(p * scale)
        blend(img, sm, (0, 0, 0), alpha * shadow, x0 - p, y0 - p + 3)
    blend(img, m, color, alpha, x0, y0)
    return x0, y0, x0 + w, y0 + h


def text_size(s, fname, size, max_w=0, spacing=1.18, tracking=0, align='center'):
    _, w, h = text_mask(s, fname, size, max_w, align, spacing, tracking)
    return w, h


# ---------------------------------------------------------------- grading & film
def grade(img, g, sat=1.0):
    """g = +1 warm sepia (actual history), -1 cold desaturated (imagined), 0 muted neutral."""
    L = img[..., 0] * 0.299 + img[..., 1] * 0.587 + img[..., 2] * 0.114
    L = L[..., None]
    if g >= 0:
        tone = L * np.array([1.10, 0.92, 0.70], np.float32) + np.array([0.018, 0.012, 0.0], np.float32)
        keep = lerp(0.55, 0.12, g)
    else:
        tone = (L * 0.94) * np.array([0.84, 0.95, 1.07], np.float32)
        keep = lerp(0.55, 0.20, -g)
    keep *= sat
    k = abs(g)
    neutral = img * 0.55 + L * 0.45
    out = neutral * (1 - k) + (img * keep + tone * (1 - keep)) * k
    img[...] = out


class Film:
    def __init__(self, seed=1):
        rng = np.random.default_rng(seed)
        self.grain = [cv2.GaussianBlur(rng.standard_normal((H // 2, W // 2)).astype(np.float32), (0, 0), 0.6)
                      for _ in range(6)]
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.60)) ** 2)
        self.vign = (1 - 0.62 * np.clip(d - 0.35, 0, 1) ** 1.6)[..., None].astype(np.float32)

    def apply(self, img, t, frame, warm=0.0, grain=0.030, flicker=0.022, dust=0.0):
        f = 1.0 + flicker * noise1(t * 9.0, 3) + 0.5 * flicker * noise1(t * 23.0, 7)
        img *= self.vign * f
        g = self.grain[(frame // 2) % len(self.grain)]
        g = cv2.resize(g, (W, H), interpolation=cv2.INTER_LINEAR)
        img += (g * grain)[..., None] * (0.35 + 0.65 * np.clip(img, 0, 1))
        if dust > 0:
            rng = np.random.default_rng(frame * 7 + 11)
            for _ in range(rng.poisson(3 * dust)):
                x, y = rng.uniform(0, W), rng.uniform(0, H)
                circle(img, (x, y), rng.uniform(0.8, 2.4), (0.92, 0.85, 0.7), 0.5 * dust)
            if rng.random() < 0.25 * dust:
                x = rng.uniform(80, W - 80)
                stroke(img, [(x, 0), (x + rng.uniform(-6, 6), H)], (0.9, 0.82, 0.68), 1.2, 0.12 * dust)
        np.clip(img, 0, 1, out=img)


def paper_texture(w, h, base=(0.84, 0.78, 0.66), seed=3, stain=0.10):
    rng = np.random.default_rng(seed)
    n1 = cv2.GaussianBlur(rng.standard_normal((h, w)).astype(np.float32), (0, 0), 1.0) * 0.025
    n2 = cv2.resize(rng.standard_normal((h // 40 + 2, w // 40 + 2)).astype(np.float32), (w, h),
                    interpolation=cv2.INTER_CUBIC) * stain
    fib = cv2.GaussianBlur(rng.standard_normal((h, w)).astype(np.float32), (0, 0), sigmaX=6, sigmaY=0.7) * 0.02
    v = 1 + n1 + n2 * 0.5 + fib
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    edge = np.clip(np.minimum(np.minimum(xx, w - xx), np.minimum(yy, h - yy)) / 40, 0, 1) ** 0.5
    v *= 0.82 + 0.18 * edge
    return np.clip(np.asarray(base, np.float32) * v[..., None], 0, 1)


def to_u8(img):
    return (np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)
