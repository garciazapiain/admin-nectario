import Ingredientes from './Ingredientes.vue'

describe('Ingredientes Component', () => {
    beforeEach(() => {
        cy.intercept('GET', '/api/ingredientes/demanda', { fixture: 'ingredientes.json' }).as('getIngredientes');
        cy.mount(Ingredientes);
        // Wait for the intercepted API call to complete
        cy.wait('@getIngredientes');
    });

    it('renders the Ingredientes component', () => {
        cy.get('h1').should('contain', 'Insumos');
        cy.get('[data-test-id="search-input"]').type('TOMATE');
        cy.get('table tbody tr').each(($el) => {
            cy.wrap($el).should('contain', 'TOMATE'); // replace 'test' with the same ingredient name
          });
    });
});