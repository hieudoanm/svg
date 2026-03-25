import {
  LandingContent,
  LandingTemplate,
} from '@svg/templates/LandingTemplate';
import { NextPage } from 'next';

const content: LandingContent = {
  navbar: {
    title: 'ImageFilter',
    buttonText: 'Open App',
    buttonHref: '/app',
  },
  hero: {
    title: 'Enhance Your Photos in Seconds',
    tagline:
      'Apply beautiful filters and effects to your images instantly — all directly in your browser.',
    buttonText: 'Start Editing',
    buttonHref: '/app',
  },
  features: {
    title: 'Features',
    items: [
      {
        id: 'preset-filters',
        emoji: '🎨',
        title: 'Beautiful Preset Filters',
        description:
          'Apply ready-made filters like vintage, grayscale, sepia, and cinematic looks with one click.',
      },
      {
        id: 'adjustments',
        emoji: '⚙️',
        title: 'Fine-Tune Adjustments',
        description:
          'Adjust brightness, contrast, saturation, blur, and more to perfect your image.',
      },
      {
        id: 'real-time-preview',
        emoji: '👁️',
        title: 'Real-Time Preview',
        description:
          'See filter effects instantly as you tweak settings with a fast live preview.',
      },
      {
        id: 'privacy-first',
        emoji: '🔒',
        title: 'Privacy First',
        description:
          'All image processing happens locally in your browser. Your photos never leave your device.',
      },
      {
        id: 'multiple-formats',
        emoji: '🖼️',
        title: 'Multiple Image Formats',
        description:
          'Upload and edit PNG, JPG, and WEBP images with seamless compatibility.',
      },
      {
        id: 'export-images',
        emoji: '💾',
        title: 'Export Your Edits',
        description: 'Download your filtered images instantly in high quality.',
      },
    ],
  },
  cta: {
    title: 'Start Editing Your Photos Now',
    description:
      'Add stunning filters and enhancements instantly — no signup required.',
    buttonText: 'Open Image Filter',
    buttonHref: '/app',
  },
  footer: {
    name: 'ImageFilter',
  },
};

const HomePage: NextPage = () => {
  return <LandingTemplate content={content} />;
};

export default HomePage;
