const root = document.documentElement;
const themeButton = document.querySelector('.theme-toggle');
const themeColor = document.querySelector('meta[name="theme-color"]');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');

function getTheme() {
  return root.dataset.theme || (systemTheme.matches ? 'dark' : 'light');
}

function renderTheme(theme) {
  themeColor.content = theme === 'light' ? '#e9eddf' : '#101917';
  themeButton.setAttribute('aria-pressed', String(theme === 'light'));
  themeButton.setAttribute('aria-label', theme === 'light' ? 'Light theme enabled. Switch to dark theme' : 'Dark theme enabled. Switch to light theme');
  themeButton.title = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
}

function setTheme(theme, persist) {
  root.dataset.theme = theme;
  renderTheme(theme);
  if (persist) {
    try {
      localStorage.setItem('portfolio-theme', theme);
    } catch (_) {}
  }
}

if (themeButton) {
  renderTheme(getTheme());
  themeButton.addEventListener('click', () => setTheme(getTheme() === 'light' ? 'dark' : 'light', true));
  systemTheme.addEventListener('change', () => {
    try {
      if (!localStorage.getItem('portfolio-theme')) renderTheme(getTheme());
    } catch (_) {
      renderTheme(getTheme());
    }
  });
}

const speechKitExamples = [
  ['Live dictation in your note', 'Start with the smallest useful version. We can learn from it, then make the next decision.', 'Streaming words appear, revise in place, and land as Markdown at your cursor.', 'en'],
  ['Translate, then decide what to keep', 'Empieza con la versión útil más pequeña. Podemos aprender de ella y tomar la siguiente decisión.', 'Preview the translation before replacing, inserting, or copying it.', 'es'],
  ['Listen back without leaving the editor', 'Start with the smallest useful version. We can learn from it, then make the next decision.', 'Choose a local voice and playback speed for any note.', 'en'],
];

document.querySelectorAll('.demo').forEach((demo) => {
  const buttons = [...demo.querySelectorAll('[data-step]')];
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      const [title, text, result, lang] = speechKitExamples[index];
      buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      demo.querySelector('h4').textContent = title;
      demo.querySelector('.sample').textContent = text;
      demo.querySelector('.sample').lang = lang;
      demo.querySelector('.result').textContent = result;
    });
  });
  if (matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) {
    demo.addEventListener('pointermove', (event) => {
      const bounds = demo.getBoundingClientRect();
      demo.style.setProperty('--x', `${event.clientX - bounds.left}px`);
      demo.style.setProperty('--y', `${event.clientY - bounds.top}px`);
    });
  }
});
