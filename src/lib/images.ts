const MAX_EDGE = 2000;
const QUALITY = 0.85;

/**
 * Verkleinert Handyfotos vor dem Hochladen auf höchstens 2000 px Kantenlänge.
 * Kann der Browser das Bild nicht lesen (z. B. HEIC in Chrome), bleibt das
 * Original unverändert.
 */
export async function shrinkImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY),
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export function extensionFor(blob: Blob) {
  switch (blob.type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    default:
      return "jpg";
  }
}
