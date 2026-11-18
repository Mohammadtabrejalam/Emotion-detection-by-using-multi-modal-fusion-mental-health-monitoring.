export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || (!file.type.startsWith('audio/') && /\.(mp4|webm|flv)$/i.test(file.name));
}
