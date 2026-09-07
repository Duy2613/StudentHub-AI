import os
import sys
import math
import cv2
import numpy as np
from PIL import Image

sys.stdout.reconfigure(line_buffering=True)

FPS = 24
DURATION_SEC = 8.0
TOTAL_FRAMES = int(FPS * DURATION_SEC) # 192 frames
WIDTH = 1280
HEIGHT = 720

OUTPUT_DIR = os.path.abspath("frontend/public/videos/academic")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Refined Academic Palette (RGB)
PALETTE = {
    "charcoal": (14, 17, 24),
    "ink_black": (8, 10, 15),
    "graphite": (35, 42, 52),
    "warm_ivory": (246, 243, 235),
    "paper_white": (230, 226, 218),
    "muted_silver": (175, 182, 192),
    "mineral_blue": (82, 138, 185),
    "subtle_cyan": (56, 189, 218),
    "amber_gold": (232, 176, 85),
    "emerald": (46, 175, 136),
    "deep_slate": (20, 26, 36)
}

def bgr(rgb):
    return (int(rgb[2]), int(rgb[1]), int(rgb[0]))

def draw_antialiased_line(img, pt1, pt2, color, thickness=1, alpha=1.0):
    overlay = img.copy()
    cv2.line(overlay, pt1, pt2, bgr(color), thickness, cv2.LINE_AA)
    cv2.addWeighted(overlay, alpha, img, 1.0 - alpha, 0, img)

# Precompute vignette mask
Y_VIG, X_VIG = np.ogrid[:HEIGHT, :WIDTH]
CX_VIG, CY_VIG = WIDTH / 2.0, HEIGHT / 2.0
DIST_VIG = np.sqrt(((X_VIG - CX_VIG) / CX_VIG) ** 2 + ((Y_VIG - CY_VIG) / CY_VIG) ** 2)
VIGNETTE_MASK = np.clip(1.0 - (DIST_VIG * 0.35), 0.25, 1.0)
VIGNETTE_MASK_3D = np.dstack([VIGNETTE_MASK] * 3).astype(np.float32)

def add_vignette_and_grain(frame, strength=0.35, grain=5):
    # Vectorized vignette
    frame = (frame.astype(np.float32) * VIGNETTE_MASK_3D).astype(np.uint8)
    # Subtle film grain
    noise = np.random.normal(0, grain, (HEIGHT, WIDTH, 3)).astype(np.int16)
    return np.clip(frame.astype(np.int16) + noise, 0, 255).astype(np.uint8)

# Precompute Base Gradient Grids for Vectorized Rendering
X_NORM = np.linspace(0, 1, WIDTH, dtype=np.float32)
Y_NORM = np.linspace(0, 1, HEIGHT, dtype=np.float32)
GRID_X, GRID_Y = np.meshgrid(X_NORM, Y_NORM)

# -------------------------------------------------------------
# FILM 01: THE LIVING CAMPUS ATLAS
# -------------------------------------------------------------
# Vectorized desk gradient
LIGHT_F1 = 1.0 - (GRID_X * 0.7 + GRID_Y * 0.5)
BASE_F1_B = np.clip(PALETTE["deep_slate"][2] * 0.8 + LIGHT_F1 * 18, 0, 255).astype(np.uint8)
BASE_F1_G = np.clip(PALETTE["deep_slate"][1] * 0.8 + LIGHT_F1 * 22, 0, 255).astype(np.uint8)
BASE_F1_R = np.clip(PALETTE["deep_slate"][0] * 0.8 + LIGHT_F1 * 28, 0, 255).astype(np.uint8)
BASE_F1_IMG = np.dstack([BASE_F1_B, BASE_F1_G, BASE_F1_R])

def render_film01_frame(i):
    t = i / TOTAL_FRAMES
    frame = BASE_F1_IMG.copy()
    
    # Camera dolly out: zoom factor from 1.30 to 1.0
    zoom = 1.30 - 0.30 * (0.5 - 0.5 * math.cos(t * math.pi * 2 if t < 0.5 else (1.0 - t) * math.pi * 2))
    center_x = WIDTH * 0.55
    center_y = HEIGHT * 0.52
    
    # Topographic paper contour lines
    num_contours = 12
    for c in range(num_contours):
        radius_base = (70 + c * 40) * zoom
        angles = np.arange(0, 360, 10)
        rads = np.radians(angles)
        wobble = np.sin(rads * 4 + c + t * 2 * math.pi) * 12 * (1.0 - c/num_contours)
        px = (center_x + np.cos(rads) * (radius_base + wobble) * 1.5).astype(np.int32)
        py = (center_y + np.sin(rads) * (radius_base + wobble) * 0.75).astype(np.int32)
        pts = np.column_stack((px, py))
        
        color = PALETTE["warm_ivory"] if c % 3 != 0 else PALETTE["amber_gold"]
        cv2.polylines(frame, [pts], True, bgr(color), 1, cv2.LINE_AA)
    
    # Architectural nodes (libraries, labs, pavilions)
    nodes = [
        (center_x - 180 * zoom, center_y - 40 * zoom, 70 * zoom, 40 * zoom),
        (center_x + 120 * zoom, center_y - 70 * zoom, 85 * zoom, 50 * zoom),
        (center_x + 220 * zoom, center_y + 60 * zoom, 60 * zoom, 35 * zoom),
        (center_x - 80 * zoom, center_y + 110 * zoom, 75 * zoom, 45 * zoom),
        (center_x + 30 * zoom, center_y + 15 * zoom, 50 * zoom, 30 * zoom)
    ]
    
    for idx1 in range(len(nodes)):
        for idx2 in range(idx1 + 1, len(nodes)):
            x1, y1 = int(nodes[idx1][0]), int(nodes[idx1][1])
            x2, y2 = int(nodes[idx2][0]), int(nodes[idx2][1])
            draw_antialiased_line(frame, (x1, y1), (x2, y2), PALETTE["mineral_blue"], 1, 0.45)
            
            # Moving data pulses
            pulse_pos = (t * 2.0 + (idx1 + idx2) * 0.2) % 1.0
            px = int(x1 + (x2 - x1) * pulse_pos)
            py = int(y1 + (y2 - y1) * pulse_pos)
            cv2.circle(frame, (px, py), int(3 * zoom), bgr(PALETTE["subtle_cyan"]), -1, cv2.LINE_AA)
            cv2.circle(frame, (px, py), int(6 * zoom), bgr(PALETTE["warm_ivory"]), 1, cv2.LINE_AA)
            
    for nx, ny, nw, nh in nodes:
        ix, iy = int(nx - nw/2), int(ny - nh/2)
        iw, ih = int(nw), int(nh)
        overlay = frame.copy()
        cv2.rectangle(overlay, (ix, iy), (ix + iw, iy + ih), bgr(PALETTE["paper_white"]), -1)
        cv2.addWeighted(overlay, 0.25, frame, 0.75, 0, frame)
        cv2.rectangle(frame, (ix, iy), (ix + iw, iy + ih), bgr(PALETTE["warm_ivory"]), 1, cv2.LINE_AA)
        cv2.circle(frame, (int(nx), int(ny)), int(4 * zoom), bgr(PALETTE["amber_gold"]), -1, cv2.LINE_AA)

    return add_vignette_and_grain(frame, strength=0.4)

# -------------------------------------------------------------
# FILM 02: THE TRUST ENGINE
# -------------------------------------------------------------
def render_film02_frame(i):
    t = i / TOTAL_FRAMES
    frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    frame[:] = bgr(PALETTE["ink_black"])
    
    cx, cy = int(WIDTH * 0.45), int(HEIGHT * 0.5)
    drift_scale = 1.0 + 0.15 * math.sin(t * math.pi)
    
    # Subtle studio mist lines
    cv2.line(frame, (0, cy - 80), (WIDTH, cy - 80), bgr(PALETTE["graphite"]), 1)
    cv2.line(frame, (0, cy + 80), (WIDTH, cy + 80), bgr(PALETTE["graphite"]), 1)
        
    # Central suspended artifact (archival vellum fragment)
    art_w, art_h = int(140 * drift_scale), int(190 * drift_scale)
    art_x, art_y = cx - art_w//2, cy - art_h//2 + int(10 * math.sin(t * 2 * math.pi))
    
    overlay = frame.copy()
    cv2.rectangle(overlay, (art_x, art_y), (art_x + art_w, art_y + art_h), bgr(PALETTE["paper_white"]), -1)
    cv2.addWeighted(overlay, 0.2, frame, 0.8, 0, frame)
    cv2.rectangle(frame, (art_x, art_y), (art_x + art_w, art_y + art_h), bgr(PALETTE["warm_ivory"]), 1, cv2.LINE_AA)
    
    # Text line abstractions
    for ly in range(art_y + 25, art_y + art_h - 20, 16):
        cv2.line(frame, (art_x + 18, ly), (art_x + art_w - 18, ly), bgr(PALETTE["graphite"]), 1, cv2.LINE_AA)
        
    # 6 Orbiting Evidence Layers
    angles = [0, 60, 120, 180, 240, 300]
    radii = [180, 230, 200, 250, 190, 220]
    evidence_points = []
    
    for idx, (base_ang, r) in enumerate(zip(angles, radii)):
        ang = math.radians(base_ang + t * 45)
        ex = int(cx + math.cos(ang) * (r * drift_scale))
        ey = int(cy + math.sin(ang) * (r * 0.75 * drift_scale))
        evidence_points.append((ex, ey))
        
        sw, sh = 55, 38
        slide_over = frame.copy()
        cv2.rectangle(slide_over, (ex - sw//2, ey - sh//2), (ex + sw//2, ey + sh//2), bgr(PALETTE["mineral_blue"]), -1)
        cv2.addWeighted(slide_over, 0.18, frame, 0.82, 0, frame)
        cv2.rectangle(frame, (ex - sw//2, ey - sh//2), (ex + sw//2, ey + sh//2), bgr(PALETTE["subtle_cyan"]), 1, cv2.LINE_AA)
        cv2.circle(frame, (ex, ey), 3, bgr(PALETTE["warm_ivory"]), -1, cv2.LINE_AA)
        
    for j in range(len(evidence_points)):
        p1 = evidence_points[j]
        p2 = evidence_points[(j + 1) % len(evidence_points)]
        draw_antialiased_line(frame, p1, p2, PALETTE["subtle_cyan"], 1, 0.55 + 0.3 * math.sin(t * math.pi * 2 + j))
        draw_antialiased_line(frame, (cx, cy), p1, PALETTE["warm_ivory"], 1, 0.35 + 0.2 * math.cos(t * math.pi * 2 + j))

    return add_vignette_and_grain(frame, strength=0.38)

# -------------------------------------------------------------
# FILM 03: COLLECTIVE INTELLIGENCE
# -------------------------------------------------------------
def render_film03_frame(i):
    t = i / TOTAL_FRAMES
    frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    frame[:] = bgr(PALETTE["ink_black"])
    
    cx, cy = int(WIDTH * 0.5), int(HEIGHT * 0.5)
    num_particles = 90
    points = []
    for p in range(num_particles):
        speed = 0.5 + 0.5 * (p / num_particles)
        phase = p * 0.35
        r = (40 + (p * 4.5) + math.sin(t * 2 * math.pi + phase) * 35) % 480
        theta = p * 0.18 + t * 2 * math.pi * speed
        px = int(cx + math.cos(theta) * r * 1.3)
        py = int(cy + math.sin(theta) * r * 0.75)
        points.append((px, py, p))
        
    for idx1 in range(0, len(points), 2):
        px1, py1, _ = points[idx1]
        for idx2 in range(idx1 + 1, min(idx1 + 5, len(points))):
            px2, py2, _ = points[idx2]
            dist = math.hypot(px2 - px1, py2 - py1)
            if dist < 80:
                alpha = (1.0 - dist / 80.0) * 0.4
                draw_antialiased_line(frame, (px1, py1), (px2, py2), PALETTE["mineral_blue"], 1, alpha)
                
    for px, py, p in points:
        if p % 5 == 0:
            overlay = frame.copy()
            cv2.rectangle(overlay, (px - 6, py - 9), (px + 6, py + 9), bgr(PALETTE["paper_white"]), -1)
            cv2.addWeighted(overlay, 0.35, frame, 0.65, 0, frame)
            cv2.rectangle(frame, (px - 6, py - 9), (px + 6, py + 9), bgr(PALETTE["warm_ivory"]), 1, cv2.LINE_AA)
        elif p % 3 == 0:
            cv2.circle(frame, (px, py), 3, bgr(PALETTE["amber_gold"]), -1, cv2.LINE_AA)
            cv2.circle(frame, (px, py), 6, bgr(PALETTE["warm_ivory"]), 1, cv2.LINE_AA)
        else:
            cv2.circle(frame, (px, py), 2, bgr(PALETTE["subtle_cyan"]), -1, cv2.LINE_AA)
            
    origin_pulse = 0.5 + 0.5 * math.sin(t * 2 * math.pi * 3)
    cv2.circle(frame, (cx, cy), int(8 + origin_pulse * 4), bgr(PALETTE["warm_ivory"]), -1, cv2.LINE_AA)
    cv2.circle(frame, (cx, cy), int(18 + origin_pulse * 8), bgr(PALETTE["amber_gold"]), 1, cv2.LINE_AA)

    return add_vignette_and_grain(frame, strength=0.35)

# -------------------------------------------------------------
# FILM 04: EXPERT TRUST NETWORK
# -------------------------------------------------------------
def render_film04_frame(i):
    t = i / TOTAL_FRAMES
    frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    frame[:] = bgr(PALETTE["ink_black"])
    
    cam_x = t * 240.0
    for shelf_idx in range(6):
        base_x = int(shelf_idx * 260 - cam_x % 260)
        cv2.rectangle(frame, (base_x, 40), (base_x + 18, HEIGHT - 40), bgr(PALETTE["graphite"]), -1)
        for sy in range(100, HEIGHT - 80, 80):
            cv2.line(frame, (base_x, sy), (base_x + 250, sy), bgr(PALETTE["deep_slate"]), 3)
            for bx in range(base_x + 20, base_x + 240, 18):
                book_h = 45 + (bx % 25)
                color = PALETTE["graphite"] if (bx + sy) % 3 != 0 else PALETTE["charcoal"]
                cv2.rectangle(frame, (bx, sy - book_h), (bx + 14, sy), bgr(color), -1)
                
    beam_overlay = frame.copy()
    pts = np.array([
        [int(WIDTH * 0.15), 0],
        [int(WIDTH * 0.45), 0],
        [WIDTH, int(HEIGHT * 0.85)],
        [int(WIDTH * 0.7), HEIGHT]
    ], np.int32)
    cv2.fillPoly(beam_overlay, [pts], bgr(PALETTE["amber_gold"]))
    cv2.addWeighted(beam_overlay, 0.12, frame, 0.88, 0, frame)
    
    spheres = [
        (int(WIDTH * 0.25 - cam_x * 0.3) % WIDTH, int(HEIGHT * 0.42), 48),
        (int(WIDTH * 0.50 - cam_x * 0.3) % WIDTH, int(HEIGHT * 0.52), 56),
        (int(WIDTH * 0.75 - cam_x * 0.3) % WIDTH, int(HEIGHT * 0.38), 52),
        (int(WIDTH * 0.95 - cam_x * 0.3) % WIDTH, int(HEIGHT * 0.58), 44)
    ]
    
    for s_idx in range(len(spheres)):
        sx1, sy1, _ = spheres[s_idx]
        sx2, sy2, _ = spheres[(s_idx + 1) % len(spheres)]
        if abs(sx1 - sx2) < WIDTH * 0.6:
            draw_antialiased_line(frame, (sx1, sy1), (sx2, sy2), PALETTE["amber_gold"], 1, 0.6)
            
    for sx, sy, r in spheres:
        sphere_over = frame.copy()
        cv2.circle(sphere_over, (sx, sy), r, bgr(PALETTE["mineral_blue"]), -1)
        cv2.addWeighted(sphere_over, 0.18, frame, 0.82, 0, frame)
        cv2.circle(frame, (sx, sy), r, bgr(PALETTE["warm_ivory"]), 1, cv2.LINE_AA)
        
        ang = t * 2 * math.pi
        ir = int(r * 0.65)
        for da in range(0, 360, 60):
            rad = math.radians(da) + ang
            ix = int(sx + math.cos(rad) * ir)
            iy = int(sy + math.sin(rad) * ir * 0.4)
            cv2.circle(frame, (ix, iy), 2, bgr(PALETTE["warm_ivory"]), -1, cv2.LINE_AA)
            cv2.line(frame, (sx, sy), (ix, iy), bgr(PALETTE["subtle_cyan"]), 1, cv2.LINE_AA)

    return add_vignette_and_grain(frame, strength=0.36)

# -------------------------------------------------------------
# FILM 05: FROM QUESTION TO UNDERSTANDING
# -------------------------------------------------------------
def render_film05_frame(i):
    t = i / TOTAL_FRAMES
    frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    frame[:] = bgr(PALETTE["ink_black"])
    
    cx, cy = int(WIDTH * 0.6), int(HEIGHT * 0.5)
    cycle = (t * 2.0) % 2.0
    order = 0.5 - 0.5 * math.cos(math.pi * cycle)
    
    num_elements = 36
    np.random.seed(88)
    
    for idx in range(num_elements):
        chaos_ang = np.random.uniform(0, math.pi * 2)
        chaos_r = np.random.uniform(60, 260)
        chaos_x = cx + math.cos(chaos_ang) * chaos_r
        chaos_y = cy + math.sin(chaos_ang) * chaos_r
        
        ring = idx // 12
        sub_idx = idx % 12
        order_r = 80 + ring * 75
        order_ang = (sub_idx / 12.0) * math.pi * 2 + t * math.pi * 0.5
        order_x = cx + math.cos(order_ang) * order_r
        order_y = cy + math.sin(order_ang) * order_r * 0.7
        
        curr_x = int(chaos_x * (1.0 - order) + order_x * order)
        curr_y = int(chaos_y * (1.0 - order) + order_y * order)
        
        if order > 0.3:
            nxt_ang = ((sub_idx + 1) / 12.0) * math.pi * 2 + t * math.pi * 0.5
            nxt_x = int(cx + math.cos(nxt_ang) * order_r)
            nxt_y = int(cy + math.sin(nxt_ang) * order_r * 0.7)
            draw_antialiased_line(frame, (curr_x, curr_y), (nxt_x, nxt_y), PALETTE["warm_ivory"], 1, order * 0.6)
            
        pw = int(18 + order * 10)
        overlay = frame.copy()
        cv2.circle(overlay, (curr_x, curr_y), pw, bgr(PALETTE["mineral_blue"] if order < 0.5 else PALETTE["amber_gold"]), -1)
        cv2.addWeighted(overlay, 0.15 + order * 0.15, frame, 0.85 - order * 0.15, 0, frame)
        cv2.circle(frame, (curr_x, curr_y), 3, bgr(PALETTE["warm_ivory"]), -1, cv2.LINE_AA)
        
    cv2.circle(frame, (cx, cy), int(12 + order * 16), bgr(PALETTE["warm_ivory"]), -1, cv2.LINE_AA)
    cv2.circle(frame, (cx, cy), int(26 + order * 30), bgr(PALETTE["amber_gold"]), 1, cv2.LINE_AA)

    return add_vignette_and_grain(frame, strength=0.38)

# -------------------------------------------------------------
# FILM 06: ACADEMIC DEEP WORK
# -------------------------------------------------------------
# Vectorized wood desk base
WOOD_BASE = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
WOOD_BASE_VAL = np.clip(22 + GRID_Y * 18 + np.sin(GRID_Y * 35.0 + GRID_X * 8.0) * 4, 0, 255).astype(np.uint8)
WOOD_BASE[:, :, 0] = (WOOD_BASE_VAL * 0.85).astype(np.uint8)
WOOD_BASE[:, :, 1] = (WOOD_BASE_VAL * 1.05).astype(np.uint8)
WOOD_BASE[:, :, 2] = (WOOD_BASE_VAL * 1.35).astype(np.uint8)

def render_film06_frame(i):
    t = i / TOTAL_FRAMES
    frame = WOOD_BASE.copy()
    
    # Sunbeam overlay
    beam = frame.copy()
    pts = np.array([
        [WIDTH, int(HEIGHT * 0.05)],
        [int(WIDTH * 0.55), 0],
        [int(WIDTH * 0.15), HEIGHT],
        [WIDTH, HEIGHT]
    ], np.int32)
    cv2.fillPoly(beam, [pts], bgr(PALETTE["amber_gold"]))
    cv2.addWeighted(beam, 0.16, frame, 0.84, 0, frame)
    
    # Open academic notebook on desk
    nb_w, nb_h = 360, 240
    nb_x, nb_y = int(WIDTH * 0.35), int(HEIGHT * 0.45)
    
    cv2.rectangle(frame, (nb_x + 8, nb_y + 8), (nb_x + nb_w + 8, nb_y + nb_h + 8), bgr(PALETTE["ink_black"]), -1)
    cv2.rectangle(frame, (nb_x, nb_y), (nb_x + nb_w, nb_y + nb_h), bgr(PALETTE["paper_white"]), -1)
    cv2.rectangle(frame, (nb_x, nb_y), (nb_x + nb_w, nb_y + nb_h), bgr(PALETTE["warm_ivory"]), 1, cv2.LINE_AA)
    cv2.line(frame, (nb_x + nb_w//2, nb_y), (nb_x + nb_w//2, nb_y + nb_h), bgr(PALETTE["muted_silver"]), 2)
    
    for ly in range(nb_y + 20, nb_y + nb_h - 15, 16):
        cv2.line(frame, (nb_x + 15, ly), (nb_x + nb_w//2 - 15, ly), bgr(PALETTE["muted_silver"]), 1)
        cv2.line(frame, (nb_x + nb_w//2 + 15, ly), (nb_x + nb_w - 15, ly), bgr(PALETTE["muted_silver"]), 1)
        
    cv2.line(frame, (nb_x - 45, nb_y + 10), (nb_x - 45, nb_y + nb_h - 10), bgr(PALETTE["amber_gold"]), 6)
    cv2.line(frame, (nb_x + nb_w + 35, nb_y + 30), (nb_x + nb_w + 35, nb_y + nb_h - 40), bgr(PALETTE["graphite"]), 3)
    
    # Hovering thought diagram
    thought_alpha = 0.5 * math.sin(t * 2 * math.pi)
    if thought_alpha > 0:
        diag_cx, diag_cy = nb_x + nb_w//4, nb_y + nb_h//2 - 35
        for ring_r in [22, 38]:
            cv2.circle(frame, (diag_cx, diag_cy), ring_r, bgr(PALETTE["subtle_cyan"]), 1, cv2.LINE_AA)
        cv2.circle(frame, (diag_cx, diag_cy), 4, bgr(PALETTE["warm_ivory"]), -1, cv2.LINE_AA)
        
    # Floating sunbeam dust motes
    np.random.seed(42)
    for mote_idx in range(40):
        base_mx = np.random.uniform(WIDTH * 0.2, WIDTH * 0.9)
        base_my = np.random.uniform(HEIGHT * 0.1, HEIGHT * 0.85)
        mx = int((base_mx + math.sin(t * 2 * math.pi + mote_idx) * 25) % WIDTH)
        my = int((base_my - t * 45.0 + mote_idx * 15) % HEIGHT)
        cv2.circle(frame, (mx, my), 2, bgr(PALETTE["warm_ivory"]), -1, cv2.LINE_AA)

    return add_vignette_and_grain(frame, strength=0.35)

# -------------------------------------------------------------
# FILM 07: KNOWLEDGE THROUGH TIME
# -------------------------------------------------------------
def render_film07_frame(i):
    t = i / TOTAL_FRAMES
    frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    frame[:] = bgr(PALETTE["ink_black"])
    
    track_x = t * WIDTH
    eras = [
        ("Parchment & Ink", PALETTE["amber_gold"]),
        ("Print Press", PALETTE["paper_white"]),
        ("Blueprint", PALETTE["mineral_blue"]),
        ("Photo Emulsion", PALETTE["muted_silver"]),
        ("Silicon Chip", PALETTE["emerald"]),
        ("Digital Matrix", PALETTE["subtle_cyan"]),
        ("AI Tensor Lattice", PALETTE["warm_ivory"])
    ]
    
    col_w = WIDTH // len(eras) + 20
    for idx, (era_name, era_col) in enumerate(eras):
        ex = int(idx * col_w - track_x * 0.5) % WIDTH
        stratum = frame.copy()
        cv2.rectangle(stratum, (ex, 80), (ex + col_w - 15, HEIGHT - 80), bgr(era_col), -1)
        cv2.addWeighted(stratum, 0.12, frame, 0.88, 0, frame)
        cv2.rectangle(frame, (ex, 80), (ex + col_w - 15, HEIGHT - 80), bgr(era_col), 1, cv2.LINE_AA)
        
        if idx == 0:
            for sy in range(120, HEIGHT - 120, 24):
                cv2.line(frame, (ex + 15, sy), (ex + col_w - 30, sy), bgr(PALETTE["amber_gold"]), 2)
        elif idx == 2:
            for bx in range(ex + 10, ex + col_w - 15, 14):
                cv2.line(frame, (bx, 100), (bx, HEIGHT - 100), bgr(PALETTE["mineral_blue"]), 1)
        elif idx == 4:
            for cy in range(120, HEIGHT - 120, 30):
                cv2.rectangle(frame, (ex + 15, cy), (ex + 35, cy + 12), bgr(PALETTE["emerald"]), -1)
        elif idx == 6:
            for ny in range(120, HEIGHT - 120, 35):
                cv2.circle(frame, (ex + col_w//2 - 8, ny), 4, bgr(PALETTE["warm_ivory"]), -1, cv2.LINE_AA)
                
    beam_y = int(HEIGHT * 0.5 + math.sin(t * 2 * math.pi) * 20)
    draw_antialiased_line(frame, (0, beam_y), (WIDTH, beam_y), PALETTE["warm_ivory"], 2, 0.85)
    beam_glow = frame.copy()
    cv2.line(beam_glow, (0, beam_y), (WIDTH, beam_y), bgr(PALETTE["amber_gold"]), 12)
    cv2.addWeighted(beam_glow, 0.25, frame, 0.75, 0, frame)

    return add_vignette_and_grain(frame, strength=0.38)

# -------------------------------------------------------------
# FILM 08: THE KNOWLEDGE HORIZON
# -------------------------------------------------------------
# Vectorized sky base
SKY_BASE = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
UPPER_MASK = GRID_Y < 0.5
LOWER_MASK = ~UPPER_MASK

F_UPPER = GRID_Y[UPPER_MASK] / 0.5
SKY_BASE[UPPER_MASK, 0] = np.clip(PALETTE["ink_black"][2] * (1 - F_UPPER) + PALETTE["mineral_blue"][2] * F_UPPER * 0.4, 0, 255).astype(np.uint8)
SKY_BASE[UPPER_MASK, 1] = np.clip(PALETTE["ink_black"][1] * (1 - F_UPPER) + PALETTE["mineral_blue"][1] * F_UPPER * 0.4, 0, 255).astype(np.uint8)
SKY_BASE[UPPER_MASK, 2] = np.clip(PALETTE["ink_black"][0] * (1 - F_UPPER) + PALETTE["mineral_blue"][0] * F_UPPER * 0.4, 0, 255).astype(np.uint8)

F_LOWER = (GRID_Y[LOWER_MASK] - 0.5) / 0.5
SKY_BASE[LOWER_MASK, 0] = np.clip(PALETTE["mineral_blue"][2] * 0.4 * (1 - F_LOWER) + PALETTE["amber_gold"][2] * F_LOWER * 0.3, 0, 255).astype(np.uint8)
SKY_BASE[LOWER_MASK, 1] = np.clip(PALETTE["mineral_blue"][1] * 0.4 * (1 - F_LOWER) + PALETTE["amber_gold"][1] * F_LOWER * 0.5, 0, 255).astype(np.uint8)
SKY_BASE[LOWER_MASK, 2] = np.clip(PALETTE["mineral_blue"][0] * 0.4 * (1 - F_LOWER) + PALETTE["amber_gold"][0] * F_LOWER * 0.7, 0, 255).astype(np.uint8)

def render_film08_frame(i):
    t = i / TOTAL_FRAMES
    frame = SKY_BASE.copy()
    
    constellations = [
        [(WIDTH * 0.35, HEIGHT * 0.18), (WIDTH * 0.45, HEIGHT * 0.14), (WIDTH * 0.55, HEIGHT * 0.22), (WIDTH * 0.42, HEIGHT * 0.28)],
        [(WIDTH * 0.68, HEIGHT * 0.12), (WIDTH * 0.78, HEIGHT * 0.19), (WIDTH * 0.85, HEIGHT * 0.15)]
    ]
    for const in constellations:
        pts = [(int(x), int(y)) for x, y in const]
        for p_idx in range(len(pts) - 1):
            draw_antialiased_line(frame, pts[p_idx], pts[p_idx + 1], PALETTE["warm_ivory"], 1, 0.45)
        for pt in pts:
            cv2.circle(frame, pt, 3, bgr(PALETTE["warm_ivory"]), -1, cv2.LINE_AA)
            cv2.circle(frame, pt, 7, bgr(PALETTE["subtle_cyan"]), 1, cv2.LINE_AA)
            
    for layer in range(3):
        cloud_y = int(HEIGHT * 0.62 + layer * 30)
        overlay = frame.copy()
        for x in range(0, WIDTH, 35):
            wobble = math.sin(x * 0.015 + t * 2 * math.pi + layer) * 16
            cv2.circle(overlay, (x, int(cloud_y + wobble)), 45, bgr(PALETTE["paper_white"]), -1)
        cv2.addWeighted(overlay, 0.14 - layer * 0.02, frame, 0.86 + layer * 0.02, 0, frame)
        
    obs_x = int(WIDTH * 0.72)
    obs_y = int(HEIGHT * 0.65)
    cv2.rectangle(frame, (obs_x - 120, obs_y), (obs_x + 120, HEIGHT), bgr(PALETTE["charcoal"]), -1)
    cv2.ellipse(frame, (obs_x, obs_y), (85, 80), 0, 180, 360, bgr(PALETTE["graphite"]), -1)
    cv2.ellipse(frame, (obs_x, obs_y), (85, 80), 0, 180, 360, bgr(PALETTE["warm_ivory"]), 1, cv2.LINE_AA)
    cv2.line(frame, (obs_x, obs_y - 80), (obs_x, obs_y), bgr(PALETTE["amber_gold"]), 2, cv2.LINE_AA)
    
    col_w = int(180 - t * 60)
    cv2.rectangle(frame, (0, 0), (col_w, HEIGHT), bgr(PALETTE["ink_black"]), -1)
    for fl in range(20, col_w, 25):
        cv2.line(frame, (fl, 0), (fl, HEIGHT), bgr(PALETTE["charcoal"]), 2)

    return add_vignette_and_grain(frame, strength=0.32)

FILMS = [
    ("film01_campus_atlas", "The Living Campus Atlas", render_film01_frame),
    ("film02_trust_engine", "The Trust Engine", render_film02_frame),
    ("film03_collective_intelligence", "Collective Intelligence", render_film03_frame),
    ("film04_expert_network", "Expert Trust Network", render_film04_frame),
    ("film05_question_understanding", "From Question to Understanding", render_film05_frame),
    ("film06_deep_work", "Academic Deep Work", render_film06_frame),
    ("film07_knowledge_time", "Knowledge Through Time", render_film07_frame),
    ("film08_knowledge_horizon", "The Knowledge Horizon", render_film08_frame),
]

def main():
    print(f"Vectorized Rendering: 8 Films (16:9, {WIDTH}x{HEIGHT} @ {FPS} FPS, exactly {DURATION_SEC}s, 192 frames each)...", flush=True)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    
    for idx, (slug, title, render_fn) in enumerate(FILMS, 1):
        mp4_path = os.path.join(OUTPUT_DIR, f"{slug}.mp4")
        webp_path = os.path.join(OUTPUT_DIR, f"{slug}.webp")
        
        print(f"[{idx}/8] Rendering Film {idx:02d}: {title}...", end="", flush=True)
        video_writer = cv2.VideoWriter(mp4_path, fourcc, FPS, (WIDTH, HEIGHT))
        
        frames_pil = []
        for f in range(TOTAL_FRAMES):
            frame_bgr = render_fn(f)
            video_writer.write(frame_bgr)
            
            # Sample every 4th frame for WebP to keep file light and ultra-responsive
            if f % 4 == 0:
                frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
                frames_pil.append(Image.fromarray(frame_rgb))
                
        video_writer.release()
        
        if frames_pil:
            frames_pil[0].save(
                webp_path,
                save_all=True,
                append_images=frames_pil[1:],
                duration=int((1000 / FPS) * 4),
                loop=0,
                quality=78
            )
            
        print(" DONE!", flush=True)
        
    print("ALL 8 CINEMATIC FILMS SUCCESSFULLY GENERATED!", flush=True)

if __name__ == "__main__":
    main()
