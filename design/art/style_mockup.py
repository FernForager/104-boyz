import random, sys
from PIL import Image, ImageDraw, ImageFont

W, H = 160, 120
ROLES = ['sky_top','sky_mid','glow','star','mtn','mtn_shadow','ridge','far_trees','meadow','meadow2','path',
         'lake','lake_glint','tree','tree_shadow','trunk','hiker','pack','lily','snow_patch']
R = {n: i + 1 for i, n in enumerate(ROLES)}

def build(scale):
    """Draw the scene as a role map at W*scale x H*scale."""
    s = scale
    im = Image.new('L', (W * s, H * s), 0)
    d = ImageDraw.Draw(im)
    P = lambda pts: [(x * s, y * s) for x, y in pts]
    # far range with Olympus
    peaks = [(0,48),(14,40),(26,46),(44,30),(56,36),(70,18),(80,27),(92,24),(104,34),(118,30),(134,42),(148,36),(160,44),(160,66),(0,66)]
    d.polygon(P(peaks), fill=R['mtn'])
    for (a, b, c) in [((44,30),(56,36),(52,66)),((70,18),(80,27),(76,66)),((92,24),(104,34),(98,66)),((118,30),(134,42),(124,66)),((14,40),(26,46),(20,66))]:
        d.polygon(P([a, b, c]), fill=R['mtn_shadow'])
    # mid ridge
    d.polygon(P([(0,60),(20,56),(40,62),(64,55),(90,61),(116,54),(140,60),(160,57),(160,80),(0,80)]), fill=R['ridge'])
    # far conifer band
    for x in range(0, 160, 5):
        h = 6 + (x * 7) % 5
        d.polygon(P([(x,78),(x + 2.5,78 - h),(x + 5,78)]), fill=R['far_trees'])
    # meadow + lake
    d.rectangle(P([(0,77),(160,120)]), fill=R['meadow'])
    d.polygon(P([(0,100),(30,96),(70,104),(110,98),(160,104),(160,120),(0,120)]), fill=R['meadow2'])
    d.ellipse(P([(38,81),(124,95)]), fill=R['lake'])
    d.polygon(P([(76,82),(84,82),(86,94),(74,94)]), fill=R['lake_glint'])
    # path
    d.polygon(P([(84,120),(100,120),(94,104),(88,98),(84,98),(88,104)]), fill=R['path'])
    # snow patch + bonfire lily
    d.ellipse(P([(36,106),(56,113)]), fill=R['snow_patch'])
    d.rectangle(P([(45,107),(46,108)]), fill=R['lily'])
    # big geometric conifers (stacked tiers)
    def tree(cx, base, w, h, tiers):
        d.rectangle(P([(cx - 1, base - 4),(cx + 1, base)]), fill=R['trunk'])
        for t in range(tiers):
            y0 = base - 4 - t * (h / tiers) * 0.8
            ww = w * (1 - t / (tiers + 0.6))
            top = y0 - h / tiers * 1.3
            d.polygon(P([(cx - ww / 2, y0),(cx, top),(cx + ww / 2, y0)]), fill=R['tree'])
            d.polygon(P([(cx, y0),(cx, top),(cx + ww / 2, y0)]), fill=R['tree_shadow'])
    tree(12, 118, 26, 70, 5); tree(30, 116, 16, 44, 4); tree(146, 120, 28, 78, 5); tree(128, 114, 14, 36, 4)
    # hiker
    d.rectangle(P([(90,98),(91,103)]), fill=R['hiker'])
    d.rectangle(P([(92,98),(93,101)]), fill=R['pack'])
    d.rectangle(P([(90,96),(91,97)]), fill=R['hiker'])
    return im

def sky_role(y, s):
    y = y / s
    if y < 16: return ('sky_top', 'sky_top', 0)
    if y < 26: return ('sky_top', 'sky_mid', 2)
    if y < 34: return ('sky_mid', 'sky_mid', 0)
    if y < 42: return ('sky_mid', 'glow', 2)
    if y < 46: return ('sky_mid', 'glow', 3)
    return ('glow', 'glow', 0)

BAYER = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]

def render(pal, roles, scale, dither=True, grain=False):
    rm = build(scale)
    out = Image.new('RGB', rm.size)
    px, rp = out.load(), rm.load()
    rnd = random.Random(7)
    stars = {(rnd.randrange(160), rnd.randrange(14)) for _ in range(14)}
    for y in range(rm.size[1]):
        for x in range(rm.size[0]):
            r = rp[x, y]
            if r == 0:
                a, b, mode = sky_role(y, scale)
                if (x // scale, y // scale) in stars and y / scale < 14: a = b = 'star'
                if dither:
                    lvl = {0: 0, 2: 8, 3: 12}[mode]
                    c = b if BAYER[(y // max(1,scale if scale==1 else 1)) % 4][x % 4] < lvl else a
                    name = c if mode else a
                else:
                    # smooth gradient between a and b
                    t = (y / scale) / 52
                    name = None
                    ca = pal[roles['sky_top']]; cb = pal[roles['glow']]
                    col = tuple(int(ca[i] + (cb[i] - ca[i]) * min(1, t) ** 1.6) for i in range(3))
                    px[x, y] = col; continue
            else:
                name = ROLES[r - 1]
            col = pal[roles[name]]
            if grain:
                n = rnd.randint(-9, 9)
                col = tuple(max(0, min(255, c + n)) for c in col)
            px[x, y] = col
    return out

EGA = ['#000000','#0000AA','#00AA00','#00AAAA','#AA0000','#AA00AA','#AA5500','#AAAAAA','#555555','#5555FF','#55FF55','#55FFFF','#FF5555','#FF55FF','#FFFF55','#FFFFFF']
BOOK = ['#1b1f2a','#24324a','#3f5a7a','#8fb3c9','#f2efe6','#e8d9b5','#e09a8a','#e8b33a','#c4602d','#8a3b2a','#5a3d2b','#1f3b33','#2f5b45','#6b8a4a','#a7b88a','#3f7f7a']
hexrgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
EGA, BOOK = [hexrgb(h) for h in EGA], [hexrgb(h) for h in BOOK]

ROLE_EGA = dict(sky_top=1, sky_mid=9, glow=12, star=15, mtn=15, mtn_shadow=7, ridge=3, far_trees=2, meadow=10, meadow2=2,
                path=14, lake=9, lake_glint=12, tree=2, tree_shadow=0, trunk=6, hiker=4, pack=6, lily=14, snow_patch=15)
ROLE_BOOK = dict(sky_top=1, sky_mid=2, glow=6, star=5, mtn=4, mtn_shadow=3, ridge=15, far_trees=11, meadow=13, meadow2=14,
                 path=5, lake=3, lake_glint=6, tree=12, tree_shadow=11, trunk=10, hiker=8, pack=9, lily=7, snow_patch=4)

S = 4
a = render(EGA, ROLE_EGA, 1).resize((W * S, H * S), Image.NEAREST)
b = render(BOOK, ROLE_BOOK, 1).resize((W * S, H * S), Image.NEAREST)
c = render(BOOK, ROLE_BOOK, S, dither=False, grain=True)

font = ImageFont.load_default(size=26)
labels = ['A) Pure Sierra: classic EGA colors', 'B) Sierra pixels + book-style palette', 'C) Smooth flat shapes, like the book']
LH = 46
sheet = Image.new('RGB', (W * S, (H * S + LH) * 3), (245, 240, 228))
dd = ImageDraw.Draw(sheet)
for i, (img, lab) in enumerate(zip([a, b, c], labels)):
    y0 = i * (H * S + LH)
    dd.text((14, y0 + 10), lab, fill=(30, 30, 30), font=font)
    sheet.paste(img, (0, y0 + LH))
sheet.save(sys.argv[1])
print('ok', sheet.size)
