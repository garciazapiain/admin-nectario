import ListaPeligro from './ListaPeligro.vue'

describe('<ListaPeligro />', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/ingredientes/producto-clave', { fixture: 'ingredientes.json' }).as('getIngredientes');
    cy.intercept('GET', '/api/submissions/all-submissions', { fixture: 'submissions.json' }).as('getSubmissions');
    cy.intercept('GET', '/api/proveedores', { fixture: 'proveedores.json' }).as('getProveedores');

    cy.mount(ListaPeligro, {
      props: {
        store: 'moral'
      }
    })
    // Wait for the intercepted API calls to complete
    cy.wait('@getIngredientes');
    cy.wait('@getProveedores');
    cy.wait('@getSubmissions')
  })

  it('renders the component', () => {
    cy.get('h1').should('contain', 'Lista Peligro')
  })

  it('filters ingredients based on search term', () => {
    cy.get('[data-test-id="search-input"]').type('ATUN'); // replace 'test' with an actual ingredient name
    cy.get('table tbody tr').each(($el) => {
      cy.wrap($el).should('contain', 'ATUN'); // replace 'test' with the same ingredient name
    });
  })

  it('updates inventory quantity by increasing and decreasing', () => {
    cy.get('tbody tr:first').as('firstRow')
    cy.get('@firstRow').find('.button-agotado').click()
    cy.get('@firstRow').find('input').should('have.value', '0')
    cy.get('@firstRow').find('.button-increase-decrease').eq(1).click()
    cy.get('@firstRow').find('input').should('have.value', '0.5')
    cy.get('@firstRow').find('.button-increase-decrease').eq(0).click()
    cy.get('@firstRow').find('input').should('have.value', '0')
  })
})
