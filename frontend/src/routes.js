import Home from './views/Home.vue';
import Login from './views/Auth/Login.vue';
import Register from './views/Auth/Register.vue';
import Platillos from './views/Platillos/Platillos.vue';
import Platillo from './views/Platillos/Platillo.vue';
import Subplatillos from './views/Subplatillos/Subplatillos.vue';
import Subplatillo from './views/Subplatillos/Subplatillo.vue';
import Ingredientes from './views/Ingredientes/Ingredientes.vue';
import Ingrediente from './views/Ingredientes/Ingrediente.vue';
import ListaPeligroHome from './views/ListaPeligro/Home.vue';
import ListaPeligro from './views/ListaPeligro/ListaPeligro.vue';
import ResumenExistencias from './views/Existencias/ResumenExistencias.vue';
import ConsumoInsumos from './views/ConsumoInsumos/ConsumoInsumos.vue';
import CargarVenta from './views/ConsumoInsumos/CargarVentas.vue';
import PlaneacionCompra from './views/PlaneacionCompra/PlaneacionCompra.vue';
import CompraManejo from './views/CompraManejo/CompraManejo.vue';

export default [
    { path: '/', component: Home },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/platillos', component: Platillos },
    { path: '/platillos/:id', component: Platillo },
    { path: '/subplatillos', component: Subplatillos },
    { path: '/subplatillos/:id', component: Subplatillo },
    { path: '/ingredientes', component: Ingredientes },
    { path: '/ingredientes/:id', component: Ingrediente },
    { path: '/listapeligro', component: ListaPeligroHome },
    { path: '/listapeligro/:store', component: ListaPeligro, props: true },
    { path: '/existenciasresumen', component: ResumenExistencias },
    { path: '/consumoinsumos', component: ConsumoInsumos },
    { path: '/consumoinsumos/cargarventa', component: CargarVenta },
    { path: '/planeacioncompra', component: PlaneacionCompra },
    { path: '/compradeldia', component: CompraManejo }
];