# ElectroStore feature status

## Customer / Route API

- [x] Customer registration/login through Route API
- [x] Profile update/password change through Route API
- [x] Categories
- [x] Product listings
- [x] Stock display
- [x] Search and price/category filtering
- [x] Wishlist
- [x] Cart and quantity adjustment
- [x] Cash on Delivery
- [x] Stripe checkout session when the API returns a valid URL
- [x] Customer order history
- [x] Reviews and ratings
- [x] Saved addresses when returned by the API
- [x] Forgot/reset password through the Route API

## Seller demo layer

- [x] Seller registration/login
- [x] Separate seller dashboard
- [x] Seller-only navigation
- [x] Seller-owned product catalog
- [x] Inventory management
- [x] Seller order view
- [x] Seller customer view
- [x] Seller reviews view
- [x] Local profile/password management
- [x] Seller accounts can be restricted by the demo admin

## Admin demo layer

- [x] Separate admin login
- [x] Private admin dashboard
- [x] API catalog/order/user/review views when the connected API token permits them
- [x] Local seller-account management
- [x] Local restrict/allow for demo accounts
- [x] Admin product UI
- [x] Local admin catalog fallback when the public API rejects product mutations

## Intentionally not claimed as complete

- [ ] Google/social login
- [ ] Confirmation email/transactional email
- [ ] Server-side seller accounts and seller ownership
- [ ] Server-side seller payouts
- [ ] PayPal
- [ ] Wallet payment provider
- [ ] Push notifications
- [ ] Newsletter/email marketing
- [ ] Loyalty/reward points
- [ ] Referral bonuses
- [ ] Full server-side promo-code engine
- [ ] Server-side admin role assignment/restriction for Route API users

These items require backend/provider support that is not exposed by the connected public Route API. The frontend does not pretend that unsupported API operations succeeded.
