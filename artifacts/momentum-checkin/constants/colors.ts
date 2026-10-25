/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#20372F',
    tint: '#2F644F',

    // Core surfaces
    background: '#F7F6F0',
    foreground: '#20372F',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#20372F',

    // Primary action color (buttons, links, active states)
    primary: '#2F644F',
    primaryForeground: '#FFFFFF',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E9EFE8',
    secondaryForeground: '#2F644F',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#ECEDE6',
    mutedForeground: '#7B8179',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#E9EFE8',
    accentForeground: '#2F644F',

    // Destructive actions (delete, error states)
    destructive: '#B84D3B',
    destructiveForeground: '#FFFFFF',

    // Borders and input outlines
    border: '#E7E7DE',
    input: '#E7E7DE',
  },

  dark: {
    text: '#EEF3EA',
    tint: '#B5D88A',
    background: '#18251F',
    foreground: '#EEF3EA',
    card: '#22332A',
    cardForeground: '#EEF3EA',
    primary: '#B5D88A',
    primaryForeground: '#20372F',
    secondary: '#2C4035',
    secondaryForeground: '#D6E8C2',
    muted: '#2A3931',
    mutedForeground: '#A2AEA4',
    accent: '#31483A',
    accentForeground: '#D6E8C2',
    destructive: '#E37B66',
    destructiveForeground: '#FFFFFF',
    border: '#34453B',
    input: '#34453B',
  },
  radius: 20,
};

export default colors;
