# Meta media and demo account verification

MuseOrg employees can now use the selected Meta connection for image generation,
image editing, file transcription and SAM segmentation through the existing
provider-neutral media port. The same employee runtime, approval checks, durable
effect journal, shared computer and chat attachments handle these operations.
Other model connections do not inherit the Meta credential or these capabilities.

## Live evidence

The checks used a synthetic spoken brief and generated product image. No customer
recordings or production content were used.

- Meta Voice transcribed the brief, retaining speaker turns, duration, source hash,
  a structured result and a readable transcript on the shared computer.
- A noun-only SAM request returned no matches. It remained a structured empty
  result; no substitute mask was invented.
- A source-pixel region request produced a real SAM mask, overlay, transparent
  cutout and raw geometry. Decoded pixels retained the bottle while keeping the
  background and handle opening transparent.
- The employee edited that saved cutout into a campaign image. Its receipt's
  source hash matched the cutout bytes. The image displayed in the normal chat.
- All three application media jobs completed and retained their files. A separate
  live image edit produced a Hindi candidate. Generated copy remains subject to
  human review; these checks do not claim a semantic quality score.
- After updating the Computer image, the saved media survived. A further employee
  run normalized an MP3 brief with FFmpeg, transcribed it through the native tool
  and read the saved transcript. Video input uses the same normalization path but
  has not yet had a separate live application check.
- The saved Instagram connection returned the expected demo profile as a Business
  account. Facebook returned the expected demo Page and its management tasks.
  These were read operations and do not establish publishing or reply delivery.
- The developer app was created with Threads, Instagram, Pages, WhatsApp and Ads
  Agentic use cases. It remains unpublished.
- The demo Threads profile accepted its tester invitation. Its generated test
  token was saved encrypted and a direct profile API read returned the expected
  identity. This does not establish a connected in-app publishing path.

Protocol corrections were verified against actual responses: image editing uses
the image endpoint's JSON input shape; SAM uses completed Responses events and the
official parser. An unsupported image-endpoint option was removed after a rejected
probe. Early visual inspection found an alpha-channel error; explicit RGBA output
and decoded-pixel tests now cover that case.

## Offline checks

Focused media-provider, durable-effect, capability-selection and action-approval
tests pass. They cover captured synthetic SAM geometry, no-match output, truncated
streams, audio encoding, authenticated request shape, credential isolation, source
load failure before submission, attachment recovery and sanitized provider errors.
The adapter type check, API/worker builds and generated skill check also passed.
The parser's upstream SAM license is retained with its attribution.

## Outstanding

- WAV and MP3 transcription are verified; separate video-input proof remains.
- In-app Threads publishing and the official Ads MCP path still need live receipts.
  WhatsApp test-number provisioning and messaging were deferred by the user before
  its terms were accepted. Account creation alone is insufficient.
- Social publishing/staging, revision-bound authorization, scoped inbound replies,
  deployment and the complete marketing rehearsal remain separate acceptance work.
- This evidence does not complete the broader organization requirements in
  [the product goal](../MUSEORG_GOAL.md).

## Protocol references

- [Meta image generation](https://dev.meta.ai/docs/image-generation)
- [Meta speech to text](https://dev.meta.ai/docs/speech-to-text)
- [SAM segmentation](https://dev.meta.ai/docs/sam/segmenting)
- [SAM client libraries](https://dev.meta.ai/docs/sam/client-libraries)
