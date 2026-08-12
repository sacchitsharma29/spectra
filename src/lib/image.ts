export async function compressImageToDataUrl(
  file: File,
  maxWidth = 1600,
  maxBytes = 700000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.85;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > maxBytes * 1.34 && quality > 0.4) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        if (dataUrl.length > maxBytes * 1.34) {
          reject(new Error('Image is too large even after compression'));
          return;
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Could not read image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export async function cropWhiteBorders(dataUrl: string, tolerance = 32): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Could not read image'));
    i.src = dataUrl;
  });

  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0);

  const { data } = ctx.getImageData(0, 0, w, h);
  const at = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };

  const counts = new Map<string, { c: number[]; n: number }>();
  const addBorder = (c: number[]) => {
    const k = `${c[0] >> 5}|${c[1] >> 5}|${c[2] >> 5}`;
    const e = counts.get(k);
    if (e) e.n++;
    else counts.set(k, { c, n: 1 });
  };
  for (let x = 0; x < w; x++) {
    addBorder(at(x, 0));
    addBorder(at(x, Math.min(1, h - 1)));
    addBorder(at(x, h - 1));
    addBorder(at(x, Math.max(0, h - 2)));
  }
  for (let y = 0; y < h; y++) {
    addBorder(at(0, y));
    addBorder(at(Math.min(1, w - 1), y));
    addBorder(at(w - 1, y));
    addBorder(at(Math.max(0, w - 2), y));
  }

  let bg = [0, 0, 0];
  let best = -1;
  for (const e of counts.values()) {
    if (e.n > best) {
      best = e.n;
      bg = e.c;
    }
  }

  const isBg = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return (
      Math.abs(data[i] - bg[0]) <= tolerance &&
      Math.abs(data[i + 1] - bg[1]) <= tolerance &&
      Math.abs(data[i + 2] - bg[2]) <= tolerance
    );
  };

  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!isBg(x, y)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return dataUrl;

  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  const out = document.createElement('canvas');
  out.width = cw;
  out.height = ch;
  out.getContext('2d')!.drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);
  return out.toDataURL('image/png');
}
