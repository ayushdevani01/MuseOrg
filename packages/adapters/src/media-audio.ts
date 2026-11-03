/** A bounded mono PCM16 WAV suitable for file transcription, without trusting its extension. */
export function isSupportedTranscriptionWav(bytes: Uint8Array): boolean {
  const data = Buffer.from(bytes);
  if (
    data.length < 44 ||
    data.toString("ascii", 0, 4) !== "RIFF" ||
    data.toString("ascii", 8, 12) !== "WAVE"
  )
    return false;
  let format = false;
  let byteRate = 0;
  for (let offset = 12; offset + 8 <= data.length; ) {
    const kind = data.toString("ascii", offset, offset + 4);
    const size = data.readUInt32LE(offset + 4);
    if (offset + 8 + size > data.length) return false;
    if (kind === "fmt " && size >= 16) {
      const sampleRate = data.readUInt32LE(offset + 12);
      byteRate = data.readUInt32LE(offset + 16);
      format =
        data.readUInt16LE(offset + 8) === 1 &&
        data.readUInt16LE(offset + 10) === 1 &&
        [16_000, 24_000].includes(sampleRate) &&
        data.readUInt16LE(offset + 22) === 16 &&
        data.readUInt16LE(offset + 20) === 2 &&
        byteRate === sampleRate * 2;
    }
    if (kind === "data") return format && size > 0 && size % 2 === 0 && size / byteRate <= 600;
    offset += 8 + size + (size % 2);
  }
  return false;
}
