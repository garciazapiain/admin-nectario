import ResumenExistencias from './ResumenExistencias.vue';

describe('<ResumenExistencias />', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/ingredientes', { fixture: 'ingredientes.json' }).as('getIngredientes');
    cy.intercept('GET', '/api/submissions', { fixture: 'submissions.json' }).as('getSubmissions');

    cy.mount(ResumenExistencias)

    cy.wait('@getIngredientes');
    cy.wait('@getSubmissions')
  })
  it('renders the component', () => {
    cy.get('h1').should('contain', 'Resumen Existencias Lista Peligro');
    cy.get('.search-bar').should('exist');
  });

  it('shows, interacts with, and hides the popup', () => {
    // Show the popup
    cy.get('table tbody tr:first').click();
    cy.get('.popup').should('be.visible');

    // Test the increment button
    cy.get('.popup .controls').find('button').contains('+').click();
    cy.get('.popup input[type="number"]').should(($input) => {
      expect(parseInt($input.val())).to.be.above(1);
    });

    // Test the decrement button
    cy.get('.popup .controls').find('button').contains('-').click();
    cy.get('.popup input[type="number"]').should(($input) => {
      expect(parseInt($input.val())).to.equal(1);
    });

    // Test the input field
    cy.get('.popup input[type="number"]').clear().type('5');
    cy.get('.popup input[type="number"]').should(($input) => {
      expect(parseInt($input.val())).to.equal(5);
    });

    // Hide the popup
    cy.get('.popup').find('button').contains('Cerrar').click();
    cy.get('.popup').should('not.be.exist');
  });

  it('filters ingredients by search term', () => {
    cy.get('.search-bar').type('ATUN'); // replace 'test' with an actual ingredient name
    cy.get('table tbody tr').each(($el) => {
      cy.wrap($el).should('contain', 'ATUN'); // replace 'test' with the same ingredient name
    });
  });
})