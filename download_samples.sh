#!/usr/bin/env bash
set -e

TARGET_DIR="assets/piano"

mkdir -p "$TARGET_DIR"

BASE_URL="https://tonejs.github.io/audio/salamander"

SAMPLES=(
    "A0.mp3"
    "C1.mp3" "Ds1.mp3" "Fs1.mp3" "A1.mp3"
    "C2.mp3" "Ds2.mp3" "Fs2.mp3" "A2.mp3"
    "C3.mp3" "Ds3.mp3" "Fs3.mp3" "A3.mp3"
    "C4.mp3" "Ds4.mp3" "Fs4.mp3" "A4.mp3"
    "C5.mp3" "Ds5.mp3" "Fs5.mp3" "A5.mp3"
    "C6.mp3" "Ds6.mp3" "Fs6.mp3" "A6.mp3"
    "C7.mp3" "Ds7.mp3" "Fs7.mp3" "A7.mp3"
    "C8.mp3"
)

echo "Downloading Salamander piano samples into: $TARGET_DIR"
total=${#SAMPLES[@]}
count=0

for sample in "${SAMPLES[@]}"; do
    count=$((count + 1))
    dest="${TARGET_DIR}/${sample}"
    if [ -f "$dest" ] && [ -s "$dest" ]; then
        echo "[$count/$total] Exists: $sample"
    else
        echo "[$count/$total] Downloading: $sample ..."
        curl -sSL -o "$dest" "${BASE_URL}/${sample}"
    fi
done

echo ""
echo "Successfully downloaded all $total piano samples to $TARGET_DIR."

