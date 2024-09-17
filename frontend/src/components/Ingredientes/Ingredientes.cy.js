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
        cy.get('input[placeholder="Search"]').should('exist');
        cy.get('select').should('exist');
        cy.get('table').should('exist');
    });
});