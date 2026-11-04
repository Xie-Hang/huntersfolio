# Trailer (placeholder music)

64 s, 1920×1080, 30 fps, H.264 + AAC, about −14 LUFS. Cut on a 90 BPM grid (a bar is 2.667 s), the hunt tempo.

1. `npm run build && npx vite preview --port 4173`
2. `node art/trailer/record.cjs art/trailer/out` (all seven shots, takes ~15 min; or name shots: gore brk forge gale cinder rime board)
3. `node art/trailer/cards.cjs art/trailer/out/cards`
4. `node art/trailer/edit.mjs art/trailer/out art/trailer/out/picture.mp4`
5. `node art/trailer/compose-trailer-music.mjs art/trailer/out/music.wav '[14.91,21.36,30.1,39.75,47.06,48.37]'` (the numbers are the moments that land, in trailer seconds)
6. `ffmpeg -i out/picture.mp4 -i out/music.wav -map 0:v -map 1:a -af "loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000" -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -t 64 -movflags +faststart out/Hunters-Folio-trailer.mp4`

The edit list in `edit.mjs` says which shot, which seconds and which crop go where. To use real music, drop step 5 and mux your track instead; cuts land on bar lines at 90 BPM.
