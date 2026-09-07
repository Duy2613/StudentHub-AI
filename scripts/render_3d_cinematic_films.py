import os
import sys
import math
import cv2
import numpy as np
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)


FPS = 24
DURATION_SEC = 8.0
TOTAL_FRAMES = int(FPS * DURATION_SEC) # 192 frames
WIDTH = 1280
HEIGHT = 720

OUTPUT_DIR = os.path.abspath("frontend/public/videos/academic")
POSTER_DIR = os.path.abspath("frontend/public/images/academic")
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(POSTER_DIR, exist_ok=True)

# Master Source Images Mapping
SOURCE_IMAGES = [
    ("film01_campus_atlas", "frontend/public/images/academic/film01_campus_atlas.jpg"),
    ("film02_trust_engine", "C:/Users/Duy/.gemini/antigravity-ide/brain/767935f3-7647-4d29-9c27-3237dddf0960/film02_trust_engine_master_1788679249905.jpg"),
    ("film03_collective_intelligence", "frontend/public/images/atlas/atlas-hero-library.webp"),
    ("film04_expert_network", "frontend/public/images/atlas/atlas-expert-corridor.webp"),
    ("film05_question_understanding", "frontend/public/images/academic/academic_campus_sanctuary.jpg"),
    ("film06_deep_work", "frontend/public/images/atlas/atlas-community-commons.webp"),
    ("film07_knowledge_time", "frontend/public/images/academic/academic_library_commons.jpg"),
    ("film08_knowledge_horizon", "frontend/public/images/atlas/atlas-closing-threshold.webp"),
]

# Color Palettes (BGR for OpenCV)
CYAN_GLOW = (218, 189, 56)
EMERALD_GLOW = (136, 175, 46)
GOLD_GLOW = (85, 176, 232)
PURPLE_GLOW = (247, 85, 168)
WARM_WHITE = (235, 243, 246)

# Precomputed Vignette & Grain
Y_VIG, X_VIG = np.ogrid[:HEIGHT, :WIDTH]
CX_VIG, CY_VIG = WIDTH / 2.0, HEIGHT / 2.0
DIST_VIG = np.sqrt(((X_VIG - CX_VIG) / CX_VIG) ** 2 + ((Y_VIG - CY_VIG) / CY_VIG) ** 2)
VIGNETTE_MASK = np.clip(1.0 - (DIST_VIG * 0.32), 0.30, 1.0)
VIGNETTE_MASK_3D = np.dstack([VIGNETTE_MASK] * 3).astype(np.float32)

def compute_depth_map(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (21, 21), 0)
    # Vertical gradient prior (objects at bottom are usually nearer in architectural perspectives)
    y_prior = np.linspace(1.0, 0.2, HEIGHT, dtype=np.float32)[:, None]
    depth = (blurred.astype(np.float32) / 255.0) * 0.6 + y_prior * 0.4
    return cv2.normalize(depth, None, 0.1, 1.0, cv2.NORM_MINMAX)

def apply_3d_camera_warp(img, depth, t, amp_x=22.0, amp_y=12.0, zoom_amp=0.07):
    # Perfect seamless 8s loop with periodic trigonometric trajectory
    phase = 2.0 * math.pi * t
    dx = amp_x * math.sin(phase)
    dy = amp_y * math.sin(2.0 * phase)
    zoom = 1.0 + zoom_amp * (0.5 - 0.5 * math.cos(phase))

    # Base grid
    grid_x, grid_y = np.meshgrid(np.arange(WIDTH, dtype=np.float32), np.arange(HEIGHT, dtype=np.float32))

    # Real 3D parallax: near pixels (depth ~ 1) move more than far pixels (depth ~ 0.1)
    map_x = grid_x + dx * depth + (grid_x - CX_VIG) * (zoom - 1.0)
    map_y = grid_y + dy * depth + (grid_y - CY_VIG) * (zoom - 1.0)

    warped = cv2.remap(img, map_x, map_y, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    return warped

def add_post_processing(frame, grain_sigma=3.5):
    # Apply vignette
    vignetted = (frame.astype(np.float32) * VIGNETTE_MASK_3D).astype(np.uint8)
    # Subtle film grain
    noise = np.random.normal(0, grain_sigma, (HEIGHT, WIDTH, 3)).astype(np.int16)
    result = np.clip(vignetted.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    return result

# ----------------------------------------------------------------------
# 3D SIMULATION EFFECTS FOR EACH FILM
# ----------------------------------------------------------------------

def sim_film01_atlas(frame, t):
    # 3D Luminous Fiber-Optic Pulses along the campus model
    h, w = frame.shape[:2]
    routes = [
        [(580, 520), (670, 480), (740, 420), (820, 390)],
        [(670, 480), (780, 520), (890, 500), (960, 460)],
        [(450, 470), (530, 450), (620, 430), (710, 380)],
        [(620, 580), (700, 550), (790, 540), (880, 580)]
    ]
    for r_idx, route in enumerate(routes):
        speed = 1.0 + r_idx * 0.25
        pos = (t * speed + r_idx * 0.3) % 1.0
        n_segs = len(route) - 1
        seg_idx = min(int(pos * n_segs), n_segs - 1)
        seg_t = (pos * n_segs) - seg_idx
        p1 = route[seg_idx]
        p2 = route[seg_idx + 1]
        px = int(p1[0] + (p2[0] - p1[0]) * seg_t)
        py = int(p1[1] + (p2[1] - p1[1]) * seg_t)

        overlay = frame.copy()
        cv2.circle(overlay, (px, py), 12, GOLD_GLOW, -1)
        cv2.circle(overlay, (px, py), 5, WARM_WHITE, -1)
        cv2.addWeighted(overlay, 0.45, frame, 0.55, 0, frame)
    return frame

def sim_film02_trust(frame, t):
    # 3D Holographic Emerald Laser Scanning Plane sweeping across the parchment
    h, w = frame.shape[:2]
    laser_progress = 0.5 + 0.5 * math.sin(2.0 * math.pi * t)
    laser_y = int(480 + laser_progress * 150)
    laser_tilt = int(math.sin(2.0 * math.pi * t) * 15)

    overlay = frame.copy()
    pt1 = (360, laser_y - laser_tilt)
    pt2 = (880, laser_y + laser_tilt)
    cv2.line(overlay, pt1, pt2, (100, 255, 100), 2, cv2.LINE_AA)
    cv2.line(overlay, pt1, pt2, (80, 230, 80), 8, cv2.LINE_AA)
    pts_cone = np.array([[630, 310], pt1, pt2], np.int32)
    cv2.fillPoly(overlay, [pts_cone], (40, 180, 50))

    caustic_alpha = 0.25 + 0.20 * math.sin(2.0 * math.pi * t * 2)
    cv2.addWeighted(overlay, caustic_alpha, frame, 1.0 - caustic_alpha, 0, frame)

    for p in range(16):
        px = int(420 + ((p * 29 + t * 90) % 420))
        py = int(laser_y + math.sin(t * 2 * math.pi + p) * 18)
        if 0 <= px < w and 0 <= py < h:
            cv2.circle(frame, (px, py), 2, WARM_WHITE, -1)
    return frame

def sim_film03_collective(frame, t):
    # 3D Neural Constellation Swarm
    h, w = frame.shape[:2]
    cx, cy = int(w * 0.62), int(h * 0.38)
    particles = []
    num_particles = 70
    for p in range(num_particles):
        speed = 0.6 + 0.4 * (p / num_particles)
        phase = p * 0.15
        theta = 2.0 * math.pi * t * speed + phase
        r = 70 + (p * 3.2) + math.sin(2.0 * math.pi * t + phase) * 25
        z = math.sin(theta) * 0.5 + 0.5
        px = int(cx + math.cos(theta) * r * 1.5)
        py = int(cy + math.sin(theta) * r * 0.75 - z * 30)
        particles.append((px, py, z))

    overlay = frame.copy()
    for idx1 in range(0, len(particles), 3):
        x1, y1, z1 = particles[idx1]
        for idx2 in range(idx1 + 1, min(idx1 + 6, len(particles))):
            x2, y2, z2 = particles[idx2]
            dist = math.hypot(x2 - x1, y2 - y1)
            if dist < 65:
                alpha = (1.0 - dist / 65.0) * 0.35 * (z1 + z2) * 0.5
                cv2.line(overlay, (x1, y1), (x2, y2), CYAN_GLOW, 1, cv2.LINE_AA)

    for px, py, z in particles:
        if 0 <= px < w and 0 <= py < h:
            size = max(1, int(2 + z * 2.5))
            color = GOLD_GLOW if z > 0.6 else CYAN_GLOW
            cv2.circle(overlay, (px, py), size, color, -1, cv2.LINE_AA)

    cv2.addWeighted(overlay, 0.60, frame, 0.40, 0, frame)
    return frame

def sim_film04_expert(frame, t):
    h, w = frame.shape[:2]
    overlay = frame.copy()
    sweep = math.sin(2.0 * math.pi * t) * 60
    pts_beam = np.array([
        [int(w * 0.65 + sweep), 0],
        [int(w * 0.85 + sweep), 0],
        [int(w * 0.95 + sweep * 1.5), h],
        [int(w * 0.55 + sweep * 1.5), h]
    ], np.int32)
    cv2.fillPoly(overlay, [pts_beam], (30, 45, 60))
    cv2.addWeighted(overlay, 0.20, frame, 0.80, 0, frame)

    glint_x = int(w * 0.72 + math.sin(2.0 * math.pi * t) * 15)
    glint_y = int(h * 0.62 + math.cos(2.0 * math.pi * t) * 8)
    cv2.circle(frame, (glint_x, glint_y), 4, WARM_WHITE, -1)
    return frame

def sim_film05_learning(frame, t):
    h, w = frame.shape[:2]
    bridge_pts = [(int(w * 0.05), int(h * 0.68)), (int(w * 0.35), int(h * 0.48)), (int(w * 0.75), int(h * 0.52)), (int(w * 0.98), int(h * 0.58))]
    pulse_pos = (t * 1.5) % 1.0
    n = len(bridge_pts) - 1
    idx = min(int(pulse_pos * n), n - 1)
    sub_t = (pulse_pos * n) - idx
    px = int(bridge_pts[idx][0] + (bridge_pts[idx+1][0] - bridge_pts[idx][0]) * sub_t)
    py = int(bridge_pts[idx][1] + (bridge_pts[idx+1][1] - bridge_pts[idx][1]) * sub_t)

    overlay = frame.copy()
    cv2.circle(overlay, (px, py), 18, (240, 200, 80), -1)
    cv2.circle(overlay, (px, py), 6, WARM_WHITE, -1)
    cv2.addWeighted(overlay, 0.45, frame, 0.55, 0, frame)
    return frame

def sim_film06_deep_work(frame, t):
    h, w = frame.shape[:2]
    overlay = frame.copy()
    num_drops = 35
    for d in range(num_drops):
        seed = d * 47.1
        rx = int((seed * 31) % (w * 0.45))
        speed = 0.8 + 0.4 * (d % 3)
        ry = int((t * h * speed + seed * 19) % h)
        length = int(12 + (d % 4) * 8)
        cv2.line(overlay, (rx, ry), (rx + 2, ry + length), (180, 200, 220), 1, cv2.LINE_AA)

    lamp_alpha = 0.08 + 0.04 * math.sin(2.0 * math.pi * t * 3.0)
    cv2.circle(overlay, (int(w * 0.82), int(h * 0.42)), 180, (40, 100, 160), -1)
    cv2.addWeighted(overlay, 0.35, frame, 0.65, 0, frame)
    return frame

def sim_film07_knowledge_time(frame, t):
    h, w = frame.shape[:2]
    overlay = frame.copy()
    ray_angle = math.sin(2.0 * math.pi * t) * 45
    pts_ray = np.array([
        [int(w * 0.5 + ray_angle), 0],
        [int(w * 0.65 + ray_angle), 0],
        [int(w * 0.85 + ray_angle * 1.8), h],
        [int(w * 0.45 + ray_angle * 1.8), h]
    ], np.int32)
    cv2.fillPoly(overlay, [pts_ray], (60, 110, 150))
    cv2.addWeighted(overlay, 0.22, frame, 0.78, 0, frame)

    for m in range(25):
        mx = int((m * 57 + t * 45) % w)
        my = int((m * 37 + math.sin(2 * math.pi * t + m) * 20) % h)
        cv2.circle(frame, (mx, my), 2, GOLD_GLOW, -1)
    return frame

def sim_film08_horizon(frame, t):
    h, w = frame.shape[:2]
    overlay = frame.copy()
    dawn_pulse = math.sin(2.0 * math.pi * t) * 30
    cv2.rectangle(overlay, (int(w * 0.52), int(h * 0.22)), (w, int(h * 0.72)), (40, 90, 140), -1)
    cv2.addWeighted(overlay, 0.18 + 0.08 * math.sin(2.0 * math.pi * t), frame, 0.82, 0, frame)

    for rip in range(12):
        r_y = int(h * 0.75 + rip * 18)
        r_x = int(w * 0.25 + math.sin(2.0 * math.pi * t * 2.0 + rip) * 40)
        cv2.line(frame, (r_x - 30, r_y), (r_x + 30, r_y), (140, 200, 180), 1, cv2.LINE_AA)
    return frame

SIMULATORS = {
    "film01_campus_atlas": sim_film01_atlas,
    "film02_trust_engine": sim_film02_trust,
    "film03_collective_intelligence": sim_film03_collective,
    "film04_expert_network": sim_film04_expert,
    "film05_question_understanding": sim_film05_learning,
    "film06_deep_work": sim_film06_deep_work,
    "film07_knowledge_time": sim_film07_knowledge_time,
    "film08_knowledge_horizon": sim_film08_horizon,
}

# ----------------------------------------------------------------------
# MASTER RENDERING LOOP
# ----------------------------------------------------------------------

def render_film(film_id, src_path):
    print(f"🎬 Rendering 3D Animation Video for [{film_id}] from {src_path}...")
    
    # 1. Load source image and resize to 1280x720 16:9 master
    pil_img = Image.open(src_path).convert("RGB")
    src_rgb = np.array(pil_img)
    src_bgr = cv2.cvtColor(src_rgb, cv2.COLOR_RGB2BGR)
    src_bgr = cv2.resize(src_bgr, (WIDTH, HEIGHT), interpolation=cv2.INTER_LANCZOS4)

    # Save master poster image to POSTER_DIR
    poster_path = os.path.join(POSTER_DIR, f"{film_id}.jpg")
    cv2.imwrite(poster_path, src_bgr, [cv2.IMWRITE_JPEG_QUALITY, 95])

    # 2. Compute 3D depth map
    depth = compute_depth_map(src_bgr)

    # 3. Setup Video Writer
    mp4_path = os.path.join(OUTPUT_DIR, f"{film_id}.mp4")
    webp_path = os.path.join(OUTPUT_DIR, f"{film_id}.webp")

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(mp4_path, fourcc, FPS, (WIDTH, HEIGHT))

    frames_pil = []
    simulator = SIMULATORS.get(film_id, lambda f, t: f)

    for i in range(TOTAL_FRAMES):
        t = i / float(TOTAL_FRAMES)
        
        # A. 3D Camera Warp with perspective parallax
        warped = apply_3d_camera_warp(src_bgr, depth, t)
        
        # B. 3D Physical Simulation Layer
        simulated = simulator(warped, t)
        
        # C. Cinematic Post Processing (vignette & film grain)
        final_frame = add_post_processing(simulated)

        # Write MP4
        writer.write(final_frame)

        # Collect every 2nd frame for WebP (96 frames @ 12fps)
        if i % 2 == 0:
            frame_rgb = cv2.cvtColor(final_frame, cv2.COLOR_BGR2RGB)
            thumb = cv2.resize(frame_rgb, (854, 480), interpolation=cv2.INTER_AREA)
            frames_pil.append(Image.fromarray(thumb))

        if (i + 1) % 48 == 0:
            print(f"  -> Progress: {i + 1}/{TOTAL_FRAMES} frames rendered ({int((i+1)/TOTAL_FRAMES*100)}%)")

    writer.release()
    print(f"  ✓ MP4 saved: {mp4_path} ({os.path.getsize(mp4_path):,} bytes)")

    # Save animated WebP
    if frames_pil:
        frames_pil[0].save(
            webp_path,
            save_all=True,
            append_images=frames_pil[1:],
            duration=int(1000 / (FPS / 2)), # ~83ms per frame
            loop=0,
            quality=82,
            method=4
        )
        print(f"  ✓ WebP saved: {webp_path} ({os.path.getsize(webp_path):,} bytes)")

def main():
    print("=" * 70)
    print("⚡ StudentHub AI — Master 3D Cinematic Animation Generator")
    print(f"🎯 Target: 8 Films @ 1280x720 24FPS (8.00s = 192 frames per film)")
    print("=" * 70)

    for film_id, src_path in SOURCE_IMAGES:
        render_film(film_id, src_path)

    print("\n🎉 ALL 8 3D CINEMATIC ANIMATION VIDEOS RENDERED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
