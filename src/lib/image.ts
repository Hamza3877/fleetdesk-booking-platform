/**
 * Shrinks an image the owner picked so it is small enough to store and fast to load.
 * It draws the photo onto a canvas (max 900px wide) and exports a compressed JPEG as a data URL.
 */
const MAX_WIDTH = 900;
const MAX_FILE_BYTES = 8 * 1024 * 1024;

export async function fileToResizedDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file (JPG, PNG or WebP).");
  if (file.size > MAX_FILE_BYTES) throw new Error("That image is larger than 8 MB. Please pick a smaller one.");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser couldn't process this image.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.8);
}
