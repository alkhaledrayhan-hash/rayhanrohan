// Reads a File, optionally downscales it via <canvas>, returns a data URL.
// Used to store small inline avatars in profiles.avatar_url without a public bucket.
export async function fileToDataUrl(
  file: File,
  opts: { maxSize?: number; quality?: number; mime?: string } = {},
): Promise<string> {
  const maxSize = opts.maxSize ?? 512;
  const quality = opts.quality ?? 0.82;
  const mime = opts.mime ?? "image/jpeg";

  if (!file.type.startsWith("image/")) throw new Error("Please pick an image file.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Image too large. Max 8 MB.");

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

  // Decode and downscale via canvas
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Failed to read image"));
    el.src = dataUrl;
  });

  let { width, height } = img;
  const scale = Math.min(1, maxSize / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL(mime, quality);
}
