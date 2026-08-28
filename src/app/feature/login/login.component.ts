import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  email: string = '';
  password: string = '';
  apiKey: string = '';
  readonly showPassword = signal<boolean>(false);
  readonly showApiKey = signal<boolean>(false);
  private returnUrl: string = '/dashboard';

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  quickFill(): void {
    this.email = 'skcoderains@gmail.com';
    this.password = 'admin123';
    this.apiKey = '';
  }

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password || !this.apiKey) return;
    await this.authService.login(
      this.email.trim(),
      this.password.trim(),
      this.apiKey.trim(),
      this.returnUrl
    );
  }
}

