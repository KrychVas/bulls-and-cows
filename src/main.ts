import { mountApp } from './app/controller.js';

const root = document.createElement('div');
root.id = 'app';
document.body.append(root);
mountApp(root);
