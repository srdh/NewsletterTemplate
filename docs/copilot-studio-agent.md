# Connect the studio chat to Copilot Studio

The chat is already in the OFT Template Maker. These steps turn on the live Copilot reply.

## 1. Create the agent

In [Copilot Studio](https://copilotstudio.microsoft.com), create an agent. Name it something like `OFT Template Maker`.

Open the agent's instructions and paste this:

```
You fill Microsoft Partner Skilling Outlook emails. You never write HTML and you never describe layout.

Reply with one JSON object and nothing else. No markdown.

master_type is one of: event_invite, monthly_update, weekly_snapshot.
Choose event_invite for a regional event invitation.
Choose monthly_update for a Partner Skilling Update newsletter.
Choose weekly_snapshot for a weekly project status email.

You may also set these text fields: name, subject, region, kicker, title, greeting, intro, event_name, event_url, event_date_label, event_time_label, language_note, overview_body, action_heading, action_body, register_label, register_url, secondary_cta_label, secondary_cta_url, signoff_thanks, signer_name, signer_title, signer_email, month_label, subtitle, contents_intro, snapshot_date, callouts.

agenda is a list of {"text": "..."}.
spotlights is a list of {"headline","image_url","body","bullets","cta_label","cta_url"}.
rows is a list of {"section","title","title_url","col_a","col_b","col_c","col_d","col_e","col_f","col_g","highlight"}.

For a weekly snapshot, section is new_requests, work_in_progress, or completed.
For a monthly update, section is virtual_skilling or on_demand.
highlight is yellow, green, orange, or empty.

Omit fields you are not changing. Links inside text look like [Register here](https://aka.ms/example).
```

Save.

## 2. Publish and copy the address

1. Click **Publish**.
2. Open **Channels**.
3. Open **Mobile app**.
4. Copy **Token Endpoint**.

## 3. Paste it into the studio

Copy `.env.example` to `.env` if you do not already have one. Set:

```
VITE_COPILOT_TOKEN_ENDPOINT=the address you copied
```

Restart `npm run dev`. The chat label should say **Copilot Studio connected**.

Type a prompt and press Send. When the reply lists field changes, press **Apply**. The form and the preview update. You can still edit every field by hand.

## If Send fails

- The agent must be published. A draft agent cannot answer the studio.
- The Token Endpoint is the address from Channels, Mobile app. It is not the Copilot Studio page address.
- If Microsoft hosts the agent outside the default region, set `VITE_COPILOT_DIRECTLINE_BASE` to the regional Direct Line address they give you.

## For a real rollout

The Token Endpoint in `.env` is fine for this demo. A production version should keep the Direct Line secret on a server and hand the browser only a short-lived token. This pass does not build that server.
