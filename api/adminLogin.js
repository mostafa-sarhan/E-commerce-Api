/* Admin TEST login - local development only.
 *
 * The Route E-commerce API that this storefront reads from is a
 * customer API: it exposes /api/v1/auth/signin for customer accounts
 * and has no admin authentication endpoint, so an admin account
 * cannot be created or signed into through it.
 *
 * This endpoint exists so the admin screens can actually be reached
 * while building them. It is three things worth being explicit about:
 *
 *   1. It is OFF unless ENABLE_DEV_ADMIN_LOGIN is exactly "true", so a
 *      production deployment that forgets to set it has no admin login
 *      at all - it answers 404.
 *   2. The credentials are read from the server-side environment and
 *      are never sent to the browser. They must not be committed; keep
 *      them in .env or in the Vercel environment settings.
 *   3. It mints a LOCAL marker token, not a Route API token. The admin
 *      screens call Route API endpoints that require a real admin
 *      token, and those sections will report that they could not load.
 *      That is expected, and the dashboard renders that as a notice. */

/* Compared with a plain string compare on purpose: this is a local
   development gate, not a production credential store, and adding a
   KDF here would be security theatre for a value that is already a
   throwaway in a gitignored .env file. */
function matches(candidate, expected) {
  return (
    typeof candidate === "string" &&
    typeof expected === "string" &&
    candidate.length > 0 &&
    candidate.length === expected.length &&
    candidate === expected
  );
}

function enabled() {
  return process.env.ENABLE_DEV_ADMIN_LOGIN === "true";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed." });
  }

  if (!enabled()) {
    /* Answer exactly like a missing route, so a deployment that has not
       opted in gives away nothing about this file. */
    return res.status(404).json({ message: "Not found." });
  }

  const email = process.env.ADMIN_TEST_EMAIL;
  const password = process.env.ADMIN_TEST_PASSWORD;

  if (!email || !password) {
    console.error(
      "[admin] ENABLE_DEV_ADMIN_LOGIN is true but ADMIN_TEST_EMAIL / " +
        "ADMIN_TEST_PASSWORD are missing."
    );

    return res.status(500).json({ message: "Admin test login is not configured." });
  }

  const submittedEmail = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  const submittedPassword = req.body?.password;

  const sameEmail = submittedEmail === email.trim().toLowerCase();
  const samePassword = matches(submittedPassword, password);

  /* One generic message for both halves so the response cannot be used
     to discover which part was wrong. */
  if (!sameEmail || !samePassword) {
    console.warn("[admin] rejected a dev admin test login attempt");

    return res.status(401).json({ message: "Incorrect email or password." });
  }

  console.warn(
    "[admin] dev admin test login used - this account is local only and has no Route API admin rights"
  );

  return res.status(200).json({
    token: `dev-admin-${Buffer.from(email).toString("hex").slice(0, 16)}`,
    user: {
      _id: "dev-admin-test-account",
      name: "Voltix Admin (test)",
      email,
      role: "admin",
    },
  });
}