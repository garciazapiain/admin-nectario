import ResumenExistencias from './ResumenExistencias.vue';

describe('<ResumenExistencias />', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/ingredientes/producto-clave', { fixture: 'ingredientes.json' }).as('getIngredientes');
    cy.intercept('GET', '/api/submissions/latest-submissions', { fixture: 'submissions.json' }).as('getSubmissions');

    cy.mount(ResumenExistencias)

    cy.wait('@getIngredientes');
    cy.wait('@getSubmissions')
  })
  it('renders the component', () => {
    cy.get('h1').should('contain', 'Resumen Existencias Lista Peligro');
  });

  it('filters ingredients by search term', () => {
    cy.get('[data-test-id="search-input"]').type('ATUN'); // replace 'test' with an actual ingredient name
    cy.get('table tbody tr').each(($el) => {
      cy.wrap($el).should('contain', 'ATUN'); // replace 'test' with the same ingredient name
    });
  });
})