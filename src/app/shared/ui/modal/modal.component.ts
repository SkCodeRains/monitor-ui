import {
  Component,
  input,
  output,
  OnInit,
  OnDestroy,
  HostListener,
  inject,
  Renderer2
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeleportToBodyDirective } from '@core/directives/teleport-to-body.directive';

/**
 * Reusable Responsive Modal Component
 * 
 * - Teleports directly to document.body via TeleportToBodyDirective.
 * - Always centered in the visible viewport (100dvh x 100vw), immune to page height or scroll depth.
 * - Automatically locks body scroll when open and restores it when closed.
 * - Supports custom content via <ng-content>.
 * - Backdrop click to close and Escape key to close.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, TeleportToBodyDirective],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss'
})
export class ModalComponent implements OnInit, OnDestroy {
  private readonly renderer = inject(Renderer2);

  // Inputs
  readonly maxWidth = input<string>('440px');
  readonly variant = input<'default' | 'danger'>('default');
  readonly closeOnBackdrop = input<boolean>(true);
  readonly closeOnEscape = input<boolean>(true);

  // Outputs
  readonly closeModal = output<void>();

  private previousBodyOverflow: string = '';

  ngOnInit(): void {
    if (typeof document !== 'undefined' && document.body) {
      this.previousBodyOverflow = document.body.style.overflow;
      this.renderer.setStyle(document.body, 'overflow', 'hidden');
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined' && document.body) {
      if (this.previousBodyOverflow) {
        this.renderer.setStyle(document.body, 'overflow', this.previousBodyOverflow);
      } else {
        this.renderer.removeStyle(document.body, 'overflow');
      }
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    if (this.closeOnEscape()) {
      event.preventDefault();
      this.closeModal.emit();
    }
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop()) {
      this.closeModal.emit();
    }
  }

  onCardClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}
