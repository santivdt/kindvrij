import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { firstName, lastName, email, ageRange } = await request.json();

  if (!email || !firstName) {
    return new Response(JSON.stringify({ error: 'Verplichte velden ontbreken.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = import.meta.env.EMAILOCTOPUS_API_KEY;
  const listId = import.meta.env.EMAILOCTOPUS_LIST_ID;

  const response = await fetch(
    `https://emailoctopus.com/api/1.6/lists/${listId}/contacts`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        email_address: email,
        fields: {
          FirstName: firstName,
          LastName: lastName || '',
          Leeftijdscategorie: ageRange || '',
        },
        status: 'SUBSCRIBED',
      }),
    }
  );

  const result = await response.json();

  if (response.ok) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (result?.error?.code === 'MEMBER_EXISTS_WITH_EMAIL_ADDRESS') {
    return new Response(JSON.stringify({ success: true, existing: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: result?.error?.message || 'Onbekende fout' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
};
