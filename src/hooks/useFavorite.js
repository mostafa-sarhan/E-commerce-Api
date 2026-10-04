import { useCallback, useEffect, useState } from "react";
import {
  isFavorite,
  subscribeFavorites,
  toggleFavorite,
} from "../services/favorites";

/**
 * Reads the favourites store and re-renders when any card
 * toggles a heart. The stored value is kept next to the
 * identity it was read for, so switching user or product
 * resolves to the correct value without an extra render pass.
 */
export default function useFavorite(product, userEmail) {
  const productId = product?._id || product?.id || "";
  const email = userEmail || "";
  const identity = `${email}::${productId}`;

  const [snapshot, setSnapshot] = useState(() => ({
    identity,
    value: isFavorite(email, productId),
  }));

  useEffect(
    () =>
      subscribeFavorites(() => {
        setSnapshot({
          identity,
          value: isFavorite(email, productId),
        });
      }),
    [identity, email, productId],
  );

  const favorite =
    snapshot.identity === identity
      ? snapshot.value
      : isFavorite(email, productId);

  const toggle = useCallback(() => {
    const next = toggleFavorite(email, product);

    setSnapshot({ identity, value: next });

    return next;
  }, [email, product, identity]);

  return { favorite, toggle };
}
