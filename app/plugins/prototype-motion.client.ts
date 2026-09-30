const revealSelector = [
  '.project-card:not(.project-card--skeleton)',
  '.post-card:not(.post-card--skeleton)',
  '.archive-year',
  '.timeline-chapter',
  '.friend-link-card',
  '.message-card',
].join(', ');

export default defineNuxtPlugin((nuxtApp) => {
  let observer: IntersectionObserver | undefined;
  let mutationObserver: MutationObserver | undefined;

  const observeCandidates = () => {
    document.querySelectorAll<HTMLElement>(revealSelector).forEach((element, index) => {
      if (element.classList.contains('is-revealed')) return;

      element.style.setProperty('--reveal-delay', `${Math.min(index * 55, 220)}ms`);
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
