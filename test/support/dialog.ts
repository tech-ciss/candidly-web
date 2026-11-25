import { beforeAll } from 'vitest';
// jsdom has the dialog element but no top-layer methods. This shim only exposes
// open/close visibility; native inert/focus/Escape are checked in the browser.
beforeAll(() => {
  if (!HTMLDialogElement.prototype.showModal)
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.setAttribute('open', '');
      },
    });
  if (!HTMLDialogElement.prototype.close)
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
      },
    });
});
