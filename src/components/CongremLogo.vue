<script setup lang="ts">
/**
 * The Congrem mark — the platform's logo, not a tenant's.
 *
 * Inline SVG rather than an `<img>` on purpose: every shape is
 * `currentColor`, and an image cannot inherit `color`. So the mark takes the
 * text colour of whatever it sits in, which is exactly what the brand
 * guidelines ask for on a tenant-themed surface: ink on light, white on dark,
 * and visibly separate from whichever colours the convention brought with it.
 * Never recolour it to a tenant's brand colour.
 *
 * Sizing is the caller's, through a class — set a height and leave the width
 * to the viewBox. Two minimums to respect (below them the drawing stops
 * reading): 20px tall for the outlined square, 130px wide for the horizontal
 * lockup, which is ~33px of height.
 *
 * `variant` picks square mark or horizontal lockup: use the lockup where
 * there is room and the name needs saying, the square where the name is
 * already present in context. `cut` picks outlined or filled: outlined is
 * primary, filled is for small sizes, dark grounds and busy grounds. Don't mix
 * the two cuts in one view.
 */
withDefaults(
  defineProps<{
    variant?: 'horizontal' | 'square'
    cut?: 'outline' | 'solid'
  }>(),
  {
    variant: 'horizontal',
    cut: 'outline',
  },
)
</script>

<template>
  <svg
    :viewBox="variant === 'horizontal' ? '0 0 474.8 120' : '0 0 120 120'"
    fill="currentColor"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!--
      The accessible name of the mark. Pass `aria-hidden="true"` where the word
      "congrem" is already visible next to it, so it is not announced twice.
    -->
    <title>Congrem</title>

    <!--
      Five people on the quincunx — a die's five-face, with figures for pips.
      The outlined cut draws the frame and the figures separately; the filled
      cut is one shape with the figures knocked out of it.
    -->
    <g v-if="cut === 'outline'" class="congrem-mark">
      <rect
        class="congrem-frame"
        x="10"
        y="10"
        width="100"
        height="100"
        rx="26"
        fill="none"
        stroke="currentColor"
        stroke-width="9"
      />
      <g class="congrem-people" fill="currentColor">
        <circle cx="37" cy="32.35" r="4.6" />
        <path d="M29 46.25a8 8 0 0 1 16 0Z" />
        <circle cx="83" cy="32.35" r="4.6" />
        <path d="M75 46.25a8 8 0 0 1 16 0Z" />
        <circle cx="60" cy="55.35" r="4.6" />
        <path d="M52 69.25a8 8 0 0 1 16 0Z" />
        <circle cx="37" cy="78.35" r="4.6" />
        <path d="M29 92.25a8 8 0 0 1 16 0Z" />
        <circle cx="83" cy="78.35" r="4.6" />
        <path d="M75 92.25a8 8 0 0 1 16 0Z" />
      </g>
    </g>
    <path
      v-else
      class="congrem-mark"
      fill-rule="evenodd"
      d="M36 5.5h48a30.5 30.5 0 0 1 30.5 30.5v48a30.5 30.5 0 0 1 -30.5 30.5h-48a30.5 30.5 0 0 1 -30.5 -30.5v-48a30.5 30.5 0 0 1 30.5 -30.5ZM32.4 32.35a4.6 4.6 0 1 0 9.2 0a4.6 4.6 0 1 0 -9.2 0ZM29 46.25a8 8 0 0 1 16 0ZM78.4 32.35a4.6 4.6 0 1 0 9.2 0a4.6 4.6 0 1 0 -9.2 0ZM75 46.25a8 8 0 0 1 16 0ZM55.4 55.35a4.6 4.6 0 1 0 9.2 0a4.6 4.6 0 1 0 -9.2 0ZM52 69.25a8 8 0 0 1 16 0ZM32.4 78.35a4.6 4.6 0 1 0 9.2 0a4.6 4.6 0 1 0 -9.2 0ZM29 92.25a8 8 0 0 1 16 0ZM78.4 78.35a4.6 4.6 0 1 0 9.2 0a4.6 4.6 0 1 0 -9.2 0ZM75 92.25a8 8 0 0 1 16 0Z"
    />

    <!--
      `congrem`, lowercase, as outlines — so nothing depends on Outfit being
      installed. The 28-unit gap to the mark is baked into the transform; it is
      part of the lockup and not ours to change.
    -->
    <path
      v-if="variant === 'horizontal'"
      class="congrem-wordmark"
      fill="currentColor"
      transform="translate(145.85 80.00) scale(0.08282)"
      d="M286.0 10Q212.0 10 153.0 -23.0Q94.0 -56 60.0 -113.0Q26.0 -170 26.0 -241Q26.0 -313 60.0 -370.0Q94.0 -427 153.5 -460.5Q213.0 -494 286.0 -494Q343.0 -494 391.0 -473.0Q439.0 -452 474.0 -413L390.0 -328Q371.0 -349 344.5 -360.0Q318.0 -371 286.0 -371Q250.0 -371 221.5 -354.5Q193.0 -338 176.5 -309.5Q160.0 -281 160.0 -242Q160.0 -204 176.5 -174.5Q193.0 -145 221.5 -128.5Q250.0 -112 286.0 -112Q319.0 -112 345.5 -123.5Q372.0 -135 391.0 -157L476.0 -72Q439.0 -32 391.0 -11.0Q343.0 10 286.0 10ZM773.0 10Q700.0 10 641.5 -23.5Q583.0 -57 548.5 -114.5Q514.0 -172 514.0 -243Q514.0 -314 548.0 -370.5Q582.0 -427 641.0 -460.5Q700.0 -494 772.0 -494Q846.0 -494 904.5 -460.5Q963.0 -427 997.0 -370.5Q1031.0 -314 1031.0 -243Q1031.0 -172 997.0 -114.5Q963.0 -57 904.5 -23.5Q846.0 10 773.0 10ZM772.0 -112Q809.0 -112 837.5 -128.5Q866.0 -145 881.5 -174.5Q897.0 -204 897.0 -242Q897.0 -280 881.0 -309.0Q865.0 -338 837.0 -354.5Q809.0 -371 772.0 -371Q736.0 -371 708.0 -354.5Q680.0 -338 664.0 -309.0Q648.0 -280 648.0 -242Q648.0 -204 664.0 -174.5Q680.0 -145 708.0 -128.5Q736.0 -112 772.0 -112ZM1436.0 0V-277Q1436.0 -320 1409.0 -347.0Q1382.0 -374 1339.0 -374Q1311.0 -374 1289.0 -362.0Q1267.0 -350 1254.5 -328.0Q1242.0 -306 1242.0 -277L1191.0 -303Q1191.0 -360 1215.5 -402.5Q1240.0 -445 1283.5 -469.0Q1327.0 -493 1382.0 -493Q1435.0 -493 1477.0 -466.5Q1519.0 -440 1543.0 -397.5Q1567.0 -355 1567.0 -306V0ZM1111.0 0V-483H1242.0V0ZM1871.0 214Q1794.0 214 1735.0 186.5Q1676.0 159 1641.0 109L1724.0 26Q1752.0 59 1786.5 76.5Q1821.0 94 1870.0 94Q1931.0 94 1966.5 63.0Q2002.0 32 2002.0 -23V-144L2024.0 -250L2003.0 -356V-483H2133.0V-25Q2133.0 47 2099.5 100.5Q2066.0 154 2007.0 184.0Q1948.0 214 1871.0 214ZM1865.0 -13Q1800.0 -13 1748.0 -44.5Q1696.0 -76 1666.5 -131.0Q1637.0 -186 1637.0 -254Q1637.0 -322 1666.5 -376.0Q1696.0 -430 1748.0 -461.5Q1800.0 -493 1865.0 -493Q1919.0 -493 1960.5 -472.0Q2002.0 -451 2026.0 -414.5Q2050.0 -378 2052.0 -329V-177Q2050.0 -129 2025.5 -91.5Q2001.0 -54 1959.5 -33.5Q1918.0 -13 1865.0 -13ZM1891.0 -132Q1927.0 -132 1953.5 -147.5Q1980.0 -163 1995.0 -190.5Q2010.0 -218 2010.0 -253Q2010.0 -289 1995.0 -316.0Q1980.0 -343 1953.5 -358.5Q1927.0 -374 1891.0 -374Q1855.0 -374 1828.0 -358.5Q1801.0 -343 1786.0 -315.5Q1771.0 -288 1771.0 -253Q1771.0 -219 1786.0 -191.5Q1801.0 -164 1828.0 -148.0Q1855.0 -132 1891.0 -132ZM2244.0 0V-483H2375.0V0ZM2375.0 -267 2324.0 -301Q2333.0 -390 2376.0 -441.5Q2419.0 -493 2500.0 -493Q2535.0 -493 2563.0 -481.5Q2591.0 -470 2614.0 -444L2532.0 -350Q2521.0 -362 2505.5 -368.0Q2490.0 -374 2470.0 -374Q2428.0 -374 2401.5 -347.5Q2375.0 -321 2375.0 -267ZM2905.0 10Q2829.0 10 2770.0 -22.5Q2711.0 -55 2676.5 -112.0Q2642.0 -169 2642.0 -242Q2642.0 -314 2675.5 -370.5Q2709.0 -427 2767.0 -460.5Q2825.0 -494 2896.0 -494Q2966.0 -494 3019.5 -462.5Q3073.0 -431 3103.5 -376.5Q3134.0 -322 3134.0 -253Q3134.0 -240 3132.5 -226.5Q3131.0 -213 3127.0 -196L2721.0 -195V-293L3066.0 -294L3013.0 -253Q3011.0 -296 2997.5 -325.0Q2984.0 -354 2958.5 -369.5Q2933.0 -385 2896.0 -385Q2857.0 -385 2828.0 -367.5Q2799.0 -350 2783.5 -318.5Q2768.0 -287 2768.0 -244Q2768.0 -200 2784.5 -167.5Q2801.0 -135 2832.0 -117.5Q2863.0 -100 2904.0 -100Q2941.0 -100 2971.0 -112.5Q3001.0 -125 3023.0 -150L3100.0 -73Q3065.0 -32 3014.5 -11.0Q2964.0 10 2905.0 10ZM3211.0 0V-483H3342.0V0ZM3526.0 0V-285Q3526.0 -327 3499.5 -350.5Q3473.0 -374 3434.0 -374Q3408.0 -374 3387.0 -363.5Q3366.0 -353 3354.0 -333.0Q3342.0 -313 3342.0 -285L3291.0 -310Q3291.0 -366 3315.5 -407.0Q3340.0 -448 3382.0 -470.5Q3424.0 -493 3477.0 -493Q3527.0 -493 3568.0 -470.5Q3609.0 -448 3633.0 -407.5Q3657.0 -367 3657.0 -310V0ZM3841.0 0V-285Q3841.0 -327 3814.5 -350.5Q3788.0 -374 3749.0 -374Q3724.0 -374 3702.5 -363.5Q3681.0 -353 3669.0 -333.0Q3657.0 -313 3657.0 -285L3582.0 -303Q3586.0 -361 3613.0 -403.5Q3640.0 -446 3684.0 -469.5Q3728.0 -493 3782.0 -493Q3836.0 -493 3879.0 -470.5Q3922.0 -448 3947.0 -406.0Q3972.0 -364 3972.0 -306V0Z"
    />
  </svg>
</template>
