const revealSelector = [
  '.project-card:not(.project-card--skeleton)',
  '.post-card:not(.post-card--skeleton)',
  '.archive-year',
  '.timeline-chapter',
  '.link-card:not(.link-card--skeleton)',
  '.message-card',
].join(', ');

export default defineNuxtPlugin((nuxtApp) => {
  let observer: IntersectionObserver | undefined;
  let mutationObserver: MutationObserver | undefined;

  const observeCandidates = () => {
    document.querySelectorAll<HTMLElement>(revealSelector).forEach((element) => {
      if (element.classList.contains('is-revealed')) return;

      const siblings = [
        ...document.querySelectorAll<HTMLElement>(`.${element.classList[0]}`),
      ].filter((candidate) => !candidate.classList.contains(`${element.classList[0]}--skeleton`));
      const index = siblings.indexOf(element);
      const delay = element.classList.contains('post-card')
        ? Math.min(index * 35, 140)
        : element.classList.contains('link-card')
          ? (index % 2) * 40
          : Math.min(index * 55, 220);
      element.style.setProperty('--reveal-delay', `${delay}ms`);
      observer?.observe(element);
    });
  };

  const reveal = () => {
    observer?.disconnect();
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-revealed');
          observer?.unobserve(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -12% 0px' },
    );
    observeCandidates();
  };

  nuxtApp.hook('page:finish', () => {
    requestAnimationFrame(reveal);
  });
  onNuxtReady(() => {
    reveal();
    mutationObserver = new MutationObserver(() => requestAnimationFrame(observeCandidates));
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  });
});
