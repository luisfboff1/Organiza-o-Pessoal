/**
 * Custom BlockNote block para links entre páginas
 */

import { createReactBlockSpec } from '@blocknote/react';
import { PageLinkBlock } from '../components/PageLinkBlock';

export const pageLinkBlock = createReactBlockSpec(
  {
    type: 'pageLink',
    propSchema: {
      pageId: {
        default: '',
      },
      pageTitle: {
        default: '',
      },
      pageIcon: {
        default: '',
      },
    },
    content: 'none',
  },
  {
    render: (props) => <PageLinkBlock {...props} />,
  }
);
