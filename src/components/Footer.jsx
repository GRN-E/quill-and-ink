import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Github, Mail } from 'lucide-react';
import Logo from './Logo';
import { useLang } from '../i18n';

const SOCIALS = [
  { href: 'https://twitter.com', label: 'Twitter', Icon: Twitter },
  { href: 'https://instagram.com', label: 'Instagram', Icon: Instagram },
  { href: 'https://github.com', label: 'GitHub', Icon: Github },
  { href: 'mailto:hello@inkly.tech', label: 'Email', Icon: Mail },
];

function SocialIcon(props) {
  const external = props.href.startsWith('http');
  const Icon = props.Icon;
  return React.createElement(
    'a',
    {
      href: props.href,
      'aria-label': props.label,
      target: external ? '_blank' : undefined,
      rel: external ? 'noopener noreferrer' : undefined,
      className:
        'w-9 h-9 inline-flex items-center justify-center rounded-md text-ink-500 hover:text-ink-950 hover:bg-white hover:shadow-subtle transition-base',
    },
    React.createElement(Icon, { size: 16 })
  );
}

function LinkColumn(props) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-ink-950 uppercase tracking-wider mb-4">
        {props.title}
      </h3>
      <ul className="space-y-3">
        {props.links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="text-sm text-ink-600 hover:text-ink-950 transition-base"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();

  const productLinks = [
    { to: '/', label: t('nav_home') },
    { to: '/pricing', label: t('nav_pricing') },
    { to: '/about', label: t('nav_about') },
  ];
  const legalLinks = [
    { to: '/privacy', label: t('auth_privacy_link') },
    { to: '/terms', label: t('auth_terms_link') },
    { to: '/contact', label: t('about_contact_title') },
  ];
  const resourceLinks = [
    { to: '/docs', label: 'Docs' },
    { to: '/examples', label: 'Examples' },
    { to: '/changelog', label: 'Changelog' },
  ];

  return (
    <footer className="bg-ink-50 border-t border-ink-200 mt-24">
      <div className="container-prose py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
          <div className="col-span-2 max-w-sm">
            <Logo size="md" />
            <p className="mt-4 text-sm text-ink-600 leading-relaxed">
              {t('footer_tagline')}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIALS.map((social) => (
                <SocialIcon
                  key={social.label}
                  href={social.href}
                  label={social.label}
                  Icon={social.Icon}
                />
              ))}
            </div>
          </div>

          <LinkColumn title={t('footer_product')} links={productLinks} />
          <LinkColumn title={t('footer_resources')} links={resourceLinks} />
          <LinkColumn title={t('footer_legal')} links={legalLinks} />
        </div>

        <div className="mt-12 pt-8 border-t border-ink-200 flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center justify-between">
          <p className="text-xs text-ink-500">
            © {year} {t('footer_copyright')}
          </p>
          <p className="text-xs text-ink-500">{t('footer_motto')}</p>
        </div>
      </div>
    </footer>
  );
}
