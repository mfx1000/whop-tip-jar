import { frostedThemePlugin } from "@whop/react/tailwind";

export default { 
	plugins: [frostedThemePlugin()],
	darkMode: ['class'],
	theme: {
		extend: {
			colors: {
				// Explicit dark theme colors
				background: '#0a0a0a',
				foreground: '#ffffff',
				card: '#1a1a1a',
				border: '#2a2a2a',
				muted: '#888888',
				// Explicit orange colors
				orange: {
					50: '#fff7ed',
					100: '#ffedd5',
					200: '#fed7aa',
					300: '#fdba74',
					400: '#fb923c',
					500: '#f97316',
					600: '#ea580c',
					700: '#c2410c',
					800: '#9a3412',
					900: '#7c2d12',
					950: '#431407',
				}
			}
		}
	}
};
