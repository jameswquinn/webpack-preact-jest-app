import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

const ResponsiveImage = ({ src, alt, sizes }) => {
  const [imageMeta, setImageMeta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/assets/images/metadata/${src.replace(/\.[^/.]+$/, "")}.json`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load image metadata');
        }
        return response.json();
      })
      .then(setImageMeta)
      .catch(err => {
        console.error('Error loading image metadata:', err);
        setError('Failed to load image. Please try again later.');
      });
  }, [src]);

  if (error) return <div class="error">{error}</div>;
  if (!imageMeta) return <div class="loading">Loading...</div>;

  const basePath = '/assets/images';
  const webpSrcSet = [300, 600, 1200, 2000]
    .map(size => `${basePath}/webp/${src.replace(/\.[^/.]+$/, "")}-${size}.webp ${size}w`)
    .join(', ');
  
  const fallbackFormat = imageMeta.hasAlpha ? 'png' : 'jpg';
  const fallbackSrcSet = [300, 600, 1200, 2000]
    .map(size => `${basePath}/${fallbackFormat}/${src.replace(/\.[^/.]+$/, "")}-${size}.${fallbackFormat} ${size}w`)
    .join(', ');

  return (
    <img
      src={`${basePath}/${fallbackFormat}/${src.replace(/\.[^/.]+$/, "")}-600.${fallbackFormat}`}
      srcSet={`${webpSrcSet}, ${fallbackSrcSet}`}
      sizes={sizes}
      alt={alt}
      loading="lazy"
      onError={() => setError('Failed to load image. Please try again later.')}
    />
  );
};

export default ResponsiveImage;
