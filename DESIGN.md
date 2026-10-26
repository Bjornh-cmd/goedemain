# Design tokens — Button Portal (Swiss / Acme)

Source of truth for the portal UI (login, dashboard, admin).

## Visual identity

- **Style:** Swiss International
- **Tags:** rational, editorial, clean
- **Color mode:** light
- **Radius:** none (`0px`)
- **Shadow:** flat (`none`)
- **Motion:** hover-only; respect `prefers-reduced-motion`

## Tokens

```css
:root {
  --pk-primary: #E30613;
  --pk-secondary: #111111;
  --pk-accent: #111111;
  --pk-bg: #F5F5F5;
  --pk-surface: #FFFFFF;
  --pk-fg: #111111;
  --pk-muted: #E5E5E5;
  --pk-border: #D4D4D4;
  --pk-destructive: #E30613;
  --pk-success: #0A7A3E;
  --pk-warning: #C47A00;
  --pk-radius: 0px;
  --pk-shadow: none;
  --pk-pad: 1.25rem;
  --pk-gap: 1.25rem;
  --pk-font-heading: "Space Grotesk", system-ui, sans-serif;
  --pk-font-body: Inter, system-ui, sans-serif;
}
```

## Typography

- **Heading:** Space Grotesk (geometric)
- **Body:** Inter (normal weight, normal line-height)

## Product

- **Name:** Button Portal
- **Voice:** professional
- **Language:** Dutch (UI copy)
