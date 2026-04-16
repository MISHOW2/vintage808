const products = [
  // ===== T-SHIRTS =====
  {
    id: 1,
    name: "Vintage Black Tee",
    category: "tshirts",
    price: 299,
    description: "Classic vintage black t-shirt made from premium cotton.",
    images: ["/images/tshirts/vintage-black.jpg"],
    sizes: ["S", "M", "L", "XL"],
    stock: {
      S: 10,
      M: 15,
      L: 12,
      XL: 8
    },
    colors: ["black"],
    isFeatured: true,
    createdAt: "2026-04-01"
  },
  {
    id: 2,
    name: "Classic White Tee",
    category: "tshirts",
    price: 249,
    description: "Minimal white tee with a clean, timeless fit.",
    images: ["/images/tshirts/classic-white.jpg"],
    sizes: ["S", "M", "L", "XL"],
    stock: {
      S: 12,
      M: 20,
      L: 15,
      XL: 10
    },
    colors: ["white"],
    isFeatured: false,
    createdAt: "2026-04-01"
  },
  {
    id: 3,
    name: "Oversized Grey Tee",
    category: "tshirts",
    price: 329,
    description: "Oversized t-shirt with a relaxed streetwear fit.",
    images: ["/images/tshirts/oversized-grey.jpg"],
    sizes: ["M", "L", "XL"],
    stock: {
      M: 14,
      L: 18,
      XL: 10
    },
    colors: ["grey"],
    isFeatured: true,
    createdAt: "2026-04-02"
  },
  {
    id: 4,
    name: "Retro Graphic Tee",
    category: "tshirts",
    price: 349,
    description: "Retro-inspired graphic tee with bold branding.",
    images: ["/images/tshirts/retro-graphic.jpg"],
    sizes: ["S", "M", "L"],
    stock: {
      S: 8,
      M: 10,
      L: 6
    },
    colors: ["black", "cream"],
    isFeatured: false,
    createdAt: "2026-04-02"
  },
  {
    id: 5,
    name: "Washed Brown Tee",
    category: "tshirts",
    price: 319,
    description: "Washed brown finish for a worn-in vintage look.",
    images: ["/images/tshirts/washed-brown.jpg"],
    sizes: ["S", "M", "L", "XL"],
    stock: {
      S: 6,
      M: 9,
      L: 7,
      XL: 5
    },
    colors: ["brown"],
    isFeatured: false,
    createdAt: "2026-04-03"
  },

  // ===== SHORTS =====
  {
    id: 11,
    name: "Vintage Black Shorts",
    category: "shorts",
    price: 399,
    description: "Relaxed vintage shorts designed for everyday comfort.",
    images: ["/images/shorts/vintage-black.jpg"],
    sizes: ["S", "M", "L"],
    stock: {
      S: 10,
      M: 14,
      L: 9
    },
    colors: ["black"],
    isFeatured: true,
    createdAt: "2026-04-01"
  },
  {
    id: 12,
    name: "Classic Grey Shorts",
    category: "shorts",
    price: 379,
    description: "Classic grey shorts with a modern relaxed fit.",
    images: ["/images/shorts/classic-grey.jpg"],
    sizes: ["S", "M", "L", "XL"],
    stock: {
      S: 11,
      M: 13,
      L: 12,
      XL: 7
    },
    colors: ["grey"],
    isFeatured: false,
    createdAt: "2026-04-01"
  },
  {
    id: 13,
    name: "Cargo Street Shorts",
    category: "shorts",
    price: 499,
    description: "Street-style cargo shorts with functional pockets.",
    images: ["/images/shorts/cargo-street.jpg"],
    sizes: ["M", "L", "XL"],
    stock: {
      M: 10,
      L: 8,
      XL: 6
    },
    colors: ["olive", "black"],
    isFeatured: true,
    createdAt: "2026-04-02"
  },
  {
    id: 14,
    name: "Relaxed Fit Shorts",
    category: "shorts",
    price: 389,
    description: "Lightweight relaxed-fit shorts for everyday wear.",
    images: ["/images/shorts/relaxed-fit.jpg"],
    sizes: ["S", "M", "L"],
    stock: {
      S: 9,
      M: 12,
      L: 10
    },
    colors: ["beige"],
    isFeatured: false,
    createdAt: "2026-04-03"
  },
  {
    id: 15,
    name: "Premium Cotton Shorts",
    category: "shorts",
    price: 529,
    description: "Premium cotton shorts with a tailored street look.",
    images: ["/images/shorts/premium-cotton.jpg"],
    sizes: ["M", "L", "XL"],
    stock: {
      M: 7,
      L: 6,
      XL: 4
    },
    colors: ["black", "cream"],
    isFeatured: true,
    createdAt: "2026-04-03"
  }
];

export default products;
