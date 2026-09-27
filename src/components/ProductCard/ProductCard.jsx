import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";

function ProductCard({ product }) {
  const { addProduct } = useCart();

  async function handleAddToCart() {
    try {
      await addProduct(product);
      alert("Product added to cart");
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div className="product-card">

      <Link to={`/products/${product._id}`}>
        <div className="product-image">
          <img
            src={product.imageCover}
            alt={product.title}
          />
        </div>

        <div className="product-info">
          <p className="product-category">
            {product.category?.name || "Electronics"}
          </p>

          <h3>{product.title}</h3>

          <div className="product-rating">
            ⭐ {product.ratingsAverage || 0}
          </div>

          <div className="product-price">
            ${product.price}
          </div>
        </div>
      </Link>

      <button
        className="add-cart-button"
        onClick={handleAddToCart}
      >
        Add to Cart
      </button>

    </div>
  );
}

export default ProductCard;
import "./ProductCard.css";
