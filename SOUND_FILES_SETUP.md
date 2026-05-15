# Quick Setup Guide - Adding Sound Files

## Step 1: Prepare Sound Files

You'll need 9 MP3 files for the complete sound effects experience:

### Required Sound Files
1. **click.mp3** - Short button click sound (~0.1-0.2s)
2. **correct.mp3** - Positive feedback sound (~0.5s)
3. **wrong.mp3** - Negative feedback sound (~0.5s)
4. **success.mp3** - Success/achievement sound (~0.8s)
5. **error.mp3** - Error alert sound (~0.4s)
6. **notification.mp3** - Notification chime (~0.3s)
7. **swipe.mp3** - Swipe/transition sound (~0.2s)
8. **levelup.mp3** - Achievement unlock sound (~1.5s)
9. **tick.mp3** - Timer tick sound (~0.1s)

## Step 2: Recommended Sound Sources

### Free Sound Libraries
- **Freesound.org** - https://freesound.org/
- **Zapsplat** - https://www.zapsplat.com/
- **OpenGameArt** - https://opengameart.org/
- **Mixkit** - https://mixkit.co/free-sound-effects/ui/

### Search Keywords
- "UI button click"
- "correct answer"
- "wrong answer"
- "success chime"
- "error sound"
- "notification ping"
- "whoosh transition"
- "level up unlock"
- "tick timer"

## Step 3: Place Files in Project

```
your-project-root/
├── App.js
├── assets/
│   └── sounds/
│       ├── click.mp3
│       ├── correct.mp3
│       ├── wrong.mp3
│       ├── success.mp3
│       ├── error.mp3
│       ├── notification.mp3
│       ├── swipe.mp3
│       ├── levelup.mp3
│       └── tick.mp3
```

## Step 4: Verify Setup

Check that:
1. All 9 MP3 files are in `assets/sounds/`
2. File names match exactly (case-sensitive)
3. Files are less than 5MB each (preferably under 1MB)
4. No corrupted files

## Step 5: Test in App

1. Start the app
2. Go to **Settings** → **Preferences** → **Sound Effects**
3. Toggle sound on
4. Click buttons - should hear click sound
5. Go to **Study** → Start a quiz
6. Answer a question correctly - should hear success sound
7. Answer incorrectly - should hear error sound

## Testing Sounds

### Manual Testing Commands (Terminal)

```bash
# List sound files
ls assets/sounds/

# Check MP3 file validity
file assets/sounds/*.mp3

# Get file sizes
du -h assets/sounds/
```

## Troubleshooting

### Sound Not Playing
**Problem**: No audio feedback
- [ ] Verify files exist in correct directory
- [ ] Check device volume is not muted
- [ ] Toggle sound setting off and on
- [ ] Restart the app
- [ ] Check app logs for warnings

### File Format Issues
**Problem**: Sound plays but quality is poor
- [ ] Ensure files are MP3 format
- [ ] Try converting from other formats using VLC or Audacity
- [ ] Verify bitrate is 128kbps or higher

### Duplicate Sound Effects
**Problem**: Sound plays multiple times
- [ ] Check if multiple buttons trigger the same sound
- [ ] Verify no duplicate sound manager instances
- [ ] Check for rapid repeated clicks

## File Format Specifications

### MP3 Specifications
- **Format**: MP3
- **Bitrate**: 128-320 kbps (recommended: 192 kbps)
- **Sample Rate**: 44.1 kHz or 48 kHz
- **Mono/Stereo**: Either works
- **Duration**: 0.1 - 2 seconds
- **Size**: Under 500 KB each

### Using Audacity to Convert Files
1. Open Audacity
2. File → Open → Select audio file
3. File → Export → Export as MP3
4. Set quality to 192 kbps
5. Save to `assets/sounds/`

### Using FFmpeg (Command Line)
```bash
ffmpeg -i input.wav -q:a 5 -codec:a libmp3lame -b:a 192k output.mp3
```

## Alternative: Disable Sound Files (Optional)

If you prefer to set up sound without files initially:

1. Sounds will gracefully skip loading
2. App continues working normally
3. No error messages or crashes
4. Add files later and restart app

## Next Steps

1. Download sound files from recommended sources
2. Convert to MP3 if needed (use Audacity or FFmpeg)
3. Place in `assets/sounds/` directory
4. Test in the app
5. Share feedback!

## Sound Design Tips

### For Better UX
- Keep UI sounds short and non-intrusive
- Use consistent volume levels
- Consider sound fatigue (not too many loud sounds)
- Test on different devices
- Add haptic feedback on Android for additional feedback

### Audio Files Recommendations by Use Case
- **Button Click**: 100-150ms, bright/sharp tone
- **Correct Answer**: 400-600ms, ascending pitch, satisfying
- **Wrong Answer**: 400-600ms, descending pitch, discouraging
- **Success**: 800ms-1s, chime/bell sound, celebratory
- **Error**: 300-400ms, warning tone, serious but not alarming

---

**Status**: ✅ Ready to set up sounds!
**Last Updated**: May 14, 2026
