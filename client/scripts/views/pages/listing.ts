import 'components/listing.scss';

import m from 'mithril';
import ListingHeader from 'views/components/listing_header';

const Listing: m.Component<{
  columnHeaders: any[];
  content: any[];
  rightColSpacing: number[];
  menuCarat?: boolean;
}> = {
  view: (vnode) => {
    const { columnHeaders, content, rightColSpacing, menuCarat } = vnode.attrs;
    return m('.Listing', [
      m(ListingHeader, { columnHeaders, rightColSpacing, showMenu: menuCarat }),
      content
    ]);
  }
};

export default Listing;
