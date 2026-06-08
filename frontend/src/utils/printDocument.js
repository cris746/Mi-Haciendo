export const cleanupPrint = () => {
  document.body.classList.remove('print-document-mode');
  const root = document.getElementById('global-print-root');
  if (root) root.innerHTML = '';
};

export const triggerPrint = (beforePrint, options = {}) => {
  const {
    selector = '.print-document',
    delay = 300,
  } = options;

  if (typeof beforePrint === 'function') {
    beforePrint();
  }

  setTimeout(() => {
    const source = document.querySelector(selector);

    let root = document.getElementById('global-print-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'global-print-root';
      document.body.appendChild(root);
    }

    root.innerHTML = '';

    if (source) {
      root.innerHTML = source.outerHTML;
    } else {
      root.innerHTML = '<div class="print-fallback-error">No se encontró el documento para imprimir.</div>';
      console.warn('No se encontró documento imprimible:', selector);
    }

    document.body.classList.add('print-document-mode');

    setTimeout(() => {
      window.print();
    }, 100);
  }, delay);
};
