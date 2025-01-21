import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import routes from './routes.js';
import './style.css';

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Navigation Guard for Authorization
router.beforeEach((to, from, next) => {
    const isAuthenticated = !!localStorage.getItem("jwt"); // Check if the JWT exists
    const publicPaths = ["/login", "/register"]; // Paths accessible without authentication

    // Redirect unauthorized users trying to access private paths
    if (!publicPaths.includes(to.path) && !isAuthenticated) {
        next("/login");
    } else {
        next(); // Allow navigation
    }
});

const app = createApp(App);

app.use(router);

app.mount('#app');
