# Режет фото открытого конверта на слои для анимации страницы Contact:
#   python3 build.py <папка с open.png> <папка для слоёв>
# Всё из одного фото, чтобы кружево не менялось: закрытый клапан — это тот же клапан,
# повёрнутый на 180° вокруг сгиба. Фон и тень вокруг конверта убраны в чистый белый.
import sys, numpy as np
from PIL import Image, ImageFilter

src, out = sys.argv[1], sys.argv[2]
FOLD = 548          # линия сгиба клапана
Y0, Y1 = 150, 1310  # кадр
L, R, LT = 208, 808, 503  # лист: левый/правый край, верх
D = 50              # насколько лист утоплен в начале: верх на линии сгиба (в CSS translateY(4.31%))
HALO = 34           # ширина тени сложенного клапана, px фото

op = np.asarray(Image.open(f"{src}/open.png").convert("RGB")).astype(float)
lum = op.mean(2)
H, W = lum.shape

# силуэт конверта: в каждой строке от первого до последнего тёмного пикселя (дырки кружева внутри заполняются)
dark = lum < 95
sil = np.zeros((H, W), bool)
for y in range(H):
    xs = np.where(dark[y])[0]
    if len(xs) > 12: sil[y, xs.min():xs.max() + 1] = True
silm = Image.fromarray((sil * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(.9))
sa = np.asarray(silm).astype(float)[..., None] / 255
# фон внутри силуэта (просветы кружева) выравниваем к белому, снаружи — чистый белый
op = np.clip(op * 1.04, 0, 255) * sa + 255 * (1 - sa)

# лист: яркие пиксели в его прямоугольнике, связные сверху; bottom — где лист уходит в карман
bright = np.zeros((H, W), bool); bright[LT - 2:1000, L - 2:R + 3] = lum[LT - 2:1000, L - 2:R + 3] > 150
bottom = np.zeros(W, int)
for x in range(L - 2, R + 3):
    y = LT + 10
    while y < 1000 and bright[y, x]: y += 1
    bottom[x] = y
lmask = np.zeros((H, W), bool)
for x in range(L - 2, R + 3):
    if bottom[x] > LT + 20: lmask[LT - 2:bottom[x], x] = bright[LT - 2:bottom[x], x]
lm = Image.fromarray((lmask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(.8))

# под листом — кружево этого же клапана (кусок над листом), притенённое: это глубина конверта.
# Кусок отражаем по вертикали плиткой, чтобы закрыть всё место листа до кармана
bx0, by0, bx1, by1 = L - 6, LT - 8, R + 6, 912
tile = Image.fromarray(op.astype(np.uint8)).crop((300, 382, 720, 500)).resize((bx1 - bx0, 172), Image.LANCZOS)
tile = np.asarray(tile).astype(float) * .55
reps = [tile[::-1] if i % 2 == 0 else tile for i in range((by1 - by0) // 172 + 1)]
patch = np.concatenate(reps)[:by1 - by0]
w = np.asarray(lm.crop((bx0, by0, bx1, by1))).astype(float)[..., None] / 255
nol = op.copy()
nol[by0:by1, bx0:bx1] = nol[by0:by1, bx0:bx1] * (1 - w) + patch * w
# клапан за листом (между верхом листа и сгибом) — отражение кружева над листом, сжатое к центру,
# чтобы в закрытом виде клапан был сплошным кружевом без следа листа
fl = op.copy()
ys = np.arange(by0, FOLD + 4); xs = np.arange(bx0, bx1)
sy = (2 * (LT - 9) - ys).clip(0); sx = (512 + (xs - 512) * .85).astype(int)
wf = np.asarray(lm.crop((bx0, by0, bx1, FOLD + 4))).astype(float)[..., None] / 255
fl[by0:FOLD + 4, bx0:bx1] = fl[by0:FOLD + 4, bx0:bx1] * (1 - wf) + op[sy][:, sx] * wf
flI = Image.fromarray(fl.astype(np.uint8))
nolI = Image.fromarray(nol.astype(np.uint8))

white = Image.new("RGB", (W, H), (255, 255, 255))
below = np.zeros((H, W), np.uint8); below[FOLD - 2:] = 255
above = np.zeros((H, W), np.uint8); above[:FOLD + 3] = 255
flapA = Image.fromarray(np.minimum(above, (sa[..., 0] * 255).astype(np.uint8)))

base = Image.composite(nolI, white, Image.fromarray(below))
flap = flI.convert("RGBA"); flap.putalpha(flapA)
letter = Image.fromarray(op.astype(np.uint8)).convert("RGBA"); letter.putalpha(lm)
base.crop((0, Y0, W, Y1)).save(f"{out}/base.jpg", quality=88)
# сложенный клапан: тот же клапан с тёмной каймой по косым краям — это тень клапана на конверте,
# она закрывает щели у боков, чтобы закрытый конверт не выглядел приоткрытым и лист не выглядывал
halo = Image.fromarray(np.asarray(flapA)).filter(ImageFilter.MaxFilter(HALO * 2 + 1)).filter(ImageFilter.GaussianBlur(HALO / 2.5))
ha = np.asarray(halo).astype(float); ha[FOLD - 1:] = 0  # кайма только по косым краям, не над сгибом
ys = np.arange(FOLD); ha[:FOLD] *= sa[(2 * FOLD - ys).clip(0, H - 1), :, 0]  # и только поверх конверта (после переворота клапан ляжет ниже сгиба)
shadow = Image.new("RGBA", (W, H), (12, 11, 11, 0)); shadow.putalpha(Image.fromarray((ha * .92).astype(np.uint8)))
flap_closed = Image.alpha_composite(shadow, flap)
for k, im in {"flap": flap, "flap-closed": flap_closed, "letter": letter}.items():
    im.crop((0, Y0, W, Y1)).save(f"{out}/{k}.webp", quality=88, method=6)

# граница кармана для clip-path листа, в % кадра
h = Y1 - Y0
pts = [(L - 3, 0)] + [(x, bottom[x]) for x in range(L - 2, R + 3, 8)] + [(R + 2, bottom[R + 2]), (R + 3, 0)]
print("clip", ",".join(f"{x/W*100:.2f}% {(y-Y0)/h*100:.2f}%" for x, y in pts))
print("fold %", (FOLD - Y0) / h * 100, "D %", D / h * 100)
