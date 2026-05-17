import type { Config } from 'tailwindcss';
// The preset is a .cjs file with an untyped default export — cast through unknown.
import preset from '@wayra/ui/tailwind-preset';

const config: Config = {
  presets: [preset as unknown as Partial<Config>],
  content: ['./src/**/*.{ts,tsx,mdx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  plugins: [],
};

export default config;
