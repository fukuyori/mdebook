import { afterEach, describe, expect, it, vi } from 'vitest';
import { embedExternalImagesForEpub, type JSZipFolder } from './export';
import type { EpubManifestItem } from '../types';

describe('embedExternalImagesForEpub', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('embeds Substack CDN images through the image proxy and rewrites XHTML src', async () => {
    const src = 'https://substackcdn.com/image/fetch/$s_!Kb7s!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2F2f5a3358-4b6b-46b3-90b8-45da88af865f_513x717.png';
    const files = new Map<string, string | ArrayBuffer>();
    const imagesFolder: JSZipFolder = {
      file: (path, content) => {
        files.set(path, content);
      },
      folder: () => null,
    };
    const manifestItems: EpubManifestItem[] = [];
    const imageCache = new Map<string, { href: string; mediaType: string }>();
    const failedImageSources = new Set<string>();

    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.startsWith('https://images.weserv.nl/?url=')) {
        return {
          ok: true,
          arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
          headers: new Headers({ 'content-type': 'image/jpeg' }),
        };
      }

      return { ok: false, headers: new Headers() };
    }));

    const xhtml = `<p><img src="${src}" alt="Excel for Macintosh パッケージ"/></p>`;
    const result = await embedExternalImagesForEpub(
      xhtml,
      imagesFolder,
      manifestItems,
      imageCache,
      failedImageSources
    );

    expect(result).toContain('src="images/external-0.jpg"');
    expect(result).not.toContain(src);
    expect(files.has('external-0.jpg')).toBe(true);
    expect(manifestItems).toContainEqual({
      id: 'external-image-0',
      href: 'images/external-0.jpg',
      mediaType: 'image/jpeg',
    });
    expect(failedImageSources.size).toBe(0);
  });
});
