import TomaInventario from './TomaInventario.vue'

describe('<TomaInventario />', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/ingredientes', { fixture: 'ingredientes.json' }).as('getIngredientes');
    cy.intercept('GET', '/api/submissions', { fixture: 'submissions.json' }).as('getSubmissions');
    cy.intercept('GET', '/api/proveedores', { fixture: 'proveedores.json' }).as('getProveedores');

    cy.mount(TomaInventario, {
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
    cy.get('h1').should('contain', 'Toma Inventario')
  })

  it('filters ingredients based on search term', () => {
    cy.get('.search-bar').type('ATUN')
    cy.get('tbody tr').each(($el) => {
      cy.wrap($el).find('td:first').should('contain', 'ATUN')
    })
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

  it('submits the inventory form', () => {
    cy.intercept('POST', '/api/submissions').as('submitForm')
    cy.get('.button-actualizar').click()
    cy.wait('@submitForm').its('response.statusCode').should('eq', 200)
    cy.get('.success-message').should('be.visible').and('contain', 'Actualización exitosa')
  })
})
