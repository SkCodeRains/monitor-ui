import { Directive, ElementRef, Renderer2, OnInit, OnDestroy, inject } from '@angular/core';

/**
 * TeleportToBodyDirective
 * 
 * Injects / moves the host element directly into `document.body` upon creation.
 * This completely breaks out of any parent container with `transform`, `filter`,
 * `contain`, or `overflow`, ensuring overlays & modals are fixed strictly relative
 * to the visible browser viewport (100vw x 100vh) rather than page height.
 * 
 * Automatically cleans up the element from `document.body` when destroyed.
 */
@Directive({
  selector: '[appTeleportToBody]',
  standalone: true
})
export class TeleportToBodyDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  ngOnInit(): void {
    if (typeof document !== 'undefined' && document.body) {
      this.renderer.appendChild(document.body, this.el.nativeElement);
    }
  }

  ngOnDestroy(): void {
    const nativeEl = this.el.nativeElement;
    if (nativeEl && nativeEl.parentNode) {
      this.renderer.removeChild(nativeEl.parentNode, nativeEl);
    }
  }
}

