# Navigation Gradient Theme

This document explains how to enable and customize gradient themes for the side navigation and top navigation.

## Quick Start

To enable gradients, simply override the CSS variables in your stylesheet or via inline styles:

```css
:root {
  /* Enable side nav gradient */
  --nav-side-bg: var(--nav-side-gradient);
  
  /* Enable top nav gradient */
  --nav-top-bg: var(--nav-top-gradient);
}
```

## Available Variables

### Side Navigation
- `--nav-side-bg`: Background for side navigation (defaults to `var(--bg-secondary)`)
- `--nav-side-gradient`: Pre-defined gradient (lavender to peach)
- `--nav-side-gradient-start`: Start color of gradient (#C8C2EC)
- `--nav-side-gradient-end`: End color of gradient (#E8DDCD)

### Top Navigation
- `--nav-top-bg`: Background for top navigation/header (defaults to `var(--bg-primary)`)
- `--nav-top-gradient`: Pre-defined gradient (lavender to peach)
- `--nav-top-gradient-start`: Start color of gradient (#C8C2EC)
- `--nav-top-gradient-end`: End color of gradient (#E8DDCD)

## Custom Gradients

You can create custom gradients by setting the start/end colors:

```css
:root {
  --nav-side-gradient-start: #your-start-color;
  --nav-side-gradient-end: #your-end-color;
  --nav-side-gradient: linear-gradient(to bottom, var(--nav-side-gradient-start), var(--nav-side-gradient-end));
  --nav-side-bg: var(--nav-side-gradient);
}
```

## A/B Testing

For A/B testing, you can conditionally enable gradients:

```css
/* Variant A: Solid colors (default) */
:root {
  --nav-side-bg: var(--bg-secondary);
  --nav-top-bg: var(--bg-primary);
}

/* Variant B: Gradients */
:root[data-nav-variant="gradient"] {
  --nav-side-bg: var(--nav-side-gradient);
  --nav-top-bg: var(--nav-top-gradient);
}
```

Then toggle via JavaScript:
```javascript
document.documentElement.setAttribute('data-nav-variant', 'gradient');
```

## Dark Mode

Dark mode gradients are automatically adjusted with darker, more muted colors:
- `--nav-side-gradient-start`: #2a2535
- `--nav-side-gradient-end`: #3a2f2a

## Examples

### Enable only side nav gradient
```css
:root {
  --nav-side-bg: var(--nav-side-gradient);
}
```

### Enable only top nav gradient
```css
:root {
  --nav-top-bg: var(--nav-top-gradient);
}
```

### Enable both
```css
:root {
  --nav-side-bg: var(--nav-side-gradient);
  --nav-top-bg: var(--nav-top-gradient);
}
```

### Custom purple gradient
```css
:root {
  --nav-side-gradient-start: #9b87f5;
  --nav-side-gradient-end: #c084fc;
  --nav-side-gradient: linear-gradient(to bottom, var(--nav-side-gradient-start), var(--nav-side-gradient-end));
  --nav-side-bg: var(--nav-side-gradient);
}
```
