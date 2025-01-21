import Platillos from './Platillos.vue'

describe('Platillos Component', () => {
    beforeEach(() => {
        cy.intercept('GET', '/api/platillos', { fixture: 'platillos.json' }).as('getPlatillos');
        cy.mount(Platillos);
        // Wait for the intercepted API call to complete
        cy.wait('@getPlatillos');
    });

    it('renders the Platillos component', () => {
        cy.get('h1').should('contain', 'Platillos');
        cy.get('input[placeholder="Buscar"]').should('exist');
        cy.get('table').should('exist');
        cy.get('form').should('exist');
    });

    it('filters platillos based on search input', () => {
        // Type a search term into the search input field
        cy.get('input[placeholder="Buscar"]').type('CHILAQUILES');

        // Check that each table row contains the search term
        cy.get('tbody tr').each(($row) => {
            cy.wrap($row).should('contain', 'CHILAQUILES');
        });
    });
});