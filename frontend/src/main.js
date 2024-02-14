import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue'
import Home from './components/Home.vue';
import Platillos from './components/Platillos/Platillos.vue';
import Platillo from './components/Platillos/Platillo.vue';
import Subplatillos from './components/Subplatillos/Subplatillos.vue';
import Subplatillo from './components/Subplatillos/Subplatillo.vue';
import Ingredientes from './components/Ingredientes/Ingredientes.vue';
import Ingrediente from './components/Ingredientes/Ingrediente.vue';
import Inventarios from './components/Inventarios/Home.vue';
import InventarioMoral from './components/Inventarios/Moral.vue';
import InventarioBosques from './components/Inventarios/Bosques.vue';
import Compra from './components/Compra/Compra.vue';
import './style.css'

const routes = [
    { path: '/', component: Home },
    { path: '/platillos', component: Platillos },
    { path: '/platillo/:id', component: Platillo },
    { path: '/subplatillos', component: Subplatillos },
    { path: '/subplatillo/:id', component: Subplatillo },
    { path: '/ingredientes', component: Ingredientes },
    { path: '/ingrediente/:id', component: Ingrediente },
    { path: '/inventarios', component: Inventarios },
    { path: '/inventarios/moral', component: InventarioMoral },
    { path: '/inventarios/bosques', component: InventarioBosques },
    { path: '/compra', component: Compra }
  ];
  
  const router = createRouter({
    history: createWebHistory(),
    routes,
  });
  
  const app = createApp(App);
  
  app.use(router);
  
  app.mount('#app');