// src/components/map/InfoWindows/templates.ts
import { InfoWindowButton, InfoWindowTemplates } from './types';

export const createTemplates = (): InfoWindowTemplates => ({
  standard: (title: string, subtitle?: string, buttons?: InfoWindowButton[]) => `
    <div class="p-4 bg-white rounded-lg shadow">
      <h3 class="font-semibold text-gray-900">${title}</h3>
      ${subtitle ? `<p class="text-sm text-gray-600 my-2">${subtitle}</p>` : ''}
      ${buttons ? createButtons(buttons) : ''}
    </div>
  `,
  
  loading: (title: string, subtitle?: string) => `
    <div class="p-4 bg-white rounded-lg shadow">
      <h3 class="font-semibold text-gray-900">${title}</h3>
      ${subtitle ? `<p class="text-sm text-gray-600 my-2">${subtitle}</p>` : ''}
      <p class="text-sm text-gray-600">Loading...</p>
    </div>
  `,
  
  error: (title: string, error: string) => `
    <div class="p-4 bg-white rounded-lg shadow">
      <h3 class="font-semibold text-gray-900">${title}</h3>
      <p class="text-red-500">${error}</p>
    </div>
  `,
  
  success: (title: string, message: string) => `
    <div class="p-4 bg-white rounded-lg shadow">
      <h3 class="font-semibold text-gray-900">${title}</h3>
      <p class="text-green-600 mt-2">✓ ${message}</p>
    </div>
  `,
  
  manualLocation: (title: string, subtitle: string, address?: string) => `
    <div class="p-4 bg-white rounded-lg shadow">
      <h3 class="font-semibold text-gray-900">${title}</h3>
      <p class="text-sm text-gray-600 my-2">${subtitle}</p>
      ${address ? `
        <div class="mt-2">
          <p class="text-sm text-gray-900">Selected location:</p>
          <p class="text-sm text-gray-600">${address}</p>
        </div>
      ` : ''}
      ${!address ? `<p class="text-sm text-blue-600">Click on the map to set venue location</p>` : ''}
      <div class="mt-4 flex gap-2">
        ${address ? `
          <button id="save-location" class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
            Save Location
          </button>
          <button id="try-again" class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
            Try Again
          </button>
        ` : `
          <button id="cancel-selection" class="mt-2 px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
            Cancel
          </button>
        `}
      </div>
    </div>
  `
});

const createButtons = (buttons: InfoWindowButton[]) => `
  <div class="mt-4 flex gap-2">
    ${buttons.map(button => `
      <button 
        id="${button.id}" 
        class="${getButtonStyles(button.variant)}"
      >
        ${button.text}
      </button>
    `).join('')}
  </div>
`;

const getButtonStyles = (variant: 'primary' | 'secondary' | 'danger') => {
  const baseStyles = 'px-3 py-1 rounded transition-colors';
  switch (variant) {
    case 'primary':
      return `${baseStyles} bg-green-500 text-white hover:bg-green-600`;
    case 'secondary':
      return `${baseStyles} border border-gray-300 hover:bg-gray-50`;
    case 'danger':
      return `${baseStyles} bg-red-500 text-white hover:bg-red-600`;
  }
};