/* Small raster artwork, enlarged without interpolation for a fine pixel finish. */
function createExperienceArtwork(kind, width, height) {
  const image = new ImageData(width, height);
  const data = image.data;
  const stars = [];
  for (let row = 0; row < 9; row++) {
    for (let column = 0; column < (row % 2 ? 5 : 6); column++) {
      stars.push([(column * 2 + (row % 2 ? 2 : 1)) / 12, (row + 1) / 10]);
    }
  }
  // A fixed texture makes all fifty stars travel with the fabric, not across it.
  const flagWidth = 1520, flagHeight = 800;
  const flag = new Uint8ClampedArray(flagWidth * flagHeight * 3);
  if (kind === 'flag') {
    for (let y = 0; y < flagHeight; y++) {
      for (let x = 0; x < flagWidth; x++) {
        let color = Math.floor(y / flagHeight * 13) % 2 ? [244, 237, 217] : [177, 35, 51];
        if (x < flagWidth * .4 && y < flagHeight * 7 / 13) {
          color = [22, 43, 76];
          const u = x / (flagWidth * .4), v = y / (flagHeight * 7 / 13);
          for (const [sx, sy] of stars) {
            const dx = (u - sx) * flagWidth * .4;
            const dy = (v - sy) * flagHeight * 7 / 13;
            if (Math.abs(dx) > 15 || Math.abs(dy) > 15) continue;
            let inside = false;
            let distance = Infinity;
            for (let point = 0; point < 10; point++) {
              const a = -Math.PI / 2 + point * Math.PI / 5;
              const b = a + Math.PI / 5;
              const ar = point % 2 ? 5.3 : 13.9;
              const br = point % 2 ? 13.9 : 5.3;
              const ax = Math.cos(a) * ar, ay = Math.sin(a) * ar;
              const bx = Math.cos(b) * br, by = Math.sin(b) * br;
              if ((ay > dy) !== (by > dy) && dx < (bx - ax) * (dy - ay) / (by - ay) + ax) inside = !inside;
              const t = Math.max(0, Math.min(1, ((dx - ax) * (bx - ax) + (dy - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)));
              distance = Math.min(distance, Math.hypot(dx - ax - t * (bx - ax), dy - ay - t * (by - ay)));
            }
            const coverage = Math.max(0, Math.min(1, .5 + (inside ? distance : -distance)));
            if (coverage > 0) {
              color = color.map((channel, index) => channel + ([255, 249, 225][index] - channel) * coverage);
              break;
            }
          }
        }
        flag.set(color, (y * flagWidth + x) * 3);
      }
    }
  }

  // Repeatable moving lens centers produce a connected caustic network.
  const cells = [];
  for (let y = -2; y < 12; y++) {
    for (let x = -2; x < 24; x++) {
      const seed = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      cells.push({x, y, phase: (seed - Math.floor(seed)) * Math.PI * 2});
    }
  }
  const gridWidth = 26;
  return function render(time) {
    const t = time * .42;
    if (kind === 'pool') {
      for (const cell of cells) {
        cell.px = cell.x + .5 + .29 * Math.sin(t + cell.phase);
        cell.py = cell.y + .5 + .29 * Math.cos(t * .83 + cell.phase * 1.7);
      }
    }
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r, g, b;
        const u = x / width, v = y / height;
        if (kind === 'flag') {
          // Cropped diagonal fabric; isotropic coordinates keep stars undistorted.
          const clothX = x / height;
          const clothY = y / height;
          const phase = clothX * 5.2 + clothY * .65 - time * .16;
          const fold = Math.sin(phase) + .24 * Math.sin(phase * 1.85 + .7);
          const drift = .012 * Math.sin(time * .22);
          const textureX = Math.min(flagWidth - 1.001, Math.max(0, 20 + clothX * 500 + fold * 8));
          const textureY = Math.min(flagHeight - 1.001, Math.max(0, 42 + (clothY + clothX * .085 + drift) * 500 + fold * 15));
          const ix = Math.floor(textureX), iy = Math.floor(textureY);
          const fx = textureX - ix, fy = textureY - iy;
          const i = (iy * flagWidth + ix) * 3;
          const below = i + flagWidth * 3;
          const slope = Math.cos(phase) * .7 + .22 * Math.cos(phase * 1.85 + .7);
          const shade = .69 + .27 * slope;
          const glint = Math.pow(Math.max(0, slope), 5) * 19;
          // Interpolate the moving texture before the final pixel enlargement to
          // avoid the crawling stair-steps of nearest-neighbor texture sampling.
          const sample = (channel) => {
            const top = flag[i + channel] * (1 - fx) + flag[i + 3 + channel] * fx;
            const bottom = flag[below + channel] * (1 - fx) + flag[below + 3 + channel] * fx;
            return (top * (1 - fy) + bottom * fy) * shade + glint;
          };
          r = sample(0); g = sample(1); b = sample(2);
        } else {
          const scale = 9;
          const px = u * scale + .2 * Math.sin(v * 12 + t * .7);
          const py = v * scale * height / width + .22 * Math.cos(u * 13 - t * .6);
          const gx = Math.floor(px), gy = Math.floor(py);
          let first = Infinity, second = Infinity;
          for (let cy = gy - 1; cy <= gy + 1; cy++) {
            for (let cx = gx - 1; cx <= gx + 1; cx++) {
              const cell = cells[(cy + 2) * gridWidth + cx + 2];
              if (!cell) continue;
              const distance = (px - cell.px) ** 2 + (py - cell.py) ** 2;
              if (distance < first) { second = first; first = distance; }
              else if (distance < second) second = distance;
            }
          }
          const edge = Math.sqrt(second) - Math.sqrt(first);
          const caustic = Math.exp(-edge * 38);
          const halo = Math.exp(-edge * 9);
          const swell = Math.sin(px * 2 + py * 3 - t) * .5 + .5;
          const sun = .65 + .35 * Math.sin(px * .7 + py + t * .3);
          r = 7 + halo * 24 + caustic * 120 * sun;
          g = 109 + swell * 26 + halo * 37 + caustic * 75 * sun;
          b = 160 + swell * 24 + halo * 27 + caustic * 46 * sun;
        }
        const i = (y * width + x) * 4;
        data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
      }
    }
    return image;
  };
}
