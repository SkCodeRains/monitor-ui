import { TestBed } from '@angular/core/testing';
import { LoaderService } from './loader.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';

describe('LoaderService', () => {
  let service: LoaderService;
  let ngxLoader: NgxUiLoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoaderService, NgxUiLoaderService]
    });

    service = TestBed.inject(LoaderService);
    ngxLoader = TestBed.inject(NgxUiLoaderService);
  });

  afterEach(() => {
    service.reset();
  });

  it('should initialize with 0 active requests and isLoading = false', () => {
    expect(service.activeRequests()).toBe(0);
    expect(service.isLoading()).toBe(false);
  });

  it('should increase activeRequests and set isLoading = true on show()', () => {
    service.show('Loading data...');
    expect(service.activeRequests()).toBe(1);
    expect(service.isLoading()).toBe(true);
    expect(service.message()).toBe('Loading data...');
  });

  it('should decrement activeRequests and set isLoading = false on hide()', () => {
    service.show();
    expect(service.activeRequests()).toBe(1);
    service.hide();
    expect(service.activeRequests()).toBe(0);
    expect(service.isLoading()).toBe(false);
  });

  it('should not decrement below 0 on multiple hide() calls', () => {
    service.hide();
    service.hide();
    expect(service.activeRequests()).toBe(0);
    expect(service.isLoading()).toBe(false);
  });

  it('should track named tasks and avoid duplicate counting for identical taskId', () => {
    service.startTask('task-1', 'Processing...');
    expect(service.activeRequests()).toBe(1);
    expect(service.message()).toBe('Processing...');

    // Starting the same task again should not increase count
    service.startTask('task-1');
    expect(service.activeRequests()).toBe(1);

    // Starting a distinct task
    service.startTask('task-2');
    expect(service.activeRequests()).toBe(2);

    // Stopping task-1
    service.stopTask('task-1');
    expect(service.activeRequests()).toBe(1);
    expect(service.isLoading()).toBe(true);

    // Stopping task-2
    service.stopTask('task-2');
    expect(service.activeRequests()).toBe(0);
    expect(service.isLoading()).toBe(false);

    // Stopping task-2 again should be a no-op
    service.stopTask('task-2');
    expect(service.activeRequests()).toBe(0);
  });

  it('should fully reset state on reset()', () => {
    service.startTask('task-a');
    service.startTask('task-b');
    expect(service.activeRequests()).toBe(2);

    service.reset();
    expect(service.activeRequests()).toBe(0);
    expect(service.isLoading()).toBe(false);
  });
});
