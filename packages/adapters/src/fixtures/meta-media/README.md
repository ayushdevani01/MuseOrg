# Segmentation fixture

`segmentation.txt` is a captured SAM box-prompt result for a synthetic product image
generated solely for a development check. It contains geometry and encoded mask data,
without account details, request identifiers or source image bytes. The source canvas
is 1600 by 1600 pixels. Tests independently check a background pixel, a foreground
pixel and the handle's hole to catch alpha/channel and coordinate errors.

The decoder is the pinned official `@meta-sam/parser` package. This fixture is an offline
protocol replay; passing it does not establish live account access.
