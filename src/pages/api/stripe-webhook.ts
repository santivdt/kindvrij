import type { APIRoute } from 'astro';
import Stripe from 'stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature') ?? '';

  const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

  const webhookSecret = import.meta.env.DEV
    ? import.meta.env.STRIPE_WEBHOOK_SECRET_TEST
    : import.meta.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return new Response('Webhook fout', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession;
    const { firstName, lastName, ageRange } = session.metadata ?? {};
    const email = session.customer_email ?? '';

    await fetch(
      `https://emailoctopus.com/api/1.6/lists/${import.meta.env.EMAILOCTOPUS_LIST_ID}/contacts`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: import.meta.env.EMAILOCTOPUS_API_KEY,
          email_address: email,
          fields: {
            FirstName: firstName || '',
            LastName: lastName || '',
            Leeftijdscategorie: ageRange || '',
          },
          status: 'SUBSCRIBED',
          tags: ['pilot'],
        }),
      }
    );
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
