import { HttpInterceptorFn, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

export const API_BASE_URL = 'http://localhost:3000';

export const credentialsInterceptor: HttpInterceptorFn = (request, next) => {
  return next(request.clone({ withCredentials: true }));
};

export const apiHttpProviders = [
  provideHttpClient(withFetch(), withInterceptors([credentialsInterceptor])),
];
