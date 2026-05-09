export const APP_PRIMARY_MAIN = '#3b82f6';
export const APP_PRIMARY_DARK = '#2563eb';
export const APP_PRIMARY_LIGHT = '#93c5fd';
export const APP_PRIMARY_SOFT_BG = 'rgba(59, 130, 246, 0.1)';
export const APP_PRIMARY_SOFT_BORDER = 'rgba(59, 130, 246, 0.22)';
export const APP_PRIMARY_MUTED_BORDER = 'rgba(59, 130, 246, 0.28)';

export const BRAND_NAVY = '#2563eb';
export const BRAND_SKY = '#3b82f6';
export const BRAND_SKY_LIGHT = '#60a5fa';
export const BRAND_AQUA = '#93c5fd';

export const BRAND_PASTEL_BLUE = 'rgba(191, 219, 254, 0.82)';

export const BRAND_PASTEL_SURFACE = `
    #eaf3ff
`;

export const BRAND_PASTEL_AURA = `
    rgba(191, 219, 254, 0.45)
`;

export const BRAND_BLUE_GRADIENT = BRAND_PASTEL_BLUE;

export const BRAND_BLUE_GRADIENT_OVERLAY = 'transparent';

export const HOME_HERO_SHELF_GRADIENT = BRAND_PASTEL_SURFACE;

export const HOME_PAGE_BODY_GRADIENT =
    '#60A5FA';

/** Homepage: light → slightly deeper blue per section (subtle, readable) */
export const HOME_BAND_0 = '#eef4ff';
export const HOME_BAND_1 = '#e2ecff';
export const HOME_BAND_2 = '#d6e4ff';
export const HOME_BAND_3 = '#c7dbff';
export const HOME_BAND_4 = '#b7d1ff';
export const HOME_BAND_5 = '#a8c6ff';
export const HOME_BAND_6 = '#99bcff';

export const HOME_PAGE_SURFACE_GRADIENT =
    HOME_BAND_0;

export const HOME_SECTION_ABOUT_BG =
    HOME_BAND_1;

export const HOME_SECTION_SCHOOL_BG =
    HOME_BAND_1;

export const HOME_SECTION_CONSULT_BG =
    '#D9EAF5';

export const HOME_SECTION_PACKAGES_BG =
    HOME_BAND_4;

export const HOME_SECTION_TESTIMONIAL_BG =
    '#E6F1FA';

export const HOME_PAGE_HERO_BACKDROP = '#f6f9ff';

export const HEADER_HOME_BAR_BG = '#eaf2fb';

const HERO_BAND_A = '#d4e6f5';
const HERO_BAND_B = '#b0cfe8';
const HERO_BAND_C = '#8ab6db';
const HERO_BAND_D = '#6899ca';
const HERO_BAND_E = '#4f7fb5';

export const HOME_HERO_BOTTOM_BG = '#3a5f90';

export const HOME_HERO_WAVE_FLOOR = HOME_HERO_BOTTOM_BG;

export const HOME_SCHOOL_SECTION_SURFACE = '#e8f4fc';

export const HOME_CONSULT_SECTION_TOP = '#eff6ff';

export const HOME_PAGE_HERO_BANNER_GRADIENT =
    HEADER_HOME_BAR_BG;

export const HOME_PAGE_HERO_TOP_GRADIENT =
    HERO_BAND_A;

export const HOME_MOUNTAIN_HERO_FILLS = [
    HEADER_HOME_BAR_BG,
    HERO_BAND_A,
    HERO_BAND_B,
    HERO_BAND_C,
    HERO_BAND_D,
    HERO_BAND_E,
    HOME_HERO_BOTTOM_BG
];

export const HOME_MOUNTAIN_FOOTER_FILLS = [
    HOME_BAND_5,
    HOME_BAND_4,
    HOME_BAND_3,
    HOME_BAND_2,
    HOME_BAND_1,
    HOME_BAND_0,
    '#f8fbff'
];

export function landingSectionShadow(depth = 3) {
    const y = depth <= 2 ? 10 : depth <= 4 ? 18 : 24;
    const blur = depth <= 2 ? 28 : depth <= 4 ? 40 : 52;
    const alpha = depth <= 2 ? 0.06 : depth <= 4 ? 0.08 : 0.1;
    return `0 ${y}px ${blur}px rgba(51, 65, 85, ${alpha * 0.92})`;
}
