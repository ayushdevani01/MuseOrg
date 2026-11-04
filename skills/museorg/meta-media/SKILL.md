---
name: meta-media
description: Turn a supplied recording and product image into traceable campaign artifacts.
---

Use the connected media tools when available. Their credentials stay in the worker;
never copy model keys into the shared computer or ask shell tools to retrieve them.

For a recording, call `transcribe_media` with its existing computer path. The tool
converts supported audio/video to mono PCM WAV when needed and retains the transcript,
speaker turns and source hash. Speaker labels are local to the recording, not verified
identities. Read the returned transcript before deriving a brief; flag missing or
uncertain facts rather than inventing an offer, price or launch date.

For an image, use `segment_image` with a short noun naming one object. Read the actual
result: zero matches is valid and supplies no mask. If needed, inspect the source and
provide an explicit region using the tool's `box` object with left, top, right and
bottom coordinates (right and bottom are exclusive). Keep the prompt a noun phrase;
the provider formats its own protocol. Coordinates
must be in the source image's pixels. The tool retains raw geometry, mask, cutout and
overlay separately. Use the returned paths for handoffs to another coworker.

Use `generate_image` to generate a visual, or pass `sourcePath` to edit a supplied image.
State the target locale, approved copy, brand and product constraints in the prompt.
Inspect the actual output for product identity, glyphs and layout; do not assume exact
text rendering. Use deterministic text composition when exact wording is required.

Media calls may cost money and use the normal approval controls. An uncertain or
interrupted submission must not be resubmitted automatically. Read its saved result or
report the blocker. Two new media submissions are allowed per run; continue a larger
task in a later user-authorized turn.

Register useful files against the current shared project revision. A changed offer,
locale or product makes dependent drafts stale. Keep external posts, messages and ads
within the existing action scopes; generated media does not itself authorize publishing
or spending.

Official protocol references:
- https://dev.meta.ai/docs/speech-to-text
- https://dev.meta.ai/docs/sam/segmenting
- https://dev.meta.ai/docs/sam/client-libraries
- https://dev.meta.ai/docs/image-generation
