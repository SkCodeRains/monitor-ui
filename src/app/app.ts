import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxUiLoaderModule } from 'ngx-ui-loader';
import { ToastComponent } from '@shared/ui/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, NgxUiLoaderModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}


