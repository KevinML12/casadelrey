import { photoVariants } from '../../lib/photos';

// Only local, known photographs are substituted. Admin uploads, private files,
// data URLs and external CMS media keep their original URL and behavior.
export default function PhotoImage({ src, alt = '', loading = 'lazy', decoding = 'async', sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px', srcSet, width, height, ...props }) {
  const variants = photoVariants(src);
  const largest = variants?.at(-1);
  return (
    <img
      {...props}
      src={largest?.src || src}
      alt={alt}
      width={width ?? largest?.width}
      height={height ?? largest?.height}
      srcSet={srcSet ?? variants?.map(v => `${v.src} ${v.width}w`).join(', ')}
      sizes={srcSet || variants ? sizes : undefined}
      loading={loading}
      decoding={decoding}
    />
  );
}
