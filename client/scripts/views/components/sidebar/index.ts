import 'components/sidebar/index.scss';

import m from 'mithril';
import _ from 'lodash';
import dragula from 'dragula';
import { List, ListItem, PopoverMenu, MenuItem, Icon, Icons, Tag } from 'construct-ui';

import app from 'state';
import { ProposalType } from 'identifiers';
import { ChainClass, ChainBase } from 'models';
import NewTagModal from 'views/modals/new_tag_modal';
import EditTagModal from 'views/modals/edit_tag_modal';

const TagListings: m.Component<{}, { dragulaInitialized: boolean }> = {
  view: (vnode) => {
    const featuredTags = {};
    const otherTags = {};
    const featuredTagIds = app.community?.meta?.featuredTags || app.chain?.meta?.chain?.featuredTags;

    const onDiscussionsPage = (p) => p === `/${app.activeId()}` || p === `/${app.activeId()}/`;

    const getTagRow = (id, name, description) => m(ListItem, {
      key: id,
      contentLeft: m('.tag-icon', { style: 'background: #72b483' }),
      contentRight: [
        m(PopoverMenu, {
          class: 'sidebar-edit-tag',
          position: 'bottom',
          transitionDuration: 0,
          hoverCloseDelay: 0,
          closeOnContentClick: true,
          trigger: m(Icon, {
            name: Icons.CHEVRON_DOWN,
          }),
          content: m(MenuItem, {
            label: 'Edit channel',
            onclick: (e) => {
              app.modals.create({
                modal: EditTagModal,
                data: {
                  description,
                  id,
                  name,
                }
              });
            }
          })
        }),
      ],
      label: name,
      selected: m.route.get() === `/${app.activeId()}/discussions/${encodeURI(name)}`,
      onclick: (e) => {
        e.preventDefault();
        m.route.set(`/${app.activeId()}/discussions/${name}`);
      },
    });

    app.tags.getByCommunity(app.activeId()).forEach((tag) => {
      const { id, name, description } = tag;
      if (featuredTagIds.includes(`${tag.id}`)) {
        featuredTags[tag.name] = { id, name, description, featured_order: featuredTagIds.indexOf(`${id}`) };
      } else {
        otherTags[tag.name] = { id, name, description };
      }
    });
    const otherTagListItems = Object.keys(otherTags)
      .sort((a, b) => otherTags[a].name.localeCompare(otherTags[b].name))
      .map((name, idx) => getTagRow(otherTags[name].id, name, otherTags[name].description));
    const featuredTagListItems = Object.keys(featuredTags)
      .sort((a, b) => Number(featuredTags[a].featured_order) - Number(featuredTags[b].featured_order))
      .map((name, idx) => getTagRow(featuredTags[name].id, name, featuredTags[name].description));

    return [
      m(List, { interactive: true }, [
        m(ListItem, {
          active: onDiscussionsPage(m.route.get()),
          label: 'Home',
          onclick: (e) => m.route.set(`/${app.activeId()}`),
          contentRight: [
            app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })
              && m(PopoverMenu, {
                class: 'sidebar-add-tag',
                position: 'bottom',
                transitionDuration: 0,
                hoverCloseDelay: 0,
                closeOnContentClick: true,
                trigger: m(Icon, {
                  class: 'discussions-home',
                  name: Icons.PLUS_CIRCLE,
                }),
                content: m(MenuItem, {
                  label: 'New channel',
                  onclick: (e) => {
                    e.preventDefault();
                    app.modals.create({ modal: NewTagModal });
                  }
                }),
              }),
          ],
        }),
      ]),
      m(List, {
        class: 'featured-tags-list',
        interactive: true,
        onupdate: (vnode2) => {
          if (app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })
              && !vnode.state.dragulaInitialized) {
            vnode.state.dragulaInitialized = true;
            dragula([vnode2.dom]).on('drop', async (el, target, source) => {
              const reorder = Array.from(source.children).map((child) => {
                return (child as HTMLElement).id;
              });
              await app.community.meta.updateFeaturedTags(reorder);
            });
          }
        }
      }, featuredTagListItems),
      m(List, { class: 'more-tags-list' }, otherTagListItems),
    ];
  }
};

const Sidebar: m.Component<{ activeTag: string }> = {
  view: (vnode) => {
    const { activeTag } = vnode.attrs;
    const activeAccount = app.user.activeAccount;

    // chain menu
    const chains = {};
    app.config.nodes.getAll().forEach((n) => {
      if (chains[n.chain.network]) {
        chains[n.chain.network].push(n);
      } else {
        chains[n.chain.network] = [n];
      }
    });

    // sidebar menu
    const substrateGovernanceProposals = (app.chain?.loaded && app.chain?.base === ChainBase.Substrate)
      ? ((app.chain as any).democracy.store.getAll().filter((p) => !p.completed && !p.passed).length
        + (app.chain as any).democracyProposals.store.getAll().filter((p) => !p.completed).length
        + (app.chain as any).council.store.getAll().filter((p) => !p.completed).length
        + (app.chain as any).treasury.store.getAll().filter((p) => !p.completed).length) : 0;
    const edgewareSignalingProposals = (app.chain?.loaded && app.chain?.class === ChainClass.Edgeware)
      ? (app.chain as any).signaling.store.getAll().filter((p) => !p.completed).length : 0;
    const allSubstrateGovernanceProposals = substrateGovernanceProposals + edgewareSignalingProposals;
    const cosmosGovernanceProposals = (app.chain?.loaded && app.chain?.base === ChainBase.CosmosSDK)
      ? (app.chain as any).governance.store.getAll().filter((p) => !p.completed).length : 0;
    const molochProposals = (app.chain?.loaded && app.chain?.class === ChainClass.Moloch)
      ? (app.chain as any).governance.store.getAll().filter((p) => !p.completed).length : 0;

    const hasProposals = app.chain && !app.community && (
      app.chain.base === ChainBase.CosmosSDK
        || app.chain.base === ChainBase.Substrate
        || app.chain.class === ChainClass.Moloch);
    const showMolochMenuOptions = activeAccount && app.chain?.class === ChainClass.Moloch;
    const showMolochMemberOptions = showMolochMenuOptions && (activeAccount as any)?.shares?.gtn(0);

    const onMembersPage = (p) => p.startsWith(`/${app.activeId()}/members`);
    const onTagsPage = (p) => p.startsWith(`/${app.activeId()}/tags`);
    const onChatPage = (p) => p.startsWith(`/${app.activeId()}/chat`);
    const onNotificationsPage = (p) => p.startsWith('/notifications');
    const onProposalPage = (p) => (
      p.startsWith(`/${app.activeChainId()}/proposals`)
        || p.startsWith(`/${app.activeChainId()}/signaling`)
        || p.startsWith(`/${app.activeChainId()}/treasury`)
        || p.startsWith(`/${app.activeChainId()}/proposal/referendum`)
        || p.startsWith(`/${app.activeChainId()}/proposal/councilmotion`)
        || p.startsWith(`/${app.activeChainId()}/proposal/democracyproposal`)
        || p.startsWith(`/${app.activeChainId()}/proposal/signalingproposal`)
        || p.startsWith(`/${app.activeChainId()}/proposal/treasuryproposal`));
    const onCouncilPage = (p) => p.startsWith(`/${app.activeChainId()}/council`);
    const onValidatorsPage = (p) => p.startsWith(`/${app.activeChainId()}/validators`);
    if (onNotificationsPage(m.route.get())) return;

    return m('.Sidebar', {
      class: `${app.isLoggedIn() ? 'logged-in' : 'logged-out'} `
        + `${(app.community || app.chain) ? 'active-community' : 'no-active-community'}`,
    }, (!app.community && !app.chain) ? [
      // no community
      m(List, { interactive: true }, [
        m(ListItem, {
          contentLeft: m(Icon, { name: Icons.USER, }),
          label: 'Settings',
          onclick: (e) => m.route.set('/settings'),
        }),
        m(ListItem, {
          contentLeft: m(Icon, { name: Icons.VOLUME_2, }),
          label: 'Notifications',
          onclick: (e) => m.route.set('/notification-settings'),
        }),
      ]),
    ] : [
      // discussions
      m(TagListings),
      // proposals
      hasProposals
        && m(List, { interactive: true }, [
          // proposals (substrate, cosmos, moloch only)
          m(ListItem, {
            active: onProposalPage(m.route.get()),
            label: 'Proposals',
            onclick: (e) => m.route.set(`/${app.activeChainId()}/proposals`),
            // contentRight: [
            //   (app.chain?.base === ChainBase.Substrate)
            //     && m(Tag, {
            //       rounded: true,
            //       label: app.chain?.loaded ? allSubstrateGovernanceProposals : '-',
            //     }),
            //   (app.chain?.base === ChainBase.CosmosSDK) && m(Tag, {
            //     rounded: true,
            //     label: app.chain?.loaded ? cosmosGovernanceProposals : '-',
            //   }),
            //   (app.chain?.class === ChainClass.Moloch) && m(Tag, {
            //     rounded: true,
            //     label: app.chain?.loaded ? molochProposals : '-',
            //   }),
            // ],
          }),
          // council (substrate only)
          !app.community && app.chain?.base === ChainBase.Substrate
            && m(ListItem, {
              active: onCouncilPage(m.route.get()),
              label: 'Council',
              onclick: (e) => m.route.set(`/${app.activeChainId()}/council`),
              contentRight: [], // TODO
            }),
          // validators (substrate and cosmos only)
          // !app.community && (app.chain?.base === ChainBase.CosmosSDK || app.chain?.base === ChainBase.Substrate) &&
          //   m(ListItem, {
          //     contentLeft: m(Icon, { name: Icons.SHARE_2 }),
          //     active: onValidatorsPage(m.route.get()),
          //     label: 'Validators',
          //     onclick: (e) => m.route.set(`/${app.activeChainId()}/validators`),
          //   }),
          showMolochMemberOptions && m(ListItem, {
            onclick: (e) => {
              m.route.set(`/${app.activeChainId()}/new/proposal/:type`, { type: ProposalType.MolochProposal });
            },
            label: 'New proposal',
            contentLeft: m(Icon, { name: Icons.FILE_PLUS }),
          }),
          showMolochMemberOptions && m(ListItem, {
            onclick: (e) => app.modals.lazyCreate('update_delegate_modal', {
              account: activeAccount,
              delegateKey: (activeAccount as any).delegateKey,
            }),
            label: 'Update delegate key',
            contentLeft: m(Icon, { name: Icons.KEY }),
          }),
          showMolochMemberOptions && m(ListItem, {
            onclick: (e) => app.modals.lazyCreate('ragequit_modal', { account: activeAccount }),
            label: 'Rage quit',
            contentLeft: m(Icon, { name: Icons.FILE_MINUS }),
          }),
          showMolochMenuOptions && m(ListItem, {
            onclick: (e) => app.modals.lazyCreate('token_management_modal', {
              account: activeAccount,
              accounts: ((activeAccount as any).app.chain as any).ethAccounts,
              contractAddress: ((activeAccount as any).app.chain as any).governance.api.contractAddress,
              tokenAddress: ((activeAccount as any).app.chain as any).governance.api.tokenContract.address,
            }),
            label: 'Approve tokens',
            contentLeft: m(Icon, { name: Icons.POWER }),
          }),
        ]),
    ]);
  },
};

export default Sidebar;
