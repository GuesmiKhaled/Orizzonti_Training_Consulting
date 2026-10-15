/**
 * Language pictures come from the site's own image library (the repository's
 * `img/` folder, served by the frontend as /img/...). Only such paths are
 * accepted: no external URLs, no schemes, no path traversal.
 */
export const IMAGE_LIBRARY_PATH =
  /^(?!.*\.\.)(?!.*\/\/)\/img\/[\p{L}\p{N}_\-./ ]+\.(jpe?g|png|gif|webp)$/iu;

export const IMAGE_LIBRARY_PATH_MESSAGE =
  'imageUrl must be an image from the library, for example /img/cat-1.jpg';
