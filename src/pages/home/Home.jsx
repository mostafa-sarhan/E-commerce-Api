import { useEffect, useState } from "react";

import { Navigate, Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import { getCategories } from "../../services/api/productApi";

import "./Home.css";

function Home() {
  const { role } = useAuth();

  const [categories, setCategories] =
    useState([]);

  useEffect(() => {
    getCategories()
      .then((response) => {
        setCategories(
          response.data || []
        );
      })
      .catch(() => {
        setCategories([]);
      });
  }, []);

  if (role === "seller") {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  const findCategoryId = (name) => {
    const category =
      categories.find(
        (item) =>
          item.name?.toLowerCase() ===
          name.toLowerCase()
      );

    return category?._id || "";
  };

  const womenId =
    findCategoryId("Women's Fashion");

  const menId =
    findCategoryId("Men's Fashion");

  const electronicsId =
    findCategoryId("Electronics");

  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <p className="hero-label">
            YOUR EVERYDAY MARKETPLACE
          </p>

          <h1>
            Everything You Need,
            <span>
              {" "}
              All in One Place
            </span>
          </h1>

          <p>
            Shop fashion, electronics and
            more at great prices.
          </p>

          <div className="hero-buttons">
            <Link
              to="/products"
              className="primary-button"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      <section className="deals-section">
        <div className="section-heading">
          <p>
            SHOP BY CATEGORY
          </p>

          <h2>
            Explore Our Categories
          </h2>
        </div>

        <div className="deals-grid">
          {/* Women's Fashion */}
          <Link
            to={
              womenId
                ? `/products?category=${womenId}`
                : "/products"
            }
            className="deal-card"
          >
            <span>
              SHOP NOW
            </span>

            <h3>
              Women's Fashion
            </h3>

            <p>
              Discover the latest styles
              and trends.
            </p>

            <span>
              View Products →
            </span>
          </Link>

          {/* Men's Fashion */}
          <Link
            to={
              menId
                ? `/products?category=${menId}`
                : "/products"
            }
            className="deal-card"
          >
            <span>
              SHOP NOW
            </span>

            <h3>
              Men's Fashion
            </h3>

            <p>
              Find everyday styles for
              every occasion.
            </p>

            <span>
              View Products →
            </span>
          </Link>

          {/* Electronics */}
          <Link
            to={
              electronicsId
                ? `/products?category=${electronicsId}`
                : "/products"
            }
            className="deal-card"
          >
            <span>
              SHOP NOW
            </span>

            <h3>
              Electronics
            </h3>

            <p>
              Explore useful devices and
              accessories.
            </p>

            <span>
              View Products →
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Home;