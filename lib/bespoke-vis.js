const vis = require('vis');
const fileSystem = require('fs');
let visualizationsAndMetadata = [];

const registerVisualization = function(
  type,
  el,
  visualization,
  deck,
  slideIndex
) {
  visualizationsAndMetadata.push({
    type,
    el,
    slideIndex,
    vis: visualization
  });

  deck.on('activate', e => {
    const currentSlideIndex = e.index;
    const visualizationsOnCurrentSlide = visualizationsAndMetadata.filter(
      vm => vm.slideIndex === currentSlideIndex
    );

    visualizationsOnCurrentSlide.forEach(vm =>
      setTimeout(
        () =>
          vm.vis.fit({
            animation: {
              duration: 2000,
              easingFunction: 'easeOutQuad'
            }
          }),
        200
      )
    );
  });
};

const renderVisElement = function(type, content, targetEl) {
  const supportedTypes = ['timeline', 'network', 'lines', 'bars'];

  try {
    if (supportedTypes.indexOf(type.toLowerCase()) === -1) {
      throw new Error(
        'A non-supported type of visualization was asked from bespoke-vis: ' +
          type
      );
    }

    content = JSON.parse(content);

    const items = content.items || [],
      groups =
        content.groups || [],
      options = content.options || {};

    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
    const element = new vis[capitalizedType](targetEl);

    element.setOptions(options);
    if (Array.isArray(groups) && groups.length > 0) {
      element.setGroups(groups);
    }
    element.setItems(items);

    return new Promise(resolve => {
      resolve({ type, el: targetEl, vis: element });
    });
  } catch (err) {
    console.log(
      'Visjs error trying to parse: "' + content + '". Description: ',
      err
    );

    return Promise.reject(err);
  }
};

module.exports = function() {
  return function(deck) {
    const visElements = deck.parent.querySelectorAll('[data-vis]');
    if (visElements.length > 0) {
      require('vis/dist/vis.min.css');
    }

    Array.from(visElements).forEach(el => {
      const slideIndex = deck.slides.indexOf(el.closest('.bespoke-slide'));
      const type = el.dataset.vis;
      let contentReady = Promise.resolve(el.innerHTML);
      const elStyle = getComputedStyle(el);

      el.style.minWidth = elStyle.width;
      el.style.minHeight = elStyle.height;
      el.innerHTML = '';

      if (el.dataset.visUrl) {
        contentReady = fetch(el.dataset.visUrl).then(r => r.text());
      }

      contentReady
        .then(content => renderVisElement(type, content, el))
        .then(({ type, el, vis }) =>
          registerVisualization(type, el, vis, deck, slideIndex)
        );
    });
  };
};
