/**
 * Store module-level pour la vidéo enregistrée.
 *
 * Le blob URL est créé et géré ICI (pas dans React state),
 * ce qui le rend insensible au double-mount de React StrictMode.
 */

interface VideoRecord {
  blob: Blob;
  mimeType: string;
  url: string; // blob URL, géré par ce store
}

let _record: VideoRecord | null = null;

export const videoStore = {
  /** Appeler depuis useMediaRecorder.onstop */
  set(blob: Blob, mimeType: string) {
    // Révoquer l'ancienne URL si elle existe
    if (_record) URL.revokeObjectURL(_record.url);
    _record = { blob, mimeType, url: URL.createObjectURL(blob) };
  },

  get(): VideoRecord | null {
    return _record;
  },

  /** Appeler quand l'utilisateur supprime la prise */
  clear() {
    if (_record) {
      URL.revokeObjectURL(_record.url);
      _record = null;
    }
  },
};
