const NativeMutationObserver = window.MutationObserver;

// Kofferly v0.3 adds one card to #view itself. Filter mutations that only come
// from that card so the enhancement observer cannot wake itself in a loop.
window.MutationObserver = class KofferlyMutationObserver extends NativeMutationObserver {
  constructor(callback) {
    super(records => {
      const meaningful = records.some(record => {
        const changed = [...record.addedNodes, ...record.removedNodes];
        if (!changed.length) return true;
        return changed.some(node => !(node instanceof Element && node.classList.contains("v03-trip-status-card")));
      });
      if (meaningful) callback(records);
    });
  }
};

await import("./v03.js");
window.MutationObserver = NativeMutationObserver;
