import m from 'mithril';

import app from 'state';
import { List, ListItem, PopoverMenu, MenuItem, Icon, Icons, Tag } from 'construct-ui';

import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';
import ManageCommunityModal from 'views/modals/manage_community_modal';

const removeUrlPrefix = (url) => {
  return url.replace(/^https?:\/\//, '');
};

const CommunityInfoModule: m.Component<{ communityName: string, communityDescription: string , tag?: string }> = {
  view: (vnode) => {
    const { communityName, communityDescription, tag } = vnode.attrs;
    if (!app.chain && !app.community) return;

    const isAdmin = app.user.isRoleOfCommunity({
      role: 'admin',
      chain: app.activeChainId(),
      community: app.activeCommunityId()
    });

    const meta = app.chain ? app.chain.meta.chain : app.community.meta;
    const { name, description, website, chat, telegram, github } = meta;

    return m('.CommunityInfoModule.SidebarModule', [
      // m(TagCaratMenu, { tag }),
      // tag && [
      //   m(Subheader, { text: `About #${tag}` }),
      //   m('p', app.tags.store.getByName(tag, app.chain ? app.chain.meta.id : app.community.meta.id)?.description),
      // ],

      m('.community-icon', [
        app.chain && m(ChainIcon, { chain: app.chain.meta.chain, size: 48 }),
        app.community && m(CommunityIcon, { community: app.community.meta }),
      ]),
      m('.community-name', name),
      m('.community-description', description),
      isAdmin && m(PopoverMenu, {
        class: 'community-config-menu',
        position: 'bottom',
        transitionDuration: 0,
        hoverCloseDelay: 0,
        closeOnContentClick: true,
        trigger: m(Icon, { class: 'community-config', name: Icons.CHEVRON_DOWN }),
        content: m(MenuItem, {
          label: 'Edit community',
          onclick: (e) => {
            e.preventDefault();
            app.modals.create({ modal: ManageCommunityModal });
          }
        }),
      }),
      website && m('.community-info', [
        m(Icon, { name: Icons.GLOBE }),
        m('a.community-info-text', {
          target: '_blank',
          href: website
        }, removeUrlPrefix(website)),
      ]),
      chat && m('.community-info', [
        m(Icon, { name: Icons.MESSAGE_SQUARE }),
        m('a.community-info-text', {
          target: '_blank',
          href: chat
        }, removeUrlPrefix(chat)),
      ]),
      telegram && m('.community-info', [
        m(Icon, { name: Icons.SEND }),
        m('a.community-info-text', {
          target: '_blank',
          href: telegram
        }, removeUrlPrefix(telegram)),
      ]),
      github && m('.community-info', [
        m(Icon, { name: Icons.GITHUB }),
        m('a.community-info-text', {
          target: '_blank',
          href: github
        }, removeUrlPrefix(github)),
      ]),
    ]);
  }
};

export default CommunityInfoModule;