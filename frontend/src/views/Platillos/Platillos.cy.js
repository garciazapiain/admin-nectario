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
        cy.get('table').should('exist');
        cy.get('form').should('exist');
    });

    it('filters platillos based on search input', () => {
        cy.get('[data-test-id="search-input"]').type('CHILAQUILES'); // replace 'test' with an actual ingredient name
        cy.get('table tbody tr').each(($el) => {
            cy.wrap($el).should('contain', 'CHILAQUILES'); // replace 'test' with the same ingredient name
        });
    });
});