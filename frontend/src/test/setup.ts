import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

// jsdom does not implement `matchMedia`; several components read reduced-motion.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

// jsdom does not implement `scrollIntoView`; FormErrorSummary uses it when a
// summary link reveals its control.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

// jsdom does not implement the native `<dialog>` methods used by ConfirmationDialog.
if (typeof HTMLDialogElement !== 'undefined') {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.open = true
      this.setAttribute('data-test-modal', 'true')
    }
  }

  if (!HTMLDialogElement.prototype.show) {
    HTMLDialogElement.prototype.show = function show(this: HTMLDialogElement) {
      this.open = true
    }
  }

  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement, returnValue?: string) {
      this.open = false
      if (returnValue !== undefined) {
        this.returnValue = returnValue
      }
      this.dispatchEvent(new Event('close'))
    }
  }
}
