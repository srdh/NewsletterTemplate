# Track B tables → Track A Dataverse

Use this when Strat1 later rebuilds the studio as a Power App.

| Supabase | Dataverse | Role |
| --- | --- | --- |
| `campaigns` | `Campaign` | One row per OFT. Master type, banner, intro, CTAs, signature. |
| `agenda_items` | `AgendaItem` | Repeating bullets on the event invite. |
| `spotlight_cards` | `SpotlightCard` | Monthly update Section-1 cards. |
| `event_rows` | `EventRow` | Upcoming events, on-demand journeys, weekly snapshot tables. |

The React studio is the Power App. The merge functions in `src/templates/` are the Power Automate HTML step. The in-browser `.oft` and `.eml` downloads stand in for a tenant Graph or Outlook action.
