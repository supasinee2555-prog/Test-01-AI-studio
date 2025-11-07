// Decodes a base64 string into a Uint8Array.
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decodes raw PCM audio data into an AudioBuffer that can be played by the browser.
// The Gemini TTS API returns audio at a 24000Hz sample rate.
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  // The raw data is 16-bit PCM, so we need to interpret the Uint8Array as an Int16Array.
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize the 16-bit integer samples to floating-point values between -1.0 and 1.0
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// A single function that wraps the decoding process.
export async function createAudioBuffer(base64Audio: string, audioContext: AudioContext): Promise<AudioBuffer> {
    const decodedBytes = decode(base64Audio);
    return await decodeAudioData(decodedBytes, audioContext);
}


function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Converts an AudioBuffer to a WAV file Blob. While the user requested an MP3,
 * client-side MP3 encoding is complex without external libraries. WAV is a
 * high-quality, uncompressed format that is widely supported.
 * @param buffer The AudioBuffer to convert.
 * @returns A Blob representing the WAV file.
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;
  const bitsPerSample = 16;
  
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const fileSize = 44 + dataSize;
  
  const arrayBuffer = new ArrayBuffer(fileSize);
  const view = new DataView(arrayBuffer);
  
  let offset = 0;
  
  // RIFF header
  writeString(view, offset, 'RIFF'); offset += 4;
  view.setUint32(offset, fileSize - 8, true); offset += 4;
  writeString(view, offset, 'WAVE'); offset += 4;
  
  // fmt sub-chunk
  writeString(view, offset, 'fmt '); offset += 4;
  view.setUint32(offset, 16, true); offset += 4; // Sub-chunk size (16 for PCM)
  view.setUint16(offset, 1, true); offset += 2; // Audio format (1 for PCM)
  view.setUint16(offset, numChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * numChannels * (bitsPerSample / 8), true); offset += 4; // Byte rate
  view.setUint16(offset, numChannels * (bitsPerSample / 8), true); offset += 2; // Block align
  view.setUint16(offset, bitsPerSample, true); offset += 2;
  
  // data sub-chunk
  writeString(view, offset, 'data'); offset += 4;
  view.setUint32(offset, dataSize, true); offset += 4;
  
  // Write PCM data
  const channelData = [];
  for (let i = 0; i < numChannels; i++) {
    channelData.push(buffer.getChannelData(i));
  }
  
  for (let i = 0; i < numSamples; i++) {
    for (let j = 0; j < numChannels; j++) {
      const sample = Math.max(-1, Math.min(1, channelData[j][i]));
      // Convert to 16-bit signed integer
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return new Blob([view], { type: 'audio/wav' });
}
