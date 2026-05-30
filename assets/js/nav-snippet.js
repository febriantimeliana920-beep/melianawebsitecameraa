/** Opsional: set active nav dari data-page pada body */
document.querySelectorAll('.nav-link[data-page]').forEach((a) => {
  if (a.dataset.page === document.body.dataset.page) a.classList.add('active');
});
