export async function createSvgPngBlob(svg: string): Promise<Blob> {
  if (typeof document === 'undefined') throw new Error('目前無法在此裝置直接下載。');

  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const imageUrl = URL.createObjectURL(svgBlob);
  try {
    const image = new window.Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('明信片圖片產生失敗。'));
      image.crossOrigin = 'anonymous';
      image.src = imageUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('瀏覽器不支援圖片下載。');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG 匯出失敗。')), 'image/png');
    });
    return png;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function downloadPngBlob(png: Blob, filename: string): void {
  if (typeof document === 'undefined') throw new Error('目前無法在此裝置直接下載。');
  const objectUrl = URL.createObjectURL(png);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export async function downloadSvgAsPng(svg: string, filename: string): Promise<void> {
  downloadPngBlob(await createSvgPngBlob(svg), filename);
}

export async function sharePngBlobOnWeb(
  png: Blob,
  filename: string,
  title: string,
): Promise<'shared' | 'downloaded'> {
  if (typeof navigator === 'undefined' || typeof File === 'undefined') {
    downloadPngBlob(png, filename);
    return 'downloaded';
  }

  type FileShareData = { files: File[]; title: string };
  type FileShareNavigator = Navigator & {
    share?: (data: FileShareData) => Promise<void>;
    canShare?: (data: { files: File[] }) => boolean;
  };
  const shareApi = navigator as FileShareNavigator;
  const file = new File([png], filename, { type: 'image/png' });
  let canShareFile = true;
  try {
    canShareFile = !shareApi.canShare || shareApi.canShare({ files: [file] });
  } catch {
    canShareFile = false;
  }

  if (!shareApi.share || !canShareFile) {
    downloadPngBlob(png, filename);
    return 'downloaded';
  }

  try {
    await shareApi.share({ files: [file], title });
    return 'shared';
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    downloadPngBlob(png, filename);
    return 'downloaded';
  }
}
