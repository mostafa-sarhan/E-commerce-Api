import { useEffect, useState } from "react";

import {
  getSellerProductsByOwner,
  getReviews,
} from "../../../services/localStore";

import { useAuth } from "../../../context/AuthContext";

import "./../Seller.css";

function SellerReviews() {
  const { user } = useAuth();

  const [reviews, setReviews] =
    useState([]);

  useEffect(() => {
    const owned =
      getSellerProductsByOwner(
        user?.email
      );

    const local = getReviews()
      .filter((review) =>
        owned.some(
          (product) =>
            String(
              product.id ||
                product._id
            ) ===
            String(
              review.productId ||
                review.product?._id ||
                review.product?.id
            )
        )
      )
      .map((review) => ({
        ...review,

        productTitle:
          review.product?.title ||
          owned.find(
            (product) =>
              String(
                product.id ||
                  product._id
              ) ===
              String(
                review.productId
              )
          )?.title ||
          "Seller Product",
      }));

    setReviews(local);
  }, [user?.email]);

  const average = reviews.length
    ? reviews.reduce(
        (sum, review) =>
          sum +
          Number(
            review.ratings || 0
          ),
        0
      ) / reviews.length
    : 0;

  return (
    <main className="seller-page">
      <div className="page-header">
        <p>SELLER CENTER</p>

        <h1>Reviews</h1>

        <span>
          Customer reviews for your
          products.
        </span>
      </div>

      <section className="seller-stats">
        <div className="seller-stat">
          <p>Reviews</p>

          <strong>
            {reviews.length}
          </strong>
        </div>

        <div className="seller-stat">
          <p>Average Rating</p>

          <strong>
            {average.toFixed(1)} / 5
          </strong>
        </div>
      </section>

      <section className="seller-card">
        <table className="seller-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Customer</th>
              <th>Rating</th>
              <th>Review</th>
            </tr>
          </thead>

          <tbody>
            {reviews.map((review) => (
              <tr
                key={
                  review._id ||
                  `${review.productId}-${review.createdAt}-${review.title}`
                }
              >
                <td>
                  {review.productTitle}
                </td>

                <td>
                  {review.user?.name ||
                    "Customer"}
                </td>

                <td>
                  {"⭐".repeat(
                    Number(
                      review.ratings || 0
                    )
                  )}
                </td>

                <td>
                  {review.title || "—"}
                </td>
              </tr>
            ))}

            {!reviews.length && (
              <tr>
                <td
                  colSpan="4"
                  className="seller-muted"
                >
                  No customer reviews for
                  your products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

export default SellerReviews;