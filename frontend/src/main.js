import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue'
import Home from './components/Home.vue';
import Login from './components/Auth/Login.vue';
import Register from './components/Auth/Register.vue';
import Platillos from './components/Platillos/Platillos.vue';
import Platillo from './components/Platillos/Platillo.vue';
import Subplatillos from './components/Subplatillos/Subplatillos.vue';
import Subplatillo from './components/Subplatillos/Subplatillo.vue';
import Ingredientes from './components/Ingredientes/Ingredientes.vue';
import Ingrediente from './components/Ingredientes/Ingrediente.vue';
import Inventarios from './components/Inventarios/Home.vue';
import TomaInventario from './components/Inventarios/TomaInventario.vue';
import Compra from './components/Compra/Compra.vue';
import './style.css'

const routes = [
    { path: '/', component: Home },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/platillos', component: Platillos },
    { path: '/platillo/:id', component: Platillo },
    { path: '/subplatillos', component: Subplatillos },
    { path: '/subplatillo/:id', component: Subplatillo },
    { path: '/ingredientes', component: Ingredientes },
    { path: '/ingrediente/:id', component: Ingrediente },
    { path: '/inventarios', component: Inventarios },
    { path: '/inventarios/:store', component: TomaInventario, props: true},
    { path: '/compra', component: Compra }
  ];
  
  const router = createRouter({
    history: createWebHistory(),
    routes,
  });
  
  const app = createApp(App);
  
  app.use(router);
  
  app.mount('#app');