import { Routes } from '@angular/router';

import { Sidebar } from './components/Software/sidebar/sidebar';
import { LoginPage } from './components/Login/login-page/login-page';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    component: LoginPage
  },

  {
    path: 'dashboard',
    component: Sidebar
  }

];