import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getBrands,
  getCategories,
  getProducts,
} from "../../services/api/productApi";
import heroFallback from "../../assets/images/hero.png";
import HeroSlider from "../../components/home/HeroSlider";
import SectionHeader from "../../components/home/SectionHeader";
import ProductCard from "../../components/ProductCard/ProductCard";
import "./Home.css";

/* Category order chosen to keep the page electronics-first */
const CATEGORY_ORDER = [
  "Mobiles",
  "Electronics",
  "Music",
  "Home",
  "Beauty & Health",
  "Baby & Toys",
];

const BRAND_LIMIT = 12;

const TRUST_ITEMS = [
  {
    title: "Fast delivery",
    text: "Ready to ship, tracked to your door",
  },
  {
    title: "Secure shopping",
    text: "Protected checkout, no surprises",
  },
  {
    title: "Cash on delivery",
    text: "Pay when it arrives",
  },
  {
    title: "1-year warranty",
    text: "Cover on every device",
  },
];

function TrustIcon({ index }) {
  if (index === 0) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        className="home-trust-icon"
      >
        <path
          d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle
          cx="7"
          cy="18"
          r="1.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle
          cx="17.5"
          cy="18"
          r="1.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        className="home-trust-icon"
      >
        <path
          d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M9 12l2.2 2.2L15.5 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (index === 2) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        className="home-trust-icon"
      >
        <rect
          x="3"
          y="6"
          width="18"
          height="12"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle
          cx="12"
          cy="12"
          r="2.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="home-trust-icon"
    >
      <path
        d="M12 3l7.5 3v5.5c0 4.3-3 8-7.5 9.5-4.5-1.5-7.5-5.2-7.5-9.5V6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 8.5v4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15.8" r="1" fill="currentColor" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="home-cat-arrow"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Home() {
  const [categories, setCategories] = useState([]);

  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    Promise.allSettled([
      getCategories(),
      getProducts("?limit=50"),
      getBrands(),
    ]).then(([categoryResult, productResult, brandResult]) => {
      setCategories(
        categoryResult.status === "fulfilled"
          ? categoryResult.value.data || []
          : [],
      );

      setProducts(
        productResult.status === "fulfilled"
          ? productResult.value.data || []
          : [],
      );

      setBrands(
        brandResult.status === "fulfilled"
          ? (brandResult.value.data || []).slice(0, BRAND_LIMIT)
          : [],
      );
    });
  }, []);

  const featured = useMemo(
    () =>
      [...products]
        .sort(
          (a, b) =>
            (b.ratingsAverage || 0) - (a.ratingsAverage || 0) ||
            (b.ratingsQuantity || 0) - (a.ratingsQuantity || 0),
        )
        .slice(0, 8),
    [products],
  );

  const bestSellers = useMemo(
    () =>
      [...products].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 10),
    [products],
  );

  const electronicsCategories = useMemo(() => {
    const byName = new Map(
      categories.map((category) => [category.name, category]),
    );

    const ordered = CATEGORY_ORDER.map((name) => byName.get(name)).filter(
      Boolean,
    );

    if (ordered.length) {
      return ordered;
    }

    return categories.slice(0, CATEGORY_ORDER.length);
  }, [categories]);

  const categoryHref = useCallback(
    (name) => {
      const match = categories.find((category) => category.name === name);

      return match?._id ? `/products?category=${match._id}` : "/products";
    },
    [categories],
  );

  const slides = useMemo(() => {
    const findIn = (name) =>
      products.find((product) => product.category?.name === name) || null;

    const mobiles = findIn("Mobiles");
    const audio = findIn("Music") || findIn("Electronics");
    const flagship = bestSellers[0] || null;

    return [
      {
        kicker: "New season picks",
        title: "The tech upgrade your desk has been waiting for",
        text: "Mobiles, audio and everyday electronics - hand-picked, plainly priced and ready to ship.",
        primary: {
          label: "Shop Mobiles",
          href: categoryHref("Mobiles"),
        },
        secondary: {
          label: "Browse all products",
          href: "/products",
        },
        badge: flagship ? `From $${flagship.price}` : null,
        image: flagship?.imageCover || heroFallback,
        alt: flagship?.title || "",
      },
      {
        kicker: "Mobiles",
        title: "Flagship phones, minus the flagship markup",
        text: "Compare the latest handsets and pick the one that actually fits how you use it.",
        primary: {
          label: "Shop Mobiles",
          href: categoryHref("Mobiles"),
        },
        secondary: {
          label: "All products",
          href: "/products",
        },
        badge: mobiles ? `From $${mobiles.price}` : null,
        image: mobiles?.imageCover || heroFallback,
        alt: mobiles?.title || "",
      },
      {
        kicker: "Audio & Electronics",
        title: "Sound you can hear the difference in",
        text: "Headphones, speakers and everyday electronics picked for clarity, reliability and build.",
        primary: {
          label: "Shop Electronics",
          href: categoryHref("Electronics"),
        },
        secondary: {
          label: "Shop Audio",
          href: categoryHref("Music"),
        },
        badge: audio ? `From $${audio.price}` : null,
        image: audio?.imageCover || heroFallback,
        alt: audio?.title || "",
      },
    ];
  }, [products, bestSellers, categoryHref]);

  return (
    <main className="home">
      <HeroSlider slides={slides} />

      {/* TRUST STRIP */}
      <section className="home-trust">
        <div className="voltix-container">
          <ul className="home-trust-list">
            {TRUST_ITEMS.map((item, index) => (
              <li className="home-trust-item" key={item.title}>
                <span className="home-trust-mark">
                  <TrustIcon index={index} />
                </span>

                <span className="home-trust-text">
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="home-section home-section-canvas">
        <div className="voltix-container">
          <SectionHeader
            kicker="Shop by category"
            title="Everything electronics, sorted"
            subtitle="Start with the department you need - the shelves are already organised."
            actionLabel="All products"
            actionHref="/products"
          />

          <div className="home-cats">
            {electronicsCategories.map((category) => (
              <Link
                key={category._id}
                to={`/products?category=${category._id}`}
                className="home-cat"
              >
                <span className="home-cat-media">
                  <img src={category.image} alt="" loading="lazy" />
                </span>

                <span className="home-cat-name">{category.name}</span>

                <span className="home-cat-cta">
                  Shop
                  <ArrowIcon />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="home-section">
        <div className="voltix-container">
          <SectionHeader
            kicker="Hand-picked"
            title="Featured Products"
            subtitle="The highest rated gear in the store, refreshed as customers review it."
            actionLabel="View all"
            actionHref="/products"
          />

          <div className="home-grid">
            {featured.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* PROMO BANNER */}
      <section className="home-promo">
        <div className="voltix-container">
          <div className="home-promo-panel">
            <div className="home-promo-copy">
              <p className="home-promo-kicker">Bundle &amp; save</p>

              <h2 className="home-promo-title">
                Buy the pair, pay less on the second
              </h2>

              <p className="home-promo-text">
                Audio and mobiles that are actually designed to work together.
                Build a bundle and we will sharpen the price.
              </p>

              <Link to={categoryHref("Electronics")} className="home-promo-cta">
                Shop Electronics
              </Link>
            </div>

            <div className="home-promo-art">
              <img
                src={
                  bestSellers[1]?.imageCover ||
                  bestSellers[0]?.imageCover ||
                  heroFallback
                }
                alt=""
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="home-section">
        <div className="voltix-container">
          <SectionHeader
            kicker="Moving fast"
            title="Best Sellers"
            subtitle="What people are actually buying this month."
            actionLabel="View all"
            actionHref="/products"
          />
        </div>

        <div className="home-rail-wrap">
          <div className="voltix-container home-rail-pad">
            <div className="home-rail">
              {bestSellers.map((product) => (
                <div className="home-rail-item" key={product._id || product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BRANDS */}
      {brands.length ? (
        <section className="home-section home-section-canvas home-brands-section">
          <div className="voltix-container">
            <SectionHeader
              kicker="Brands we stock"
              title="Trusted names"
              subtitle="Real brands, real warranties, no grey imports."
            />

            <ul className="home-brands">
              {brands.map((brand) => (
                <li className="home-brand" key={brand._id}>
                  <img src={brand.image} alt={brand.name} loading="lazy" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* CLOSING CTA */}
      <section className="home-closing">
        <div className="voltix-container home-closing-inner">
          <h2 className="home-closing-title">
            Find the tech that fits your life.
          </h2>

          <p className="home-closing-text">
            Browse the full catalogue and pick something worth keeping.
          </p>

          <Link to="/products" className="home-closing-cta">
            Browse products
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Home;
