import m from 'mithril';
import $ from 'jquery';
import { OffchainThread, OffchainTag } from 'models';
import { Button, Classes, Dialog, Icon, Icons, Tag, TagInput, MenuItem } from 'construct-ui';
import app from 'state';
import AutoCompleteTagForm from './autocomplete_tag_form';

interface ITagEditorAttrs {
  thread: OffchainThread;
  popoverMenu?: boolean;
  onChangeHandler: Function;
}

const TagWindow: m.Component<{ currentTag: OffchainTag, onChangeHandler: Function }> = {
  view: (vnode) => {
    const { onChangeHandler, currentTag } = vnode.attrs;
    const activeMeta = app.chain ? app.chain.meta.chain : app.community.meta;
    const featuredTags = activeMeta.featuredTags.map((t) => {
      return app.tags.getByCommunity(app.activeId()).find((t_) => Number(t) === t_.id);
    });
    return m(AutoCompleteTagForm, {
      tags: app.tags.getByCommunity(app.activeId()),
      featuredTags,
      updateFormData: onChangeHandler,
    });
  }
};

const TagEditor: m.Component<ITagEditorAttrs, { tag: OffchainTag, isOpen: boolean }> = {
  oncreate: (vnode) => {
    vnode.state.tag = vnode.attrs.thread.tag;
  },
  oninit: (vnode) => {
    if (vnode.state.isOpen === undefined) vnode.state.isOpen = false;
  },
  view: (vnode) => {
    return m('TagEditor', [
      vnode.attrs.popoverMenu
        ? m(MenuItem, {
          iconLeft: Icons.TAG,
          fluid: true,
          label: 'Edit Tags',
          onclick: (e) => { e.preventDefault(); vnode.state.isOpen = true; },
        })
        : m('a', {
          href: '#',
          onclick: (e) => { e.preventDefault(); vnode.state.isOpen = true; },
        }, [ 'Edit tags' ]),
      m(Dialog, {
        basic: false,
        closeOnEscapeKey: true,
        closeOnOutsideClick: true,
        content: m(TagWindow, {
          currentTag: vnode.state.tag,
          onChangeHandler: (tag: OffchainTag) => { vnode.state.tag = tag; },
        }),
        hasBackdrop: true,
        isOpen: vnode.state.isOpen,
        inline: false,
        onClose: () => { vnode.state.isOpen = false; },
        title: 'Edit Tags',
        transitionDuration: 200,
        footer: m(`.${Classes.ALIGN_RIGHT}`, [
          m(Button, {
            label: 'Close',
            onclick: () => { vnode.state.isOpen = false; },
          }),
          m(Button, {
            label: 'Submit',
            intent: 'primary',
            onclick: () => {
              $.post(`${app.serverUrl()}/updateTags`, {
                'jwt': app.login.jwt,
                'thread_id': vnode.attrs.thread.id,
                'tag': vnode.state.tag.id,
                'address': app.vm.activeAccount.address,
              }).then((r) => {
                const tag: OffchainTag = r.result;
                vnode.attrs.onChangeHandler(tag);
              });
              vnode.state.isOpen = false;
            },
          }),
        ])
      })
    ]);
  }
};

export default TagEditor;
