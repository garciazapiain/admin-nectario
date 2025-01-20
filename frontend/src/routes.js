import Home from './components/Home.vue';
import Login from './components/Auth/Login.vue';
import Register from './components/Auth/Register.vue';
import Platillos from './components/Platillos/Platillos.vue';
import Platillo from './components/Platillos/Platillo.vue';
import Subplatillos from './components/Subplatillos/Subplatillos.vue';
import Subplatillo from './components/Subplatillos/Subplatillo.vue';
import Ingredientes from './components/Ingredientes/Ingredientes.vue';
import Ingrediente from './components/Ingredientes/Ingrediente.vue';
import ListaPeligroHome from './components/ListaPeligro/Home.vue';
import ListaPeligro from './components/ListaPeligro/ListaPeligro.vue';
import ResumenExistencias from './components/Existencias/ResumenExistencias.vue';
import ConsumoInsumos from './components/ConsumoInsumos/ConsumoInsumos.vue';
import CargarVenta from './components/ConsumoInsumos/CargarVentas.vue';
import PlaneacionCompra from './components/PlaneacionCompra/PlaneacionCompra.vue';
import CompraManejo from './components/CompraManejo/CompraManejo.vue';

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