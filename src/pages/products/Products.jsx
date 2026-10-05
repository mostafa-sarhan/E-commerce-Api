import { useEffect, useMemo, useState } from "react";

import {
  useSearchParams,
} from "react-router-dom";

import {
  getProducts,
  getCategories,
} from "../../services/api/productApi";

import ProductCard from "../../components/ProductCard/ProductCard";

import "./Products.css";

function Products() {
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
    Promise.allSettled([
      getCategories(),
      getProducts("?limit=50"),
    ]).then(([c, p]) => {
      setCategories(
        c.status === "fulfilled"
          ? c.value.data || []
          : []
      );

      setProducts(
        p.status === "fulfilled"
          ? p.value.data || []
          : []
      );

      setLoading(false);
    });
  }, []);

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
          {filtered.map((product) => (
            <ProductCard
              key={product._id || product.id}
              product={product}
            />
          ))}
        </div>
      )}
    </main>
  );
}

export default Products;