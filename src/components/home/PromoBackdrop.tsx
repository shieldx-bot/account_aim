import React from 'react';

/**
 * PromoBackdrop — real photography layer inside each promo slide.
 * Images are downloaded locally (public/images) so the CDN never leaks
 * and LCP stays stable; gradient overlays keep brand colors dominant.
 */
const BACKDROPS: Record<string, string> = {
  flash: '/images/hero-code.jpg',
  combo: '/images/bento-workspace.jpg',
  referral: '/images/promo-tech.jpg',
};

export const PromoBackdrop: React.FC<{ slideId: string }> = ({ slideId }) => (
  <img
    src={BACKDROPS[slideId]}
    alt=""
    aria-hidden="true"
    loading="lazy"
    decoding="async"
    className="absolute inset-y-0 right-0 h-full w-1/2 object-cover opacity-[0.10] saturate-[0.6] [mask-image:linear-gradient(to_left,black,transparent)] hidden sm:block pointer-events-none"
  />
);
