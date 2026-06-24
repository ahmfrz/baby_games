"""
Asset Generator for Baby Games Platform
Creates images and sounds for the Alphabet Learner game
"""

import os
import json
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from scipy.io import wavfile
import random

# Configuration
IMAGES_DIR = "games/alphabet-learner/assets/images"
SOUNDS_DIR = "games/alphabet-learner/assets/sounds"
IMAGE_SIZE = 256
COLORS = [
    "#FF6B9D",  # Pink
    "#4ECDC4",  # Teal
    "#FFE66D",  # Yellow
    "#95E1D3",  # Mint
    "#C7A0FF",  # Purple
    "#FF9A56",  # Orange
    "#FF7675",  # Red
    "#74B9FF",  # Light Blue
    "#A29BFE",  # Lavender
    "#55EFC4",  # Green
]

# Character definitions with emoji
CHARACTERS = {
    # Letters with associated emojis
    "A": ("🍎", "Apple"),
    "B": ("🎈", "Ball"),
    "C": ("🐱", "Cat"),
    "D": ("🐶", "Dog"),
    "E": ("🐘", "Elephant"),
    "F": ("🐠", "Fish"),
    "G": ("🦒", "Giraffe"),
    "H": ("🏠", "House"),
    "I": ("🍦", "Ice Cream"),
    "J": ("🪼", "Jellyfish"),
    "K": ("🪁", "Kite"),
    "L": ("🦁", "Lion"),
    "M": ("🐵", "Monkey"),
    "N": ("🪹", "Nest"),
    "O": ("🍊", "Orange"),
    "P": ("🐷", "Pig"),
    "Q": ("👑", "Queen"),
    "R": ("🌈", "Rainbow"),
    "S": ("☀️", "Sun"),
    "T": ("🐅", "Tiger"),
    "U": ("☂️", "Umbrella"),
    "V": ("🚐", "Van"),
    "W": ("🐋", "Whale"),
    "X": ("🎹", "Xylophone"),
    "Y": ("🪀", "Yo-yo"),
    "Z": ("🦓", "Zebra"),
    # Numbers
    "0": ("🍩", "Zero"),
    "1": ("☝️", "One"),
    "2": ("✌️", "Two"),
    "3": ("🤟", "Three"),
    "4": ("✋", "Four"),
    "5": ("🖐️", "Five"),
    "6": ("👌", "Six"),
    "7": ("🎯", "Seven"),
    "8": ("♾️", "Eight"),
    "9": ("🎲", "Nine"),
}

def create_directories():
    """Create necessary directories"""
    os.makedirs(IMAGES_DIR, exist_ok=True)
    os.makedirs(SOUNDS_DIR, exist_ok=True)
    print(f"✓ Created directories: {IMAGES_DIR}, {SOUNDS_DIR}")

def generate_character_image(char, emoji, name):
    """Generate a colorful image for a character"""
    # Create image with random gradient background
    color = random.choice(COLORS)
    rgb = tuple(int(color[i:i+2], 16) for i in (1, 3, 5))
    
    img = Image.new("RGB", (IMAGE_SIZE, IMAGE_SIZE), rgb)
    draw = ImageDraw.Draw(img)
    
    # Add white border
    border_width = 8
    draw.rectangle(
        [(border_width, border_width), 
         (IMAGE_SIZE - border_width, IMAGE_SIZE - border_width)],
        outline="white",
        width=3
    )
    
    # Draw character (letter or number) in the middle
    try:
        # Try to use a larger font size
        font_size = 140
        font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
    
    # Draw the character (letter or number)
    char_text = char
    bbox = draw.textbbox((0, 0), char_text, font=font)
    char_width = bbox[2] - bbox[0]
    char_height = bbox[3] - bbox[1]
    
    x = (IMAGE_SIZE - char_width) // 2
    y = (IMAGE_SIZE - char_height) // 2 - 20
    
    draw.text((x, y), char_text, fill="white", font=font)
    
    # Draw emoji below character
    emoji_text = emoji
    emoji_size = 80
    try:
        emoji_font = ImageFont.load_default()
    except:
        emoji_font = font
    
    emoji_bbox = draw.textbbox((0, 0), emoji_text, font=emoji_font)
    emoji_width = emoji_bbox[2] - emoji_bbox[0]
    emoji_x = (IMAGE_SIZE - emoji_width) // 2
    emoji_y = IMAGE_SIZE - 100
    
    draw.text((emoji_x, emoji_y), emoji_text, fill="white", font=emoji_font)
    
    # Save image
    filename = f"{char}-{name.lower()}.png"
    filepath = os.path.join(IMAGES_DIR, filename)
    img.save(filepath)
    print(f"  ✓ Generated image: {filename}")
    return filename

def generate_images():
    """Generate all character images"""
    print("\n📸 Generating character images...")
    manifest_images = {}
    
    for char, (emoji, name) in CHARACTERS.items():
        filename = generate_character_image(char, emoji, name)
        manifest_images[char] = {
            "imagePath": f"assets/images/{filename}",
            "name": name,
            "emoji": emoji
        }
    
    return manifest_images

def generate_sound(filename, frequency=440, duration=0.5, is_success=True):
    """Generate a simple beep sound"""
    sample_rate = 44100
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    if is_success:
        # Success sound: upward sweep beep
        freq_start = 400
        freq_end = 800
        freq = np.linspace(freq_start, freq_end, len(t))
        wave = np.sin(2 * np.pi * freq * t / sample_rate)
    else:
        # Fail sound: downward sweep buzzer
        freq_start = 800
        freq_end = 200
        freq = np.linspace(freq_start, freq_end, len(t))
        wave = np.sin(2 * np.pi * freq * t / sample_rate)
    
    # Add envelope to avoid clicks
    envelope = np.exp(-t / duration * 3)
    wave = wave * envelope
    
    # Normalize and convert to 16-bit audio
    wave = np.int16(wave / np.max(np.abs(wave)) * 32767 * 0.9)
    
    filepath = os.path.join(SOUNDS_DIR, filename)
    wavfile.write(filepath, sample_rate, wave)
    print(f"  ✓ Generated sound: {filename}")
    return filename

def generate_sounds():
    """Generate success and fail sounds"""
    print("\n🔊 Generating audio files...")
    
    success_file = generate_sound("success.wav", is_success=True)
    fail_file = generate_sound("fail.wav", is_success=False)
    
    return {
        "success": f"assets/sounds/{success_file}",
        "fail": f"assets/sounds/{fail_file}"
    }

def update_manifest(images, sounds):
    """Update manifest.json with all assets"""
    print("\n📝 Updating manifest.json...")
    
    manifest = {
        "name": "Alphabet & Numbers Learner",
        "version": "1.0.0",
        "characters": [],
        "sounds": sounds,
        "description": "Complete asset pack for Alphabet Learner game"
    }
    
    # Add characters in alphabetical order (A-Z, then 0-9)
    for char in sorted(CHARACTERS.keys()):
        if char.isalpha():
            manifest["characters"].append({
                "char": char,
                "imagePath": images[char]["imagePath"],
                "sound": "success",
                "name": images[char]["name"],
                "emoji": images[char]["emoji"]
            })
    
    for char in sorted([c for c in CHARACTERS.keys() if c.isdigit()]):
        manifest["characters"].append({
            "char": char,
            "imagePath": images[char]["imagePath"],
            "sound": "success",
            "name": images[char]["name"],
            "emoji": images[char]["emoji"]
        })
    
    filepath = "games/alphabet-learner/manifest.json"
    with open(filepath, "w") as f:
        json.dump(manifest, f, indent=2)
    
    print(f"  ✓ Updated: {filepath}")
    print(f"  ✓ Total characters: {len(manifest['characters'])}")

def main():
    """Main function"""
    print("🎮 Baby Games - Asset Generator")
    print("=" * 50)
    
    create_directories()
    images = generate_images()
    sounds = generate_sounds()
    update_manifest(images, sounds)
    
    print("\n" + "=" * 50)
    print("✅ Asset generation complete!")
    print(f"   📁 Images: {len(images)} files in {IMAGES_DIR}")
    print(f"   🔊 Sounds: 2 files in {SOUNDS_DIR}")
    print(f"   📋 Manifest: games/alphabet-learner/manifest.json")
    print("\nYour game is ready to play! 🎉")

if __name__ == "__main__":
    main()
