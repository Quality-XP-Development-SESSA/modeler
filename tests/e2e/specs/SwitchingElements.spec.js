import {
  assertDownloadedXmlContainsExpected,
  assertDownloadedXmlDoesNotContainExpected,
  connectNodesWithFlow,
  dragFromSourceToDest,
  getElementAtPosition,
  getLinksConnectedToElement, modalConfirm, waitToRenderAllShapes,
} from '../support/utils';
import {nodeTypes} from '../support/constants';

function addFlowExpression(flowExpression, gatewayPosition) {
  getElementAtPosition(gatewayPosition)
    .then(getLinksConnectedToElement)
    .then($links => $links[0])
    .click({ force: true });

  cy.contains('Expression')
    .next('input')
    .clear()
    .type(flowExpression);
}

function changeGatewayTypeTo(newType, gatewayPosition) {
  getElementAtPosition(gatewayPosition).click();

  cy.get('[data-test=select-type-dropdown]').click();
  cy.get(`[data-test=switch-to-${newType}]`).click();
  modalConfirm();
}

describe('Switching elements', () => {
  it('Switching a exclusive gateway to a parallel gateway should remove conditions from flows', () => {
    const gatewayPosition = {x: 300, y: 150};
    const taskPosition = {x: 450, y: 150};
    dragFromSourceToDest(nodeTypes.exclusiveGateway, gatewayPosition);
    dragFromSourceToDest(nodeTypes.task, taskPosition);
    connectNodesWithFlow('sequence-flow-button', gatewayPosition, taskPosition);

    const flowExpression = '1234 == 1234';

    addFlowExpression(flowExpression, gatewayPosition);
    changeGatewayTypeTo('parallel-gateway', gatewayPosition);

    assertDownloadedXmlDoesNotContainExpected(flowExpression);
  });

  it('add a single undo state when replacing a node in place', () => {
    const startEventPosition = { x: 150, y: 150 };
    const initialStartEvent = '<bpmn:startEvent id="node_1" name="Start Event" />';
    const replacementStartEvent = '<bpmn:startEvent id="node_2" name="Message Start Event">';
    assertDownloadedXmlContainsExpected(initialStartEvent);

    getElementAtPosition(startEventPosition).click();
    cy.get('[data-test=select-type-dropdown]').click();
    cy.get('[data-test=switch-to-message-start-event]').click();
    modalConfirm();
    // if we see two nodes here the replacement failed completely
    assertDownloadedXmlContainsExpected(replacementStartEvent);
    assertDownloadedXmlDoesNotContainExpected(initialStartEvent);

    cy.get('[data-test=undo]').click();
    waitToRenderAllShapes();
    // if we see two nodes here then we had an intermediate invalid undo state saved
    assertDownloadedXmlContainsExpected(initialStartEvent);
    assertDownloadedXmlDoesNotContainExpected(replacementStartEvent);
  });
});
