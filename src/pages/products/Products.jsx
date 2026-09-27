import { useEffect, useMemo, useState } from "react";

import {
  useSearchParams,
  Link,
  Navigate,
} from "react-router-dom";

import {
  getProducts,
  getCategories,
} from "../../services/api/productApi";

import {
  getPublicSellerProducts,
} from "../../services/localStore";

import { useAuth } from "../../context/AuthContext";

import "./Products.css";

function Products() {
  const { role } = useAuth();

  const [products, setProducts] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [query, setQuery] =
    useState("");

  const [sort, setSort] =
    useState("");

  const [minPrice, setMinPrice] =
    useState("");

  const [maxPrice, setMaxPrice] =
    useState("");

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const selectedCategory =
    searchParams.get("category") ||
    "";

  useEffect(() => {
    if (role === "seller") {
      return;
    }

    Promise.allSettled([
      getCategories(),
      getProducts("?limit=50"),
    ]).then(([c, p]) => {
      const remoteCategories =
        c.status === "fulfilled"
          ? c.value.data || []
          : [];

      const remoteProducts =
        p.status === "fulfilled"
          ? p.value.data || []
          : [];

      const sellerProducts =
        getPublicSellerProducts();

      const sellerCategories =
        sellerProducts
          .map(
            (product) =>
              product.category
          )
          .filter(Boolean);

      const categoryMap = new Map(
        remoteCategories.map(
          (category) => [
            category._id,
            category,
          ]
        )
      );

      sellerCategories.forEach(
        (category) => {
          if (
            category._id &&
            !categoryMap.has(
              category._id
            )
          ) {
            categoryMap.set(
              category._id,
              category
            );
          }
        }
      );

      setCategories([
        ...categoryMap.values(),
      ]);

      setProducts([
        ...sellerProducts,
        ...remoteProducts,
      ]);

      setLoading(false);
    });
  }, [role]);

  const filtered = useMemo(() => {
    let list = products.filter(
      (p) => {
        const categoryId =
          p.category?._id ||
          p.categoryId ||
          "";

        return (
          (!selectedCategory ||
            categoryId ===
              selectedCategory) &&
          p.title
            ?.toLowerCase()
            .includes(
              query.toLowerCase()
            )
        );
      }
    );

    if (minPrice !== "") {
      list = list.filter(
        (p) =>
          Number(p.price) >=
          Number(minPrice)
      );
    }

    if (maxPrice !== "") {
      list = list.filter(
        (p) =>
          Number(p.price) <=
          Number(maxPrice)
      );
    }

    if (sort === "low") {
      list = [...list].sort(
        (a, b) =>
          Number(a.price) -
          Number(b.price)
      );
    }

    if (sort === "high") {
      list = [...list].sort(
        (a, b) =>
          Number(b.price) -
          Number(a.price)
      );
    }

    return list;
  }, [
    products,
    selectedCategory,
    query,
    minPrice,
    maxPrice,
    sort,
  ]);

  if (role === "seller") {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  if (role === "admin") {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  return (
    <main className="products-page">
      <div className="products-header">
        <h1>All Products</h1>

        <p>
          Browse products available in
          the store.
        </p>
      </div>

      <div className="product-filters">
        <input
          placeholder="Search by product name..."
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
        />

        <select
          value={selectedCategory}
          onChange={(e) =>
            e.target.value
              ? setSearchParams({
                  category:
                    e.target.value,
                })
              : setSearchParams({})
          }
        >
          <option value="">
            All Categories
          </option>

          {categories.map((c) => (
            <option
              key={c._id}
              value={c._id}
            >
              {c.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="0"
          placeholder="Min price"
          value={minPrice}
          onChange={(e) =>
            setMinPrice(
              e.target.value
            )
          }
        />

        <input
          type="number"
          min="0"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) =>
            setMaxPrice(
              e.target.value
            )
          }
        />

        <select
          value={sort}
          onChange={(e) =>
            setSort(e.target.value)
          }
        >
          <option value="">
            Sort
          </option>

          <option value="low">
            Price: Low to High
          </option>

          <option value="high">
            Price: High to Low
          </option>
        </select>
      </div>

      {loading ? (
        <div className="products-loading">
          Loading products...
        </div>
      ) : !filtered.length ? (
        <div className="no-products">
          No products match your
          filters.
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map((product) => {
            const productId =
              product._id ||
              product.id;

            return (
              <Link
                to={`/products/${productId}`}
                className="product-card-link"
                key={productId}
              >
                <div className="product-card">
                  <img
                    src={
                      product.imageCover ||
                      "https://placehold.co/300x300?text=No+Image"
                    }
                    alt={product.title}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://placehold.co/300x300?text=No+Image";
                    }}
                  />

                  <div className="product-card-content">
                    <p className="product-category">
                      {product.category
                        ?.name ||
                        "Product"}
                    </p>

                    <h3>
                      {product.title}
                    </h3>

                    <p className="product-price">
                      ${product.price}
                    </p>

                    <p className="product-stock">
                      Stock:{" "}
                      {product.quantity ??
                        product.stock ??
                        0}
                    </p>

                    <div className="view-product">
                      View Details
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default Products;