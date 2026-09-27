# ElectroStore

React/Vite e-commerce frontend with three clearly separated experiences:

- **Customer:** Route API account, catalog, cart, wishlist, checkout, orders and reviews.
- **Seller:** local seller account for the frontend demo, with a private seller dashboard and seller-owned local catalog.
- **Admin:** local demo administrator with a private admin dashboard. API-backed catalog/order/user/review data is displayed when the connected Route API token permits it.

## Important API boundary

The connected Route E-commerce API provides public e-commerce resources such as products, categories, authentication, cart, orders, coupons, wishlist and addresses. It does **not** provide the marketplace-specific seller role/ownership system required by this project. Therefore seller ownership and the demo admin account are kept locally instead of pretending that Route API supports those features.

Route API base URL:
`https://ecommerce.routemisr.com`

Customer registration uses the API's signup contract:
`name`, `email`, `password`, `rePassword`, `phone`.

## Account behavior

### Customer
- Registers and logs in through Route API.
- Sees Home, Products, Wishlist, Orders, Cart and Customer Dashboard.
- Can checkout with Cash on Delivery or Stripe when the API returns a valid checkout session.
- Can manage profile, addresses, reviews and wishlist.

### Seller
- Seller registration is intentionally local because the public Route API does not expose seller accounts.
- After login/registration, the seller goes directly to Seller Dashboard.
- Seller does not see Home, public Products, Cart or Customer Wishlist/Orders.
- Seller can manage only their own local products, inventory, seller orders, customers and reviews.

### Admin
- Admin registration is disabled.
- Demo login:
  - Email: `admin@electrostore.com`
  - Password: `Admin@12345`
- Admin goes directly to `/admin`.
- Admin does not see the public Home/Products storefront.
- Admin can view API-backed catalog/orders/users/reviews when the API token allows it.
- Local demo accounts can be restricted/allowed from the admin user-management screen.
- Product mutations fall back to a separate local admin catalog when the public API rejects the mutation, and the UI states that it was not saved server-side.

## Payment boundary

- **Cash on Delivery:** supported.
- **Stripe:** supported only when the Route API returns a valid checkout session URL.
- **PayPal / Wallet:** shown as unavailable because no provider/backend integration is configured.
- No payment success is fabricated in the frontend.

## Order boundary

- API-backed customer orders remain API orders when the API accepts the order.
- Local seller products use local cart/order persistence because they are not server-side Route API products.
- Seller/admin local order actions update the local demo data only.

## Run

```bash
npm install
npm run dev
```
# E-commerce-Api
