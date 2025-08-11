import Showdown from 'showdown';

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const currentYear = new Date().getFullYear();
  const dateYear = date.getFullYear();

  // If same year as current year, show month and day only
  if (dateYear === currentYear) {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  }

  // If different year, show full date
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const classNames = (...classes: string[]): string => {
  return classes.filter(Boolean).join(' ');
};

const converter = new Showdown.Converter({
  underline: true,
  tables: true,
  ghCodeBlocks: false,
  smoothLivePreview: true,
  disableForced4SpacesIndentedSublists: true
});

export const unescapeHtml = (text: string) => {
  if (!text) return '';

  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

export const MdToHtml = (text: string): string => {
  const trimmed = text.trim();
  let html = (converter.makeHtml(trimmed))
    .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, '<p>$1</p>')
    .replace(/<pre>|<\/pre>|<code>|<\/code>/g, '');

  html = unescapeHtml(html);
  return html;
}
