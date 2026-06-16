import "./config";
import express, { type Request } from "express";
import Stripe from "stripe";
import cors from "cors";

const stripeClient = new Stripe(
  process.env.STRIPE_KEY || "api_key_placeholder",
);

const app = express();
app.use(cors());
app.use(express.json());

interface CheckoutBody {
  amount: number;
  items: { name: string; price: number; quantity: number }[];
}

app.post(
  "/checkout-session",
  async (req: Request<{}, {}, CheckoutBody>, res) => {
    const { amount, items } = req.body;

    const lineItems = items.map((item) => {
      return {
        price_data: {
          currency: "inr",

          product_data: {
            name: item.name,
          },

          unit_amount: item.price * 100,
        },

        quantity: item.quantity,
      };
    });

    const session = stripeClient.checkout.sessions.create({
      payment_method_types: ["upi", "card", "amazon_pay"],
      line_items: lineItems,

      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });

    res.json({ url: (await session).url });
  },
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
});
