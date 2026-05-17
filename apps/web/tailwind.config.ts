import type { Config } from 'tailwindcss';
import preset from '@wayra/ui/tailwind-preset';

const config: Config = {
  presets: [preset],
  content: ['./src/**/*.{ts,tsx,mdx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  plugins: [],
};

export default config;
