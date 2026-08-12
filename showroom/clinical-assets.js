(function () {
  function chooseScanMode({ webgl, saveData, deviceMemory, mobile }) {
    if (!webgl || saveData) return 'fallback';
    if (mobile && Number(deviceMemory || 0) < 4) return 'fallback';
    return 'full';
  }

  window.AvrasyaClinicalAssets = Object.freeze({
    fullScan: Object.freeze({
      upper: '/assets/digital-clinic/scan-upper.ply',
      lower: '/assets/digital-clinic/scan-lower.ply'
    }),
    fallbackScan: Object.freeze({ packedBase: '/assets/ply/' }),
    smileExample: Object.freeze({
      before: '/assets/digital-clinic/example-before.jpg',
      after: '/assets/digital-clinic/example-after.jpg'
    }),
    chooseScanMode
  });
})();
