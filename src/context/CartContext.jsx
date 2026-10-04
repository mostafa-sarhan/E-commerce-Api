import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { useAuth } from "./AuthContext";

import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
} from "../services/api/cartApi";

import {
  getLocalCart,
  saveLocalCart,
} from "../services/localStore";

const CartContext = createContext();

const GUEST_CART_OWNER = "guest";

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const { user, role } = useAuth();

  const cartOwner = user?.email || GUEST_CART_OWNER;

  // Visitors can fill a cart before signing in, so anything collected
  // under the guest key moves into the account on the first load.
  function mergeGuestCartIntoAccount(email) {
    const guestItems = getLocalCart(GUEST_CART_OWNER);

    if (guestItems.length === 0) {
      return;
    }

    const merged = [...getLocalCart(email)];

    guestItems.forEach((item) => {
      const productId = String(
        item.product?.id || item.product?._id
      );

      const existing = merged.find(
        (entry) =>
          String(entry.product?.id || entry.product?._id) ===
          productId
      );

      if (existing) {
        existing.count =
          Number(existing.count || 0) +
          Number(item.count || 0);
      } else {
        merged.push({ ...item });
      }
    });

    saveLocalCart(email, merged);
    saveLocalCart(GUEST_CART_OWNER, []);
  }

  async function loadCart() {
    if (!user || role !== "customer") {
      setCart({
        _id: `local-cart-${GUEST_CART_OWNER}`,
        products: getLocalCart(GUEST_CART_OWNER),
        totalCartPriceAfterDiscount: 0,
      });
      return;
    }

    mergeGuestCartIntoAccount(user.email);

    const localItems = getLocalCart(user.email);

    try {
      setLoading(true);

      const data = await getCart();

      setCart({
        ...(data.data || {}),
        products: [
          ...(data.data?.products || []),
          ...localItems,
        ],
      });
    } catch {
      setCart({
        _id: `local-cart-${user.email}`,
        products: localItems,
        totalCartPriceAfterDiscount: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  async function addProduct(product) {
    const productId =
      product?._id || product?.id || product;

    const isLocal =
      typeof product === "object"
        ? !product._id ||
          String(product._id).startsWith("local-")
        : String(productId).startsWith("local-");

    if (isLocal || !user || role !== "customer") {
      const localProduct =
        typeof product === "object" ? product : null;

      if (!localProduct) {
        throw new Error(
          "Local product details are unavailable."
        );
      }

      const items = getLocalCart(cartOwner);

      const existing = items.find(
        (item) =>
          String(
            item.product.id || item.product._id
          ) ===
          String(
            localProduct.id || localProduct._id
          )
      );

      const next = existing
        ? items.map((item) =>
            item === existing
              ? {
                  ...item,
                  count: item.count + 1,
                }
              : item
          )
        : [
            ...items,
            {
              product: localProduct,
              price: localProduct.price,
              count: 1,
              isLocal: true,
            },
          ];

      saveLocalCart(cartOwner, next);

      setCart((current) => ({
        ...(current || {}),
        _id:
          current?._id ||
          `local-cart-${cartOwner}`,
        products: [
          ...(current?.products || []).filter(
            (item) => !item.isLocal
          ),
          ...next,
        ],
      }));

      return {
        data: {
          products: next,
        },
      };
    }

    const data = await addToCart(productId);

    setCart((current) => ({
      ...(data.data || {}),
      products: [
        ...(data.data?.products || []),
        ...(current?.products || []).filter(
          (item) => item.isLocal
        ),
      ],
    }));

    return data;
  }

  async function changeQuantity(productId, count) {
    const localItems = getLocalCart(cartOwner);

    const localIndex = localItems.findIndex(
      (item) =>
        String(
          item.product.id || item.product._id
        ) === String(productId)
    );

    if (localIndex >= 0) {
      const next = localItems.map(
        (item, index) =>
          index === localIndex
            ? {
                ...item,
                count,
              }
            : item
      );

      saveLocalCart(cartOwner, next);

      setCart((current) => ({
        ...(current || {}),
        products: [
          ...(current?.products || []).filter(
            (item) => !item.isLocal
          ),
          ...next,
        ],
      }));

      return;
    }

    const data = await updateCartItem(
      productId,
      count
    );

    setCart((current) => ({
      ...(data.data || {}),
      products: [
        ...(data.data?.products || []),
        ...(current?.products || []).filter(
          (item) => item.isLocal
        ),
      ],
    }));

    return data;
  }

  async function removeProduct(productId) {
    const localItems = getLocalCart(cartOwner);

    const next = localItems.filter(
      (item) =>
        String(
          item.product.id || item.product._id
        ) !== String(productId)
    );

    if (next.length !== localItems.length) {
      saveLocalCart(cartOwner, next);

      setCart((current) => ({
        ...(current || {}),
        products: [
          ...(current?.products || []).filter(
            (item) => !item.isLocal
          ),
          ...next,
        ],
      }));

      return;
    }

    const data = await removeFromCart(productId);

    setCart((current) => ({
      ...(data.data || {}),
      products: [
        ...(data.data?.products || []),
        ...(current?.products || []).filter(
          (item) => item.isLocal
        ),
      ],
    }));

    return data;
  }

  useEffect(() => {
    loadCart();
  }, [role, user?.email]);

  const cartItemsCount =
    cart?.products?.reduce(
      (total, item) =>
        total + Number(item.count || 0),
      0
    ) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        loadCart,
        addProduct,
        changeQuantity,
        removeProduct,
        cartItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}