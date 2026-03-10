import type { APIRoute } from 'astro';
import Stripe from 'stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { firstName, lastName, email, ageRange } = await request.json();

  if (!email || !firstName) {
    return new Response(JSON.stringify({ error: 'Verplichte velden ontbreken.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'ideal'],
    mode: 'payment',
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          unit_amount: 750,
          product_data: {
            name: 'Kindvrij Amsterdam — Praatgroep pilot',
            description: 'Deelname aan de pilot-sessie van de praatgroep',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      firstName,
      lastName: lastName || '',
      ageRange: ageRange || '',
    },
    success_url: `${import.meta.env.SITE_URL}/bedankt`,
    cancel_url: `${import.meta.env.SITE_URL}/#praatgroep`,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
