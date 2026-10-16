# Режет два фото конверта на слои для анимации страницы Contact.
# Всё в координатах открытого фото (1024x1536), потом обрезка по Y0..Y1.
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, out = sys.argv[1], sys.argv[2]
FOLD = 548          # линия сгиба клапана на открытом фото
Y0, Y1 = 150, 1310  # кадр
L, R, LT = 208, 808, 503  # лист: левый/правый край, верх

def load(n): return np.asarray(Image.open(f"{src}/{n}.png").convert("RGB")).astype(float)

def flatten(a):
    # фон с виньеткой -> чисто белый: квадратичная поверхность по пикселям вне конверта
    h, w, _ = a.shape
    yy, xx = np.mgrid[0:h, 0:w]
    m = np.ones((h, w), bool); m[120:1330, 60:960] = False
    X = np.stack([np.ones_like(xx), xx, yy, xx*xx, yy*yy, xx*yy], -1)[m].astype(float) / 1.0
    sc = np.array([1, w, h, w*w, h*h, w*h], float); X = X / sc
    lum = a.mean(2)[m]
    c, *_ = np.linalg.lstsq(X, lum, rcond=None)
    F = (np.stack([np.ones_like(xx), xx, yy, xx*xx, yy*yy, xx*yy], -1) / sc) @ c
    return np.clip(a * (259 / F)[..., None], 0, 255)

op = flatten(load("open"))
cl = flatten(load("closed"))

# закрытый конверт подгоняем под открытый: верх 530->548, низ 1253->1259, x 107..918 -> 106..914
ci = Image.fromarray(cl.astype(np.uint8))
sx = (914 - 106) / (918 - 107); sy = (1259 - FOLD) / (1253 - 530)
ox = 106 - 107 * sx; oy = FOLD - 530 * sy
ci = ci.transform(ci.size, Image.AFFINE, (1 / sx, 0, -ox / sx, 0, 1 / sy, -oy / sy), Image.BICUBIC, fillcolor=(255, 255, 255))
cl = np.asarray(ci).astype(float)
apex = (513 * sx + ox, 970 * sy + oy)

# лист: яркие пиксели в прямоугольнике листа, связные сверху
lum = op.mean(2)
bright = np.zeros(lum.shape, bool); bright[LT - 2:1000, L - 2:R + 3] = lum[LT - 2:1000, L - 2:R + 3] > 150
bottom = np.zeros(1024, int)
for x in range(L - 2, R + 3):
    col = bright[:, x]; y = LT + 10
    while y < 1000 and col[y]: y += 1
    bottom[x] = y
letter_mask = np.zeros(lum.shape, bool)
for x in range(L - 2, R + 3):
    if bottom[x] > LT + 20: letter_mask[LT - 2:bottom[x], x] = bright[LT - 2:bottom[x], x]
lm = Image.fromarray((letter_mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(.8))

# там, где был лист, кружево: берём кусок закрытого клапана, подгоняем тон под внутренность
D = 130  # насколько лист утоплен в начале
band = (L - 6, LT - 8, R + 6, LT + D + 40)
patch = Image.fromarray(cl.astype(np.uint8)).crop((band[0], FOLD + 45, band[2], FOLD + 45 + band[3] - band[1]))
pa = np.asarray(patch).astype(float)
ref = op[600:700, 115:200]  # видимая внутренность слева от листа
pa = (pa - pa.mean()) * (ref.std() / pa.std()) + ref.mean()
nol = op.copy()
bh = band[3] - band[1]; bw = band[2] - band[0]
fe = np.ones((bh, bw)); r = 10
ramp = np.minimum(np.arange(bh)[:, None], np.arange(bh)[::-1, None]).clip(0, r) / r
fe = np.minimum(fe, ramp)
fe = np.minimum(fe, (np.minimum(np.arange(bw), np.arange(bw)[::-1]).clip(0, r) / r)[None])
reg = nol[band[1]:band[3], band[0]:band[2]]
# внутри листа заменяем полностью, на краях сглаживаем
inner = np.asarray(lm.crop(band)).astype(float)[..., None] / 255
w = np.maximum(inner, fe[..., None] * 0)  # только там, где лист
nol[band[1]:band[3], band[0]:band[2]] = reg * (1 - w) + pa * w
# ниже полосы лист остаётся (его закроет слой листа), но пусть там тоже кружево — на случай щелей
nolI = Image.fromarray(nol.astype(np.uint8))

def poly_mask(pts):
    m = Image.new("L", (1024, 1536), 0); ImageDraw.Draw(m).polygon(pts, fill=255); return m

def rgba(img, mask):
    im = img.copy().convert("RGBA"); im.putalpha(mask); return im

full = Image.new("L", (1024, 1536), 255)
flap_open = poly_mask([(96, FOLD + 4), (512, 170), (928, FOLD + 4)])
below = poly_mask([(0, FOLD - 3), (1024, FOLD - 3), (1024, 1536), (0, 1536)])
cflap = poly_mask([(100, FOLD - 4), (924, FOLD - 4), (apex[0], apex[1] + 6)])
cbody = Image.fromarray(np.minimum(np.asarray(below), 255 - np.asarray(cflap)).astype(np.uint8))

# 1 основа: открытый конверт без листа и без клапана (над сгибом белый фон)
base = Image.composite(nolI, Image.new("RGB", (1024, 1536), (255, 255, 255)), below)
# лист с загнутой по краям тенью не нужен — берём как есть
letter = rgba(Image.fromarray(op.astype(np.uint8)), lm)
layers = {
    "base": base.convert("RGBA"),
    "flap-open": rgba(nolI, flap_open.filter(ImageFilter.GaussianBlur(.7))),
    "letter": letter,
    "closed-body": rgba(Image.fromarray(cl.astype(np.uint8)), cbody.filter(ImageFilter.GaussianBlur(.7))),
    "closed-flap": rgba(Image.fromarray(cl.astype(np.uint8)), cflap.filter(ImageFilter.GaussianBlur(.7))),
}
for k, im in layers.items():
    im = im.crop((0, Y0, 1024, Y1))
    if k == "base": im.convert("RGB").save(f"{out}/{k}.jpg", quality=86)
    else: im.save(f"{out}/{k}.webp", quality=86, method=6)

# граница кармана для clip-path листа, в % кадра
H = Y1 - Y0
pts = [(L - 3, 0)] + [(x, bottom[x]) for x in range(L - 2, R + 3, 8)] + [(R + 2, bottom[R + 2]), (R + 3, 0)]
print("clip", ",".join(f"{x/1024*100:.2f}% {(y-Y0)/H*100:.2f}%" for x, y in pts))
print("fold %", (FOLD - Y0) / H * 100, "D %", D / H * 100, "apex", apex)
