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
  const [error, setError] = useState("");

  const { user, role } = useAuth();

  const cartOwner = user?.email || GUEST_CART_OWNER;

  // Same merge rule the guest cart has always used: identical
  // product ids are combined, everything else is appended.
  function mergeIntoLocalCart(email, incoming) {
    const merged = [...getLocalCart(email)];

    incoming.forEach((item) => {
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
  }

  /* Visitors can fill a cart before signing in, so anything
     collected under the guest key moves into the account on the
     first load.

     That transfer has to happen on the API cart, not only in local
     storage: Route API builds the order from the server cart, so an
     item left behind locally is dropped at checkout. Worse, a local
     copy sharing a product id with a server line hijacks that
     line's quantity and removal, because those look the local copy
     up by product id first and return without calling the API.

     Guest items are real API products, so each one is posted to the
     server cart and its quantity finished with a single write.
     Anything the server will not take stays local rather than being
     silently dropped. */
  async function mergeGuestCartIntoAccount(email) {
    const guestItems = getLocalCart(GUEST_CART_OWNER);

    if (guestItems.length === 0) {
      return;
    }

    const keepLocal = [];

    for (const item of guestItems) {
      const productId = item.product?._id || item.product?.id;

      const wanted = Math.max(
        1,
        Number(item.count || 1)
      );

      if (
        !productId ||
        String(productId).startsWith("local-")
      ) {
        keepLocal.push({ ...item });
        continue;
      }

      try {
        const added = await addToCart(productId);

        /* The POST moves the server line by one, so the guest
           quantity is applied with a single follow-up write. */
        const serverCount = Number(
          added?.data?.products?.find(
            (entry) =>
              String(
                entry?.product?._id || entry?.product?.id
              ) === String(productId)
          )?.count || wanted
        );

        if (wanted > 1) {
          await updateCartItem(
            productId,
            serverCount + wanted - 1
          );
        }
      } catch (error) {
        console.warn(
          "[cart] guest item could not be moved to the account cart:",
          productId,
          error?.message
        );

        keepLocal.push({ ...item });
      }
    }

    mergeIntoLocalCart(email, keepLocal);

    saveLocalCart(GUEST_CART_OWNER, []);
  }

  async function loadCart() {
    if (!user || role !== "customer") {
      setError("");
      setCart({
        _id: `local-cart-${GUEST_CART_OWNER}`,
        products: getLocalCart(GUEST_CART_OWNER),
        totalCartPriceAfterDiscount: 0,
      });
      return;
    }

    await mergeGuestCartIntoAccount(user.email);

    const localItems = getLocalCart(user.email);

    try {
      setLoading(true);

      const data = await getCart();

      setError("");
      setCart({
        ...(data?.data || {}),
        products: [
          ...(data?.data?.products || []),
          ...localItems,
        ],
      });
    } catch (loadError) {
      /* Only this device's saved lines can be shown. Saying
         "empty cart" here would hide a failed request behind a
         normal-looking cart. */
      console.warn(
        "[cart] could not load the account cart:",
        loadError?.message
      );

      setError(
        loadError?.message ||
          "Your cart could not be loaded."
      );

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

    setError("");

    setCart((current) => ({
      ...(data?.data || {}),
      products: [
        ...(data?.data?.products || []),
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

    setError("");

    setCart((current) => ({
      ...(data?.data || {}),
      products: [
        ...(data?.data?.products || []),
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

    setError("");

    setCart((current) => ({
      ...(data?.data || {}),
      products: [
        ...(data?.data?.products || []),
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
        error,
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