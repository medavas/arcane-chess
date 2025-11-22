import React, { useState, useEffect } from 'react';
import Tree from 'react-d3-tree';
import _ from 'lodash';
// import book1 from 'src/shared/data/books/book1.json';
// import book2 from 'src/shared/data/books/book2.json';
// import book3 from 'src/shared/data/books/book3.json';
// import book4 from 'src/shared/data/books/book4.json';
// import book5 from 'src/shared/data/books/book5.json';
// import book6 from 'src/shared/data/books/book6.json';
// import book7 from 'src/shared/data/books/book7.json';
// import book8 from 'src/shared/data/books/book8.json';
// import book9 from 'src/shared/data/books/book9.json';
// import book10 from 'src/shared/data/books/book10.json';
// import book11 from 'src/shared/data/books/book11.json';
import book12 from 'src/shared/data/books/book12.json';
const microscopeData: any = book12;
interface CustomTreeNodeDatum {
  name: string;
  attributes?: Record<string, string | number>;
  children?: CustomTreeNodeDatum[];
}
function normalizeAttributes(
  attributes?: Record<string, string | number>
): Record<string, string | number> | undefined {
  if (!attributes) return undefined;
  return Object.fromEntries(
    Object.entries(attributes).map(([key, value]) => [
      key,
      typeof value === 'boolean' ? (value ? 'true' : 'false') : value,
    ])
  );
}
function convertToTree(data: Record<string, any>): any {
  const nodeMap: Record<string, any> = {};
  const rootNodes: any[] = [];
  Object.keys(data).forEach((key) => {
    const node = data[key];
    nodeMap[node.id] = {
      name: node.title,
      attributes: normalizeAttributes(node.attributes),
      children: [],
      ...node,
    };
  });
  Object.keys(data).forEach((key) => {
    const node = data[key];
    if (node.prereq && nodeMap[node.prereq]) {
      nodeMap[node.prereq].children?.push(nodeMap[node.id]);
    } else {
      rootNodes.push(nodeMap[node.id]);
    }
  });
  return rootNodes.length === 1
    ? rootNodes[0]
    : { name: 'Root', children: rootNodes };
}
export const Lab = () => {
  const [treeData, setTreeData] = useState<CustomTreeNodeDatum | null>(null);
  const [selectedNode, setSelectedNode] = useState<Record<string, any> | null>(
    null
  );
  useEffect(() => {
    const tree = convertToTree(microscopeData);
    setTreeData(tree);
  }, []);
  const handleNodeClick = (nodeDatum: any) => {
    // Filter and include only the required properties for display
    const filteredNodeDatum = _.omit(nodeDatum, ['children']);
    setSelectedNode(filteredNodeDatum);
  };
  const renderCustomNodeElement = ({ nodeDatum }: any) => (
    <g onClick={() => handleNodeClick(nodeDatum)}>
      <circle r={20} fill="#333" />
      <text fill="#000000" fontSize={16} x={30} y={-30} textAnchor="start">
        {nodeDatum.id}
      </text>
      <text fill="#000000" fontSize={16} x={30} y={-10} textAnchor="start">
        {nodeDatum.title}
      </text>
      <text fill="#000000" fontSize={16} x={30} y={10} textAnchor="start">
        {nodeDatum.hero || 'sidian'}
      </text>
      <text fill="#000000" fontSize={16} x={30} y={30} textAnchor="start">
        {nodeDatum.bookTheme}
      </text>
      <text fill="#000000" fontSize={16} x={30} y={50} textAnchor="start">
        {nodeDatum.theme}
      </text>
      <text fill="#000000" fontSize={16} x={30} y={70} textAnchor="start">
        {nodeDatum.opponent}
      </text>
      <text fill="#000000" fontSize={16} x={30} y={90} textAnchor="start">
        {nodeDatum.storyText !== '' ? '' : 'needs story'}
      </text>
    </g>
  );
  if (!treeData) return <div>Loading...</div>;
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#f5f5f5',
      }}
    >
      <div style={{ flex: 3 }}>
        <Tree
          data={treeData}
          orientation="vertical"
          pathFunc="diagonal"
          translate={{ x: window.innerWidth / 3, y: 250 }}
          nodeSize={{ x: 200, y: 180 }}
          zoom={1.8}
          zoomable
          onNodeClick={(node: any) => {
            handleNodeClick(node.data);
          }}
          renderCustomNodeElement={renderCustomNodeElement}
        />
      </div>
      <div
        style={{
          flex: 1,
          padding: '20px',
          background: '#ddd',
          overflowY: 'auto',
        }}
      >
        {selectedNode ? (
          <div>
            <h2 style={{ color: '#333', fontSize: '20px' }}>Node Details</h2>
            <div
              style={{
                background: '#fff',
                padding: '10px',
                borderRadius: '5px',
                wordWrap: 'break-word',
                fontFamily: 'Arial, sans-serif',
                lineHeight: '1.6',
              }}
            >
              {Object.entries(selectedNode)
                .filter(([key]) => !['panels', 'panelText'].includes(key))
                .map(([key, value]) => (
                  <div key={key} style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#444', fontSize: '16px' }}>
                      {key}:
                    </strong>{' '}
                    <span style={{ color: '#666', fontSize: '15px' }}>
                      {typeof value === 'object'
                        ? JSON.stringify(value, null, 2)
                        : value}
                    </span>
                  </div>
                ))}
              {/* Panels and PanelText as collapsible sections */}
              {selectedNode.panels && (
                <details style={{ marginTop: '10px' }}>
                  <summary
                    style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#444',
                    }}
                  >
                    Panels
                  </summary>
                  <ul>
                    {_.map(selectedNode.panels, (panel: any, index: number) => (
                      <li
                        key={index}
                        style={{ marginBottom: '8px', color: '#666' }}
                      >
                        {typeof panel === 'object' ? (
                          <pre
                            style={{
                              whiteSpace: 'pre-wrap',
                              wordWrap: 'break-word',
                            }}
                          >
                            {JSON.stringify(panel, null, 2)}
                          </pre>
                        ) : (
                          panel
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {selectedNode.panelText && (
                <details style={{ marginTop: '10px' }}>
                  <summary
                    style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#444',
                    }}
                  >
                    Panel Text
                  </summary>
                  <p style={{ color: '#666', marginTop: '5px' }}>
                    {selectedNode.panelText}
                  </p>
                </details>
              )}
            </div>
          </div>
        ) : (
          <p>Click on a node to see its details</p>
        )}
      </div>
    </div>
  );
};
