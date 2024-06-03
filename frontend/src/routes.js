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
import ResumenExistencias from './components/Existencias/ResumenExistencias.vue';
import Compra from './components/Compra/Compra.vue';
import PronosticoDemandaInsumos from './components/PronosticoDemandaInsumos/PronosticoDemandaInsumos.vue';
import HistorialCompra from './components/HistorialCompra/HistorialCompra.vue';
import InsumosHistorial from './components/HistorialCompra/InsumosHistorial.vue';
import InsumoAnalisis from './components/HistorialCompra/InsumoAnalisis.vue';
import CompraAnalisis from './components/HistorialCompra/CompraAnalisis.vue';
import ConsumoInsumos from './components/ConsumoInsumos/ConsumoInsumos.vue';
import CargarVenta from './components/ConsumoInsumos/CargarVentas.vue';

export default [
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
    { path: '/existenciasresumen', component: ResumenExistencias},
    { path: '/compra', component: Compra },
    { path: '/pronosticodemandainsumos', component: PronosticoDemandaInsumos },
    { path: '/historialcompra', component: HistorialCompra   },
    { path: '/historialcompra/insumos', component: InsumosHistorial   },
    { path: '/historialcompra/insumos/:id', component: InsumoAnalisis   },
    { path: '/historialcompra/compra/:id', component: CompraAnalisis   },
    { path: '/consumoinsumos', component: ConsumoInsumos   },
    { path: '/consumoinsumos/cargarventa', component: CargarVenta   }
];