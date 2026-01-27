# Or-Care-Stra Ensemble - Brand Guidelines

## Color Palette

### Primary Gradient Colors (Waveform Bars)
| Color     | Hex       | RGB             | Usage              |
|-----------|-----------|-----------------|-------------------|
| Teal      | `#25b59a` | 37, 181, 154    | Bar 1-2, Primary  |
| Blue      | `#4d91cc` | 77, 145, 204    | Bar 3             |
| Purple    | `#8a70df` | 138, 112, 223   | Bar 4, Subtitle   |
| Violet    | `#ae71d6` | 174, 113, 214   | Bar 5             |
| Pink      | `#e1629d` | 225, 98, 157    | Bar 6             |
| Coral     | `#ed787a` | 237, 120, 122   | Bar 7             |
| Orange    | `#f19149` | 241, 145, 73    | Bar 8             |
| Amber     | `#f5ac5d` | 245, 172, 93    | Gradient End      |

### CSS Variables
```css
:root {
  /* Brand Primary Colors */
  --brand-teal: #25b59a;
  --brand-blue: #4d91cc;
  --brand-purple: #8a70df;
  --brand-violet: #ae71d6;
  --brand-pink: #e1629d;
  --brand-coral: #ed787a;
  --brand-orange: #f19149;
  --brand-amber: #f5ac5d;

  /* Logo Gradient */
  --logo-gradient: linear-gradient(90deg, #25b59a, #f5ac5d);

  /* Subtitle Color */
  --subtitle-color: #8a70df;
}
```

## Typography

### Primary Wordmark: "or-care-stra"
- **Font:** Montserrat Bold
- **Size:** 36px
- **Fill:** Gradient `#25b59a` → `#f5ac5d`
- **Letter-spacing:** -0.5px
- **Text-transform:** lowercase

### Subtitle: "ensemble"
- **Font:** Montserrat Medium
- **Size:** 20px (55% of main text)
- **Color:** `#8a70df` (solid purple)
- **Letter-spacing:** normal

### CSS Implementation
```css
.logo-text-main {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 36px;
  letter-spacing: -0.5px;
  background: linear-gradient(90deg, #25b59a, #f5ac5d);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-text-sub {
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  font-size: 20px;
  color: #8a70df;
}
```

## Logo Waveform Bars

### Bar Specifications
- **Bar width:** 6px
- **Bar spacing:** 4px (gap between bars)
- **Bar radius:** 3px (fully rounded)
- **Total bars:** 8

### Bar Heights (at rest)
| Bar | Height | Color     |
|-----|--------|-----------|
| 1   | 12px   | `#25b59a` |
| 2   | 20px   | `#4d91cc` |
| 3   | 28px   | `#8a70df` |
| 4   | 36px   | `#ae71d6` |
| 5   | 32px   | `#e1629d` |
| 6   | 24px   | `#ed787a` |
| 7   | 16px   | `#f19149` |
| 8   | 10px   | `#f5ac5d` |

### Animation Specifications
- **Animation type:** Height pulse (scaleY transform)
- **Duration:** 1.2 seconds
- **Timing function:** ease-in-out
- **Repeat:** infinite
- **Stagger delay:** 0.1s per bar (0s to 0.7s)
- **Scale at midpoint:** 0.5 (50%)

## Spacing Guidelines

### Logo Layout
- **Bars to text gap:** 15px (primary layout)
- **Bars to text gap:** 10px (compact layout)
- **Text vertical spacing:** 4px (between "or-care-stra" and "ensemble")
- **Minimum clear space:** 20px around entire logo

### Layout Variants
1. **Horizontal:** Bars left, text right
2. **Stacked:** Bars top, text below centered
3. **Icon only:** Bars only (for app icons)

## Minimum Sizes

| Layout      | Minimum Width |
|-------------|---------------|
| Horizontal  | 180px         |
| Stacked     | 120px         |
| Icon only   | 40px          |

## File Formats

### Web Assets
- **SVG:** Primary format for web (scalable, animated)
- **PNG:** Fallback for non-SVG contexts

### Desktop Icons
| Platform | Format | Sizes Required |
|----------|--------|----------------|
| Windows  | .ico   | 16, 32, 48, 256 |
| macOS    | .icns  | 16, 32, 128, 256, 512, 1024 |
| Linux    | .png   | 48, 64, 128, 256, 512 |

### Icon Conversion Tools
- **Windows (.ico):** Convertio.co, ICOConvert.com, ImageMagick
- **macOS (.icns):** CloudConvert.com, iconutil (Terminal)

## Usage Examples

### Navigation Bar (Compact)
```html
<a href="/" class="nav-logo">
  <div class="logo-waveform">
    <span class="bar"></span>
    <span class="bar"></span>
    <span class="bar"></span>
    <span class="bar"></span>
    <span class="bar"></span>
    <span class="bar"></span>
    <span class="bar"></span>
    <span class="bar"></span>
  </div>
  <div class="logo-text">
    <span class="logo-text-main">or-care-stra</span>
    <span class="logo-text-sub">ensemble</span>
  </div>
</a>
```

### Hero Section (Full Size)
```html
<div class="hero-logo">
  <div class="logo-waveform large">...</div>
  <div class="logo-text">
    <span class="logo-text-main">or-care-stra</span>
    <span class="logo-text-sub">ensemble</span>
  </div>
</div>
```

## Brand Assets Location

```
/public/assets/
├── logo-animated.svg      # Full animated logo (SVG)
├── logo-icon.svg          # Bars only (static)
├── logo-horizontal.svg    # Horizontal layout
├── logo-stacked.svg       # Stacked layout
└── favicon.svg            # Browser favicon

/electron/icons/
├── icon.svg               # Source icon
├── icon.icns              # macOS app icon
├── icon.ico               # Windows app icon
└── icon.png               # Fallback PNG (512x512)

/Inputs and assets/
├── orcarestra-ensemble-icon-bars.png     # Source bars image
└── orcarestra-ensemble-stacked-4x.png    # Source stacked logo
```

## Do's and Don'ts

### Do
- Use the official color palette
- Maintain minimum clear space
- Use gradient for main wordmark
- Keep "ensemble" in solid purple
- Animate bars with provided timing

### Don't
- Stretch or distort the logo
- Use colors outside the palette
- Remove animation in interactive contexts
- Place logo on busy backgrounds without contrast
- Reduce below minimum sizes

## Accessibility

- Ensure sufficient contrast against backgrounds
- Provide alt text for logo images: "Or-care-stra Ensemble logo"
- Animation can be disabled with `prefers-reduced-motion` media query

```css
@media (prefers-reduced-motion: reduce) {
  .logo-waveform .bar {
    animation: none;
  }
}
```
