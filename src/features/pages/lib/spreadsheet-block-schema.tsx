import { defaultBlockSpecs } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import { SpreadsheetBlock } from '../components/SpreadsheetBlock';

const defaultSpreadsheetData = [
  ['', '', '', '', ''],
  ['', '', '', '', ''],
  ['', '', '', '', ''],
  ['', '', '', '', ''],
  ['', '', '', '', ''],
];

// Define o bloco de planilha customizado
export const spreadsheetBlock = createReactBlockSpec(
  {
    type: 'spreadsheet',
    propSchema: {
      dataJson: {
        default: JSON.stringify(defaultSpreadsheetData),
      },
    },
    content: 'none',
  },
  {
    render: (props) => {
      const data = props.block.props.dataJson
        ? JSON.parse(props.block.props.dataJson as string)
        : defaultSpreadsheetData;

      return (
        <SpreadsheetBlock
          data={data}
          onChange={(newData) => {
            props.editor.updateBlock(props.block, {
              props: { dataJson: JSON.stringify(newData) },
            });
          }}
        />
      );
    },
  }
);

// Schema que inclui blocos padrão + bloco de planilha
export const blockSpecs = {
  ...defaultBlockSpecs,
  spreadsheet: spreadsheetBlock,
};
