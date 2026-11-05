/**
 * Client-side renderer for the connection graph (full explorer and mini-graphs).
 * Cytoscape is imported dynamically so it only loads on pages that show a graph.
 */
import type { Graph } from '../lib/graph';

export const TYPE_COLORS: Record<string, string> = {
  league: '#f2f5fa',
  conference: '#9aa7bb',
  division: '#6f7d93',
  franchise: '#4d8dff',
  identity: '#7fb2ff',
  city: '#3ccf91',
  venue: '#f0b44c',
  person: '#ff7a8a',
  rivalry: '#e24b4b',
  championship: '#d9b45a',
};

export async function renderGraph(container: HTMLElement, graph: Graph, opts: { focus?: string; layout?: 'cose' | 'concentric' } = {}) {
  const { default: cytoscape } = await import('cytoscape');
  const cy = cytoscape({
    container,
    elements: [
      ...graph.nodes.map((n) => ({ data: { ...n, color: TYPE_COLORS[n.type] ?? '#ccc' } })),
      ...graph.edges.map((e) => ({ data: e })),
    ],
    wheelSensitivity: 0.2,
    minZoom: 0.2,
    maxZoom: 3,
    style: [
      {
        selector: 'node',
        style: {
          'background-color': 'data(color)',
          label: 'data(label)',
          color: '#e7ecf4',
          'font-family': 'Inter, system-ui, sans-serif',
          'font-size': 10,
          'text-valign': 'bottom',
          'text-margin-y': 4,
          'text-outline-color': '#0a0f1a',
          'text-outline-width': 2,
          width: 18,
          height: 18,
        },
      },
      { selector: 'node[type = "franchise"]', style: { width: 26, height: 26, 'font-size': 11, 'font-weight': 'bold' } },
      { selector: 'node[type = "league"]', style: { width: 34, height: 34, shape: 'round-rectangle' } },
      { selector: 'node[?stub]', style: { opacity: 0.45 } },
      { selector: 'node[href]', style: { 'border-width': 1, 'border-color': '#ffffff' } },
      {
        selector: 'edge',
        style: { width: 1.2, 'line-color': '#33415a', 'curve-style': 'bezier', 'target-arrow-shape': 'none' },
      },
      { selector: 'edge[label = "rivalry"]', style: { 'line-color': '#e24b4b', width: 2 } },
      { selector: '.focus', style: { width: 38, height: 38, 'border-width': 3, 'border-color': '#ffffff', 'font-size': 13 } },
      { selector: '.faded', style: { opacity: 0.12 } },
    ],
    layout:
      opts.layout === 'concentric' && opts.focus
        ? { name: 'concentric', concentric: (n: any) => (n.id() === opts.focus ? 10 : 1), levelWidth: () => 1, minNodeSpacing: 28, animate: false }
        : { name: 'cose', animate: false, nodeRepulsion: () => 9000, idealEdgeLength: () => 70, padding: 20 },
  });
  if (opts.focus) cy.getElementById(opts.focus).addClass('focus');

  cy.on('tap', 'node', (evt) => {
    const href = evt.target.data('href');
    if (href && evt.target.id() !== opts.focus) window.location.href = href;
  });
  cy.on('mouseover', 'node', (evt) => {
    const hood = evt.target.closedNeighborhood();
    cy.elements().not(hood).addClass('faded');
  });
  cy.on('mouseout', 'node', () => cy.elements().removeClass('faded'));
  return cy;
}
