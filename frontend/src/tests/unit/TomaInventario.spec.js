import { mount } from '@vue/test-utils';
import TomaInventario from '../../components/Inventarios/TomaInventario.vue';

// Mock the fetch operation
global.fetch = jest.fn(url => {
    if (url === 'first_request_url') {
        return Promise.resolve({
            status: 200,
            json: () => Promise.resolve([
                {
                    "id_ingrediente": 136,
                    "nombre": "CATSUP",
                    "unidad": "KG",
                    "precio": "12.5",
                    "proveedor": "COSTCO",
                    "proveedor_id": 3,
                    "producto_clave": null,
                    "estatus_moral": "Suficiente producto",
                    "store_route_order": null,
                    "moral_demanda_semanal": null,
                    "bosques_demanda_semanal": null,
                    "orden_inventario": null,
                    "estatus_bosques": "Suficiente producto",
                    "temporal_proveedor_id": null,
                    "frecuencias_inventario": [null]
                },
                {
                    "id_ingrediente": 135,
                    "nombre": "CANELA MOLIDA",
                    "unidad": "KG",
                    "precio": "1589.29",
                    "proveedor": "HEB",
                    "proveedor_id": 2,
                    "producto_clave": null,
                    "estatus_moral": "Suficiente producto",
                    "store_route_order": null,
                    "moral_demanda_semanal": null,
                    "bosques_demanda_semanal": null,
                    "orden_inventario": null,
                    "estatus_bosques": "Suficiente producto",
                    "temporal_proveedor_id": null,
                    "frecuencias_inventario": [null]
                }
            ]),
        });
    } else if (url === 'second_request_url') {
        return Promise.resolve({
            status: 200,
            json: () => Promise.resolve([
                {
                    "id": 174,
                    "store": "moral",
                    "timestamp": "May 11 2024, 13:40",
                    "compra": [
                        {
                            "id_ingrediente": 135,
                            "nombre": "CANELA MOLIDA",
                            "unidad": "KG",
                            "cantidad_inventario": 0,
                            "proveedor": "HEB",
                            "moral_demanda_semanal": null,
                            "bosques_demanda_semanal": null
                        },
                        {
                            "id_ingrediente": 136,
                            "nombre": "CATSUP",
                            "unidad": "KG",
                            "cantidad_inventario": 0,
                            "proveedor": "COSTCO",
                            "moral_demanda_semanal": null,
                            "bosques_demanda_semanal": null
                        }
                    ]
                }
            ]),
        });
    } else if (url === 'third_request_url') {
        return Promise.resolve({
            status: 200,
            json: () => Promise.resolve([
                {
                    "id": 1,
                    "nombre": "FRUTEX"
                },
                {
                    "id": 2,
                    "nombre": "HEB"
                },
                {
                    "id": 3,
                    "nombre": "COSTCO"
                }
            ]),
        });
    }
});

describe('TomaInventario', () => {
    // Test 1: Component renders correctly
    // it('renders correctly', () => {
    //     const wrapper = mount(TomaInventario);
    //     expect(wrapper.exists()).toBe(true);
    // });

    // Test 2: Increment quantity when '+' button is clicked
    it('increments quantity when "+" button is clicked', async () => {
        const wrapper = mount(TomaInventario);

        // Wait for any promises to resolve
        await wrapper.vm.$nextTick();

        console.log(wrapper.html())
        const increaseButton = wrapper.find('.button-increase');

        await increaseButton.trigger('click');

        expect(wrapper.vm.$data.quantity).toBe(1);
    });

    // Test 3: Search functionality filters ingredients correctly
    // it('search functionality filters ingredients correctly', async () => {
    //     const wrapper = mount(TomaInventario);
    //     const searchInput = wrapper.find('.search-bar');

    //     await searchInput.setValue('Ingredient');

    //     expect(wrapper.vm.$data.filteredIngredients).toHaveLength(1);
    //     expect(wrapper.vm.$data.filteredIngredients[0].nombre).toBe('Ingredient A');
    // });
});