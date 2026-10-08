/** Seeded accounts behind the "Try as demo …" buttons. Passwords are public on purpose. */
export const DEMO_ACCOUNTS = {
  customer: {
    name: "Demo Customer",
    email: "demo@bookstore.test",
    password: "demo-customer",
    role: "CUSTOMER",
  },
  admin: {
    name: "Demo Admin",
    email: "admin@bookstore.test",
    password: "demo-admin",
    role: "ADMIN",
  },
} as const;
