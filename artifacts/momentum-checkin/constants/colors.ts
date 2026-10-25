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
    text: '#493348',
    tint: '#B83B73',

    // Core surfaces
    background: '#FFF8FB',
    foreground: '#493348',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#493348',

    // Primary action color (buttons, links, active states)
    primary: '#B83B73',
    primaryForeground: '#FFFFFF',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#FBE8F0',
    secondaryForeground: '#813054',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#F6EEF4',
    mutedForeground: '#806F80',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#FFE1EC',
    accentForeground: '#813054',

    // Destructive actions (delete, error states)
    destructive: '#B23F55',
    destructiveForeground: '#FFFFFF',

    // Borders and input outlines
    border: '#F1DDE8',
    input: '#F1DDE8',
    candyPink: '#FFE1EC',
    candyPeach: '#FFE3CE',
    candyLemon: '#FFF1B8',
    candyMint: '#D5F2DF',
    candySky: '#D5ECFA',
    candyLavender: '#E8DDF9',
    candyRose: '#F1A7C5',
    candyCoral: '#F7B9AB',
    candyCaramel: '#F3D3A9',
    candyCream: '#FFFBF4',
    candyInk: '#493348',
    candyRoseDark: '#9F4C70',
    candyMintDark: '#5A8D6C',
    candyCaramelDark: '#98672D',
    candySkyDark: '#5A7895',
    candyLavenderDark: '#765C99',
  },

  dark: {
    text: '#FFF0F6',
    tint: '#F29ABD',
    background: '#241B26',
    foreground: '#FFF0F6',
    card: '#342739',
    cardForeground: '#FFF0F6',
    primary: '#F29ABD',
    primaryForeground: '#35202C',
    secondary: '#493043',
    secondaryForeground: '#FFD9E8',
    muted: '#3C2E40',
    mutedForeground: '#C3ADC2',
    accent: '#563349',
    accentForeground: '#FFE2ED',
    destructive: '#F28CA0',
    destructiveForeground: '#FFFFFF',
    border: '#554158',
    input: '#554158',
    candyPink: '#563349',
    candyPeach: '#594033',
    candyLemon: '#5C5030',
    candyMint: '#304B3B',
    candySky: '#30465A',
    candyLavender: '#483853',
    candyRose: '#754359',
    candyCoral: '#75413B',
    candyCaramel: '#66503A',
    candyCream: '#342739',
    candyInk: '#FFF0F6',
    candyRoseDark: '#F29ABD',
    candyMintDark: '#B9E4C7',
    candyCaramelDark: '#F4D294',
    candySkyDark: '#B5DCF7',
    candyLavenderDark: '#D2B9F2',
  },
  radius: 20,
};

export default colors;
