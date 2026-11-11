export async function createSvgPngBlob(svg: string): Promise<Blob> {
  if (typeof document === 'undefined') throw new Error('目前無法在此裝置直接下載。');

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1440;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('瀏覽器不支援圖片下載。');

  const fallbackColor = '#FFF9F5';
  context.fillStyle = fallbackColor;
  context.fillRect(0, 0, canvas.width, canvas.height);

  let svgForDrawing = svg;
  try {
    const parsedSvg = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const svgRoot = parsedSvg.documentElement;
    const viewBox = (svgRoot.getAttribute('viewBox') ?? '0 0 720 960')
      .trim()
      .split(/[,\s]+/)
      .map(Number);
    const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] =
      viewBox.length === 4 && viewBox.every(Number.isFinite)
        ? viewBox
        : [0, 0, 720, 960];
    const scaleX = canvas.width / viewBoxWidth;
    const scaleY = canvas.height / viewBoxHeight;
    const imageElements = Array.from(parsedSvg.getElementsByTagNameNS(
      'http://www.w3.org/2000/svg',
      'image',
    ));

    for (const [index, element] of imageElements.entries()) {
      const href = element.getAttribute('href')
        ?? element.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
      const isBackground = index === 0;
      const readLength = (name: string, fallback: number) => {
        const value = Number.parseFloat(element.getAttribute(name) ?? '');
        return Number.isFinite(value) ? value : fallback;
      };
      const x = readLength('x', 0);
      const y = readLength('y', 0);
      const width = readLength('width', isBackground ? viewBoxWidth : 0);
      const height = readLength('height', isBackground ? viewBoxHeight : 0);
      const destX = (x - viewBoxX) * scaleX;
      const destY = (y - viewBoxY) * scaleY;
      const destWidth = width * scaleX;
      const destHeight = height * scaleY;
      const fillFailedImage = () => {
        context.fillStyle = fallbackColor;
        if (isBackground || destWidth <= 0 || destHeight <= 0) {
          context.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          context.fillRect(destX, destY, destWidth, destHeight);
        }
      };

      if (!href || destWidth <= 0 || destHeight <= 0) {
        fillFailedImage();
        element.remove();
        continue;
      }

      try {
        const source = new window.Image();
        await new Promise<void>((resolve, reject) => {
          source.onload = () => resolve();
          source.onerror = () => reject(new Error('明信片圖片載入失敗。'));
          source.crossOrigin = 'anonymous';
          source.src = new URL(href, document.baseURI).href;
        });

        const preserve = (element.getAttribute('preserveAspectRatio') ?? '')
          .trim()
          .split(/\s+/)
          .filter(Boolean);
        const align = preserve.find((part) => part.startsWith('x')) ?? (isBackground ? 'xMidYMid' : 'xMidYMid');
        const fit = preserve.find((part) => part === 'meet' || part === 'slice')
          ?? (isBackground ? 'slice' : 'meet');
        if (align === 'none') {
          context.drawImage(source, destX, destY, destWidth, destHeight);
        } else {
          const scale = fit === 'slice'
            ? Math.max(destWidth / source.naturalWidth, destHeight / source.naturalHeight)
            : Math.min(destWidth / source.naturalWidth, destHeight / source.naturalHeight);
          const drawnWidth = source.naturalWidth * scale;
          const drawnHeight = source.naturalHeight * scale;
          const alignX = align.includes('xMin') ? 0 : align.includes('xMax') ? 1 : 0.5;
          const alignY = align.includes('YMin') ? 0 : align.includes('YMax') ? 1 : 0.5;
          context.drawImage(
            source,
            destX + (destWidth - drawnWidth) * alignX,
            destY + (destHeight - drawnHeight) * alignY,
            drawnWidth,
            drawnHeight,
          );
        }
      } catch {
        fillFailedImage();
      }
      element.remove();
    }

    svgForDrawing = new XMLSerializer().serializeToString(parsedSvg);
  } catch {
    context.fillStyle = fallbackColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  const svgBlob = new Blob([svgForDrawing], { type: 'image/svg+xml;charset=utf-8' });
  const imageUrl = URL.createObjectURL(svgBlob);
  try {
    const image = new window.Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('明信片圖片產生失敗。'));
      image.crossOrigin = 'anonymous';
      image.src = imageUrl;
    });
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
